import React, { useState } from 'react';
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
import { LoanService } from '../../utils/api';
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
} from 'lucide-react-native';

interface AddLoanScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AddLoanScreen: React.FC<AddLoanScreenProps> = ({ onBack, onSuccess }) => {
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

  const [saving, setSaving] = useState<boolean>(false);
  const [savedMsg, setSavedMsg] = useState<string>('');

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

  const handleSave = async () => {
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
        first_installment_date: getIsoDate(firstInstallmentDate),
        emi_amount: numEmiAmt,
        frequency,
        total_installments: numInstallments,
        reminder_days_before: parseInt(reminderDays, 10) || 3,
        notes: notes.trim() || undefined,
      });

      setSavedMsg('नवीन कर्ज यशस्वीरित्या जतन झाले!');
      setTimeout(() => {
        setSavedMsg('');
        onSuccess();
      }, 1200);
    } catch (err: any) {
      Alert.alert('त्रुटी', err?.message || 'कर्ज सेव्ह करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>नवीन कर्ज जोडा</Text>
        <TouchableOpacity
          style={styles.saveHeaderBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveHeaderBtnText}>{saving ? '...' : 'जतन करा'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {savedMsg ? (
          <View style={styles.successBanner}>
            <CheckCircle size={16} color="#15803D" />
            <Text style={styles.successText}>{savedMsg}</Text>
          </View>
        ) : null}

        {/* कर्जाचे नाव */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <CreditCard size={18} color="#78350F" />
            <Text style={styles.labelText}>कर्जाचे नाव <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={name}
            onChangeText={setName}
            placeholder="उदा. JCB 3DX कर्ज / ट्रॅक्टर कर्ज"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* कर्जाचा प्रकार */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <FileText size={18} color="#78350F" />
            <Text style={styles.labelText}>कर्जाचा प्रकार <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <View style={styles.dropdownWrapper}>
            <AppDropdown
              label=""
              value={loanType}
              onChangeText={setLoanType}
              options={[
                { label: 'मशीन कर्ज (Machine Loan)', value: 'मशीन कर्ज (Machine Loan)' },
                { label: 'वाहन कर्ज (Vehicle Loan)', value: 'वाहन कर्ज (Vehicle Loan)' },
                { label: 'व्यवसाय कर्ज (Business Loan)', value: 'व्यवसाय कर्ज (Business Loan)' },
                { label: 'वैयक्तिक कर्ज (Personal Loan)', value: 'वैयक्तिक कर्ज (Personal Loan)' },
                { label: 'गृहकर्ज (Home Loan)', value: 'गृहकर्ज (Home Loan)' },
                { label: 'सावकारी / खाजगी कर्ज', value: 'सावकारी / खाजगी कर्ज' },
              ]}
            />
          </View>
        </View>

        {/* बँक / सावकाराचे नाव */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <Building size={18} color="#78350F" />
            <Text style={styles.labelText}>बँक / सावकार <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={lenderName}
            onChangeText={setLenderName}
            placeholder="उदा. HDFC Bank, SBI, कोटक"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* कर्ज खाते क्रमांक */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <FileText size={18} color="#78350F" />
            <Text style={styles.labelText}>खाते क्रमांक</Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="उदा. LN-12345678"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* एकूण कर्ज रक्कम */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <IndianRupee size={18} color="#78350F" />
            <Text style={styles.labelText}>एकूण कर्ज (₹) <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={totalAmount}
            onChangeText={setTotalAmount}
            placeholder="उदा. 1000000"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>

        {/* वार्षिक व्याजदर */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <FileText size={18} color="#78350F" />
            <Text style={styles.labelText}>व्याजदर (%)</Text>
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

        {/* सुरुवात तारीख */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <CalendarIcon size={18} color="#78350F" />
            <Text style={styles.labelText}>सुरुवात तारीख <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <View style={styles.dateInputWrapper}>
            <AppDatePicker label="" value={startDate} onChange={setStartDate} />
          </View>
        </View>

        {/* हप्ता रक्कम & एकूण हप्ते */}
        <View style={styles.calcCard}>
          <View style={styles.calcTopRow}>
            <View style={styles.calcCol}>
              <Text style={styles.calcColLabel}>हप्ता रक्कम (EMI ₹) *</Text>
              <TextInput
                style={styles.calcInput}
                value={emiAmount}
                onChangeText={setEmiAmount}
                placeholder="25000"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.calcDivider} />

            <View style={styles.calcCol}>
              <Text style={styles.calcColLabel}>एकूण हप्ते *</Text>
              <TextInput
                style={styles.calcInput}
                value={totalInstallments}
                onChangeText={setTotalInstallments}
                placeholder="24"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Total Calculation Row */}
          <View style={styles.calcBottomRow}>
            <Text style={styles.calcTotalLabel}>एकूण परतफेड बेरीज</Text>
            <Text style={styles.calcTotalValue}>
              {numEmiAmt > 0 && numInstallments > 0
                ? formatCurrency(numEmiAmt * numInstallments)
                : '₹ 0'}
            </Text>
          </View>
        </View>

        {/* Auto calculate hint button */}
        {numTotalAmt > 0 && numEmiAmt > 0 && !totalInstallments ? (
          <TouchableOpacity
            onPress={handleAutoCalcInstallments}
            style={styles.autoCalcBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.autoCalcText}>
              ⚡ एकूण रक्कम व EMI नुसार हप्ते मोजा (अंदाजे {Math.ceil(numTotalAmt / numEmiAmt)} हप्ते)
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* वारंवारता & पहिला हप्ता */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <Clock size={18} color="#78350F" />
            <Text style={styles.labelText}>वारंवारता</Text>
          </View>
          <View style={styles.dropdownWrapper}>
            <AppDropdown
              label=""
              value={frequency}
              onChangeText={setFrequency}
              options={[
                { label: 'दरमहा (Monthly)', value: 'monthly' },
                { label: '३ महिन्यांनी (Quarterly)', value: 'quarterly' },
                { label: 'वार्षिक (Yearly)', value: 'yearly' },
              ]}
            />
          </View>
        </View>

        {/* पहिल्या हप्त्याची तारीख */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <CalendarIcon size={18} color="#78350F" />
            <Text style={styles.labelText}>पहिला हप्ता तारीख <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <View style={styles.dateInputWrapper}>
            <AppDatePicker label="" value={firstInstallmentDate} onChange={setFirstInstallmentDate} />
          </View>
        </View>

        {/* हप्ता रिमाइंडर */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <Bell size={18} color="#78350F" />
            <Text style={styles.labelText}>रिमाइंडर</Text>
          </View>
          <View style={styles.dropdownWrapper}>
            <AppDropdown
              label=""
              value={reminderDays}
              onChangeText={setReminderDays}
              options={[
                { label: '७ दिवस आधी (7 Days Before)', value: '7' },
                { label: '३ दिवस आधी (3 Days Before - शिफारस)', value: '3' },
                { label: '१ दिवस आधी (1 Day Before)', value: '1' },
                { label: 'हप्त्याच्या दिवशी (On Due Date)', value: '0' },
              ]}
            />
          </View>
        </View>

        {/* नोंद */}
        <View style={styles.notesRow}>
          <View style={styles.labelContainerNotes}>
            <StickyNote size={18} color="#78350F" />
            <Text style={styles.labelText}>नोंद</Text>
          </View>
          <TextInput
            style={styles.notesArea}
            value={notes}
            onChangeText={setNotes}
            placeholder="उदा. ऑटो डेबिट HDFC खात्यातून दरमहा ५ तारखेला..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Bottom Save Button */}
        <View style={styles.bottomBtnWrapper}>
          <TouchableOpacity
            style={styles.bottomSaveBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.bottomSaveBtnText}>
              {saving ? 'जतन होत आहे...' : 'कर्ज खाते जतन करा'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#6B121C',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    flex: 1,
    marginLeft: 12,
  },
  saveHeaderBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  saveHeaderBtnText: {
    color: '#1C1917',
    fontSize: 14,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  successBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '42%',
  },
  labelContainerNotes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '24%',
    marginTop: 8,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
  },
  requiredStar: {
    color: '#DC2626',
    fontWeight: '800',
  },
  dropdownWrapper: {
    flex: 1,
  },
  dateInputWrapper: {
    flex: 1,
  },
  textInputBox: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1F2937',
  },
  calcCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 2,
    marginBottom: 2,
  },
  calcTopRow: {
    flexDirection: 'row',
    padding: 12,
  },
  calcCol: {
    flex: 1,
  },
  calcDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  calcColLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  calcInput: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    padding: 0,
  },
  calcBottomRow: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  calcTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1917',
  },
  calcTotalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1C1917',
  },
  autoCalcBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  autoCalcText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1D4ED8',
    textAlign: 'center',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
  },
  notesArea: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1F2937',
    minHeight: 80,
  },
  bottomBtnWrapper: {
    marginTop: 6,
  },
  bottomSaveBtn: {
    backgroundColor: '#6B121C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  bottomSaveBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default AddLoanScreen;
