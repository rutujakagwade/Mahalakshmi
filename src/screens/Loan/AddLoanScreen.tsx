import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import tw from 'twrnc';
import { AppDatePicker } from '../../components/AppDatePicker';
import { AppDropdown } from '../../components/AppDropdown';
import { getTodayFormatted } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';
import { LoanService, MachineService } from '../../utils/api';
import { SafeStorage } from '../../utils/storage';
import { CCLoanAccount, CCTransaction } from '../../types/loan';
import {
  CreditCard,
  Clock,
  Bell,
  CheckCircle,
  ArrowLeft,
  IndianRupee,
  Calendar as CalendarIcon,
  StickyNote,
  Building,
  FileText,
  Landmark,
  Percent,
  Truck,
} from 'lucide-react-native';

interface AddLoanScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

type LoanCategory = 'emi' | 'cc';

export const AddLoanScreen: React.FC<AddLoanScreenProps> = ({ onBack, onSuccess }) => {
  const [loanCategory, setLoanCategory] = useState<LoanCategory>('emi');

  // ── Regular EMI Loan Fields ──
  const [name, setName] = useState<string>('');
  const [loanType, setLoanType] = useState<string>('मशीन कर्ज (Machine Loan)');
  const [lenderName, setLenderName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(getTodayFormatted());
  const [firstInstallmentDate, setFirstInstallmentDate] = useState<string>(getTodayFormatted());
  const [emiAmount, setEmiAmount] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('monthly');
  const [totalInstallments, setTotalInstallments] = useState<string>('');
  const [reminderDays, setReminderDays] = useState<string>('3');
  const [notes, setNotes] = useState<string>('');

  // ── CC Loan Fields ──
  const [ccBankName, setCcBankName] = useState<string>('');
  const [ccAccountNo, setCcAccountNo] = useState<string>('');
  const [ccLimit, setCcLimit] = useState<string>('');
  const [ccInitialUsed, setCcInitialUsed] = useState<string>('');
  const [ccInterestRate, setCcInterestRate] = useState<string>('9.5');
  const [ccRenewalDate, setCcRenewalDate] = useState<string>(getTodayFormatted());
  const [ccLinkedMachine, setCcLinkedMachine] = useState<string>('');
  const [ccNotes, setCcNotes] = useState<string>('');

  const [machinesList, setMachinesList] = useState<any[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedMsg, setSavedMsg] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const res = await MachineService.getAll();
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setMachinesList(list);
      } catch {}
    })();
  }, []);

  const getIsoDate = (dStr: string) => {
    if (!dStr) return new Date().toISOString().split('T')[0];
    const parts = dStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dStr;
  };

  const numTotalAmt = parseFloat(totalAmount.replace(/,/g, '')) || 0;
  const numEmiAmt = parseFloat(emiAmount.replace(/,/g, '')) || 0;
  const numInstallments = parseInt(totalInstallments, 10) || 0;

  const handleAutoCalcInstallments = () => {
    if (numTotalAmt > 0 && numEmiAmt > 0) {
      const estimated = Math.ceil(numTotalAmt / numEmiAmt);
      setTotalInstallments(String(estimated));
    }
  };

  // ── Save Regular EMI Loan ──
  const handleSaveEMILoan = async () => {
    if (!name.trim()) {
      Alert.alert('त्रुटी', 'कृपया कर्जाचे नाव टाका.');
      return;
    }
    if (!lenderName.trim()) {
      Alert.alert('त्रुटी', 'कृपया बँक किंवा सावकाराचे नाव टाका.');
      return;
    }
    if (numTotalAmt <= 0) {
      Alert.alert('त्रुटी', 'कृपया योग्य एकूण कर्ज रक्कम टाका.');
      return;
    }
    if (numEmiAmt <= 0) {
      Alert.alert('त्रुटी', 'कृपया हप्ता (EMI) रक्कम टाका.');
      return;
    }
    if (numInstallments <= 0) {
      Alert.alert('त्रुटी', 'कृपया एकूण हप्त्यांची संख्या टाका.');
      return;
    }

    setSaving(true);
    try {
      await LoanService.create({
        name: name.trim(),
        loan_type: loanType,
        lender_name: lenderName.trim(),
        account_number: accountNumber.trim() || undefined,
        total_amount: numTotalAmt,
        interest_rate: parseFloat(interestRate) || undefined,
        start_date: getIsoDate(startDate),
        emi_amount: numEmiAmt,
        frequency: frequency as any,
        first_installment_date: getIsoDate(firstInstallmentDate),
        total_installments: numInstallments,
        reminder_days_before: parseInt(reminderDays, 10) || 3,
        notes: notes.trim() || undefined,
      });

      setSavedMsg('कर्ज यशस्वीरित्या जतन झाले!');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (e: any) {
      Alert.alert('त्रुटी', e.message || 'कर्ज जतन करता आले नाही.');
    } finally {
      setSaving(false);
    }
  };

  // ── Save CC Loan ──
  const handleSaveCCLoan = async () => {
    if (!ccBankName.trim()) {
      Alert.alert('त्रुटी', 'कृपया बँक किंवा संस्थेचे नाव टाका.');
      return;
    }
    const limit = parseFloat(ccLimit.replace(/,/g, '')) || 0;
    if (limit <= 0) {
      Alert.alert('त्रुटी', 'कृपया वैध CC मर्यादा (Limit) टाका.');
      return;
    }
    const used = parseFloat(ccInitialUsed.replace(/,/g, '')) || 0;
    const rate = parseFloat(ccInterestRate) || 9.5;

    setSaving(true);
    try {
      const stored = await SafeStorage.getItem('@mahalaxmi_cc_loans_v1');
      let existingList: CCLoanAccount[] = [];
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) existingList = parsed;
        } catch {}
      }

      const newId = `cc_${Date.now()}`;
      const initialTx: CCTransaction[] = [];
      if (used > 0) {
        initialTx.push({
          id: `tx_${Date.now()}`,
          ccLoanId: newId,
          date: ccRenewalDate || getTodayFormatted(),
          type: 'withdraw',
          amount: used,
          description: 'सुरुवातीची उचल शिल्लक (Opening Balance)',
          balanceAfter: used,
          paymentMethod: 'bank_transfer',
          createdAt: new Date().toISOString(),
        });
      }

      const newAccount: CCLoanAccount = {
        id: newId,
        bankName: ccBankName.trim(),
        accountNumber: ccAccountNo.trim() || undefined,
        sanctionLimit: limit,
        currentOutstanding: used,
        interestRate: rate,
        renewalDate: ccRenewalDate,
        linkedMachine: ccLinkedMachine.trim() || undefined,
        notes: ccNotes.trim() || undefined,
        transactions: initialTx,
        createdAt: new Date().toISOString(),
      };

      await SafeStorage.setItem('@mahalaxmi_cc_loans_v1', JSON.stringify([newAccount, ...existingList]));
      setSavedMsg('CC कर्ज खाते यशस्वीरित्या जतन झाले!');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch {
      Alert.alert('त्रुटी', 'CC कर्ज खाते जतन करता आले नाही.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Maroon Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {loanCategory === 'emi' ? 'नवीन कर्ज जोडा (Add Loan)' : 'नवीन CC कर्ज जोडा (Cash Credit)'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Saved message banner */}
        {savedMsg ? (
          <View style={styles.successBanner}>
            <CheckCircle size={18} color="#16A34A" />
            <Text style={styles.successText}>{savedMsg}</Text>
          </View>
        ) : null}

        {/* ── Top Category Switcher: [ हप्ते कर्ज ] vs [ CC कर्ज ] ── */}
        <View style={styles.categorySegmentContainer}>
          <TouchableOpacity
            onPress={() => setLoanCategory('emi')}
            style={[styles.categorySegmentBtn, loanCategory === 'emi' && styles.categorySegmentBtnActiveEMI]}
            activeOpacity={0.8}
          >
            <Landmark size={16} color={loanCategory === 'emi' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.categorySegmentText, loanCategory === 'emi' && styles.categorySegmentTextActive]}>
              हप्ते कर्ज (EMI Loan)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setLoanCategory('cc')}
            style={[styles.categorySegmentBtn, loanCategory === 'cc' && styles.categorySegmentBtnActiveCC]}
            activeOpacity={0.8}
          >
            <CreditCard size={16} color={loanCategory === 'cc' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.categorySegmentText, loanCategory === 'cc' && styles.categorySegmentTextActive]}>
              CC कर्ज (Cash Credit)
            </Text>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════════════════════
            FORM 1: REGULAR EMI LOAN FORM
        ═══════════════════════════════════════════════════════════════════ */}
        {loanCategory === 'emi' ? (
          <>
            {/* Section 1: बेसिक माहिती */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionHeader}>१. कर्जाची माहिती</Text>

              {/* कर्जाचे नाव */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <CreditCard size={16} color="#78350F" />
                  <Text style={styles.labelText}>कर्जाचे नाव <Text style={styles.requiredStar}>*</Text></Text>
                </View>
                <TextInput
                  style={styles.textInputBox}
                  value={name}
                  onChangeText={setName}
                  placeholder="उदा. JCB 3DX कर्ज / वैयक्तिक कर्ज"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* कर्ज प्रकार */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <FileText size={16} color="#78350F" />
                  <Text style={styles.labelText}>कर्ज प्रकार</Text>
                </View>
                <AppDropdown
                  label=""
                  value={loanType}
                  options={[
                    'मशीन कर्ज (Machine Loan)',
                    'वाहन कर्ज (Vehicle Loan)',
                    'वैयक्तिक कर्ज (Personal Loan)',
                    'व्यवसाय कर्ज (Business Loan)',
                    'सोने तारण कर्ज (Gold Loan)',
                    'इतर कर्ज (Other)',
                  ]}
                  onSelect={setLoanType}
                />
              </View>

              {/* बँक / सावकार नाव */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <Building size={16} color="#78350F" />
                  <Text style={styles.labelText}>बँक / सावकाराचे नाव <Text style={styles.requiredStar}>*</Text></Text>
                </View>
                <TextInput
                  style={styles.textInputBox}
                  value={lenderName}
                  onChangeText={setLenderName}
                  placeholder="उदा. HDFC Bank / SBI / फायनान्स कंपनी"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* कर्ज खाते क्रमांक */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <StickyNote size={16} color="#78350F" />
                  <Text style={styles.labelText}>खाते / लोन क्रमांक (ऐच्छिक)</Text>
                </View>
                <TextInput
                  style={styles.textInputBox}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="उदा. LAN12345678"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Section 2: आर्थिक माहिती */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionHeader}>२. रक्कम व हप्ता तपशील</Text>

              {/* एकूण कर्ज रक्कम */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <IndianRupee size={16} color="#78350F" />
                  <Text style={styles.labelText}>एकूण कर्ज रक्कम (₹) <Text style={styles.requiredStar}>*</Text></Text>
                </View>
                <TextInput
                  style={[styles.textInputBox, styles.amountInput]}
                  value={totalAmount}
                  onChangeText={setTotalAmount}
                  placeholder="उदा. 2500000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* हप्ता (EMI) रक्कम */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <IndianRupee size={16} color="#78350F" />
                  <Text style={styles.labelText}>हप्ता (EMI) रक्कम (₹) <Text style={styles.requiredStar}>*</Text></Text>
                </View>
                <TextInput
                  style={[styles.textInputBox, styles.amountInput, { color: '#059669' }]}
                  value={emiAmount}
                  onChangeText={setEmiAmount}
                  placeholder="उदा. 55000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  onBlur={handleAutoCalcInstallments}
                />
              </View>

              {/* एकूण हप्ते সংখ্যা */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <Clock size={16} color="#78350F" />
                  <Text style={styles.labelText}>एकूण हप्त्यांची संख्या <Text style={styles.requiredStar}>*</Text></Text>
                </View>
                <TextInput
                  style={styles.textInputBox}
                  value={totalInstallments}
                  onChangeText={setTotalInstallments}
                  placeholder="उदा. 48"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* व्याज दर */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <Percent size={16} color="#78350F" />
                  <Text style={styles.labelText}>व्याज दर (% वार्षिक, ऐच्छिक)</Text>
                </View>
                <TextInput
                  style={styles.textInputBox}
                  value={interestRate}
                  onChangeText={setInterestRate}
                  placeholder="उदा. 8.5"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Section 3: तारखा व रिमाइंडर */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionHeader}>३. तारखा व रिमाइंडर</Text>

              {/* कर्ज सुरू तारीख */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <CalendarIcon size={16} color="#78350F" />
                  <Text style={styles.labelText}>कर्ज सुरू तारीख <Text style={styles.requiredStar}>*</Text></Text>
                </View>
                <AppDatePicker label="" value={startDate} onChange={setStartDate} />
              </View>

              {/* पहिल्या हप्त्याची तारीख */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <CalendarIcon size={16} color="#78350F" />
                  <Text style={styles.labelText}>पहिल्या हप्त्याची तारीख <Text style={styles.requiredStar}>*</Text></Text>
                </View>
                <AppDatePicker label="" value={firstInstallmentDate} onChange={setFirstInstallmentDate} />
              </View>

              {/* रिमाइंडर दिवस */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <Bell size={16} color="#78350F" />
                  <Text style={styles.labelText}>रिमाइंडर (हप्त्यापूर्वी दिवस)</Text>
                </View>
                <TextInput
                  style={styles.textInputBox}
                  value={reminderDays}
                  onChangeText={setReminderDays}
                  placeholder="उदा. 3"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* टिप / शेरा */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <StickyNote size={16} color="#78350F" />
                  <Text style={styles.labelText}>टिप / शेरा (Notes)</Text>
                </View>
                <TextInput
                  style={[styles.textInputBox, { minHeight: 60, textAlignVertical: 'top' }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="इतर कोणतीही माहिती..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSaveEMILoan}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>
                {saving ? 'जतन होत आहे...' : 'कर्ज जतन करा (Save Loan)'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════
              FORM 2: CC LOAN (CASH CREDIT / OVERDRAFT) FORM
          ═══════════════════════════════════════════════════════════════════ */
          <>
            <View style={styles.cardSection}>
              <Text style={[styles.sectionHeader, { color: '#78350F' }]}>१. CC बँक व खाते तपशील</Text>

              {/* बँक नाव */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <Building size={16} color="#78350F" />
                  <Text style={styles.labelText}>बँक किंवा संस्थेचे नाव <Text style={styles.requiredStar}>*</Text></Text>
                </View>
                <TextInput
                  style={styles.textInputBox}
                  value={ccBankName}
                  onChangeText={setCcBankName}
                  placeholder="उदा. बँक ऑफ महाराष्ट्र CC / SBI Overdraft"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* खाते क्रमांक */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <CreditCard size={16} color="#78350F" />
                  <Text style={styles.labelText}>CC खाते क्रमांक (ऐच्छिक)</Text>
                </View>
                <TextInput
                  style={styles.textInputBox}
                  value={ccAccountNo}
                  onChangeText={setCcAccountNo}
                  placeholder="उदा. 60123456789"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* संबंधित मशीन */}
              {machinesList.length > 0 ? (
                <View style={styles.inputRow}>
                  <View style={tw`flex-row justify-between items-center mb-1`}>
                    <View style={styles.labelContainer}>
                      <Truck size={16} color="#78350F" />
                      <Text style={styles.labelText}>संबंधित मशीन / तारण</Text>
                    </View>
                    {ccLinkedMachine ? (
                      <TouchableOpacity onPress={() => setCcLinkedMachine('')}>
                        <Text style={tw`text-[11px] text-red-600 font-bold`}>काढून टाका</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`flex-row gap-1.5 py-1`}>
                    {machinesList.map((m: any) => {
                      const mName = m.name || m.machine_name;
                      const isSel = ccLinkedMachine === mName;
                      return (
                        <TouchableOpacity
                          key={m.id || mName}
                          onPress={() => setCcLinkedMachine(isSel ? '' : mName)}
                          style={[styles.machineChip, isSel && styles.machineChipActive]}
                          activeOpacity={0.7}
                        >
                          <Truck size={12} color={isSel ? '#78350F' : '#4B5563'} />
                          <Text style={[styles.machineChipText, isSel && styles.machineChipTextActive]}>
                            {mName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}
            </View>

            <View style={styles.cardSection}>
              <Text style={[styles.sectionHeader, { color: '#78350F' }]}>२. मर्यादा व उचल तपशील</Text>

              {/* मंजूर CC मर्यादा */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <IndianRupee size={16} color="#78350F" />
                  <Text style={styles.labelText}>मंजूर CC मर्यादा (Limit ₹) <Text style={styles.requiredStar}>*</Text></Text>
                </View>
                <TextInput
                  style={[styles.textInputBox, styles.amountInput]}
                  value={ccLimit}
                  onChangeText={setCcLimit}
                  placeholder="उदा. 1000000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* सध्या वापरलेली उचल */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <IndianRupee size={16} color="#DC2626" />
                  <Text style={styles.labelText}>सध्या वापरलेली उचल (Used ₹)</Text>
                </View>
                <TextInput
                  style={[styles.textInputBox, styles.amountInput, { color: '#DC2626' }]}
                  value={ccInitialUsed}
                  onChangeText={setCcInitialUsed}
                  placeholder="उदा. 450000 (नसल्यास 0 ठेवा)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* व्याज दर */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <Percent size={16} color="#78350F" />
                  <Text style={styles.labelText}>वार्षिक व्याज दर (% Interest)</Text>
                </View>
                <TextInput
                  style={styles.textInputBox}
                  value={ccInterestRate}
                  onChangeText={setCcInterestRate}
                  placeholder="उदा. 9.5"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* रिन्यूअल तारीख */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <CalendarIcon size={16} color="#78350F" />
                  <Text style={styles.labelText}>रिन्यूअल / एक्सपायरी तारीख</Text>
                </View>
                <AppDatePicker label="" value={ccRenewalDate} onChange={setCcRenewalDate} />
              </View>

              {/* टिप */}
              <View style={styles.inputRow}>
                <View style={styles.labelContainer}>
                  <StickyNote size={16} color="#78350F" />
                  <Text style={styles.labelText}>टिप / शेरा (Notes)</Text>
                </View>
                <TextInput
                  style={[styles.textInputBox, { minHeight: 60, textAlignVertical: 'top' }]}
                  value={ccNotes}
                  onChangeText={setCcNotes}
                  placeholder="उदा. स्टॉक तारण, शाखेचे नाव..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>
            </View>

            {/* Save CC Button */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: '#78350F' }, saving && { opacity: 0.7 }]}
              onPress={handleSaveCCLoan}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>
                {saving ? 'जतन होत आहे...' : 'CC कर्ज जतन करा (Save CC Loan)'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: '#6B121C',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: 'white', flex: 1, marginLeft: 12 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 14 },
  successBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: { color: '#15803D', fontSize: 13, fontWeight: '700' },
  categorySegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  categorySegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  categorySegmentBtnActiveEMI: {
    backgroundColor: '#6B121C',
  },
  categorySegmentBtnActiveCC: {
    backgroundColor: '#78350F',
  },
  categorySegmentText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  categorySegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  sectionHeader: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#6B121C',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
    marginBottom: 4,
  },
  inputRow: { gap: 6 },
  labelContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  labelText: { fontSize: 12.5, fontWeight: '700', color: '#374151' },
  requiredStar: { color: '#DC2626' },
  textInputBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  amountInput: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  machineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  machineChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  machineChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  machineChipTextActive: {
    color: '#78350F',
    fontWeight: '800',
  },
  saveBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default AddLoanScreen;
