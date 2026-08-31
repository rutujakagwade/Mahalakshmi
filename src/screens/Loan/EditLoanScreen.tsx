import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import tw from 'twrnc';
import { AppDropdown } from '../../components/AppDropdown';
import { formatCurrency } from '../../utils/currency';
import { LoanService } from '../../utils/api';
import { Loan } from '../../types/loan';
import {
  CreditCard,
  Bell,
  CheckCircle,
  ArrowLeft,
  Building,
  FileText,
  StickyNote,
} from 'lucide-react-native';

interface EditLoanScreenProps {
  loanId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const EditLoanScreen: React.FC<EditLoanScreenProps> = ({
  loanId,
  onBack,
  onSuccess,
}) => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedMsg, setSavedMsg] = useState<string>('');

  const [name, setName] = useState<string>('');
  const [loanType, setLoanType] = useState<string>('');
  const [lenderName, setLenderName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [reminderDays, setReminderDays] = useState<string>('3');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await LoanService.getById(loanId);
        const data: Loan = res?.data || res;
        setLoan(data);
        setName(data.name || '');
        setLoanType(data.loanType || '');
        setLenderName(data.lenderName || '');
        setAccountNumber(data.accountNumber || '');
        setInterestRate(data.interestRate ? String(data.interestRate) : '');
        setReminderDays(String(data.reminderDaysBefore ?? 3));
        setNotes(data.notes || '');
      } catch {
        Alert.alert('त्रुटी', 'कर्ज डेटा लोड करताना समस्या आली.');
        onBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loanId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('त्रुटी', 'कृपया कर्जाचे नाव प्रविष्ट करा.');
      return;
    }
    if (!lenderName.trim()) {
      Alert.alert('त्रुटी', 'कृपया बँक किंवा सावकाराचे नाव प्रविष्ट करा.');
      return;
    }
    if (!loan) return;

    setSaving(true);
    try {
      await LoanService.update(loanId, {
        name: name.trim(),
        loan_type: loanType || undefined,
        lender_name: lenderName.trim(),
        account_number: accountNumber.trim() || undefined,
        interest_rate: parseFloat(interestRate) || undefined,
        reminder_days_before: parseInt(reminderDays, 10) || 3,
        notes: notes.trim() || undefined,
        total_amount: loan.totalAmount,
        start_date: loan.startDate,
        emi_amount: loan.emiAmount,
        first_installment_date: loan.firstInstallmentDate,
        total_installments: loan.totalInstallments,
      });

      setSavedMsg('कर्ज तपशील यशस्वीरित्या अपडेट झाले!');
      setTimeout(() => {
        setSavedMsg('');
        onSuccess();
      }, 1200);
    } catch (err: any) {
      Alert.alert('त्रुटी', err?.message || 'कर्ज अपडेट करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>कर्ज संपादन</Text>
        </View>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color="#6B121C" />
          <Text style={tw`text-xs text-gray-500 mt-2 font-medium`}>माहिती लोड होत आहे...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>कर्ज संपादन</Text>
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

        {/* Read-only financial snapshot banner */}
        {loan && (
          <View style={styles.readOnlyCard}>
            <Text style={styles.readOnlyTitle}>सध्याचे कर्ज तपशील (स्थिर)</Text>
            <View style={styles.readOnlyGrid}>
              <View style={styles.readOnlyCol}>
                <Text style={styles.readOnlyLabel}>एकूण कर्ज:</Text>
                <Text style={styles.readOnlyValue}>{formatCurrency(loan.totalAmount)}</Text>
              </View>
              <View style={styles.readOnlyCol}>
                <Text style={styles.readOnlyLabel}>EMI हप्ता:</Text>
                <Text style={styles.readOnlyValue}>{formatCurrency(loan.emiAmount)}/महिना</Text>
              </View>
            </View>
            <View style={styles.readOnlyGrid}>
              <View style={styles.readOnlyCol}>
                <Text style={styles.readOnlyLabel}>हप्ते संख्या:</Text>
                <Text style={styles.readOnlyValue}>{loan.totalInstallments} हप्ते</Text>
              </View>
              <View style={styles.readOnlyCol}>
                <Text style={styles.readOnlyLabel}>सुरुवात दिनांक:</Text>
                <Text style={styles.readOnlyValue}>{loan.startDate}</Text>
              </View>
            </View>
          </View>
        )}

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
            placeholder="उदा. JCB 3DX कर्ज"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* कर्जाचा प्रकार */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <FileText size={18} color="#78350F" />
            <Text style={styles.labelText}>कर्जाचा प्रकार</Text>
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
            placeholder="उदा. HDFC Bank, SBI"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* खाते क्रमांक */}
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

        {/* व्याजदर */}
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

        {/* रिमाइंडर */}
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
              {saving ? 'अपडेट होत आहे...' : 'बदल जतन करा'}
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
  readOnlyCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  readOnlyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#854D0E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readOnlyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  readOnlyCol: {
    flex: 1,
  },
  readOnlyLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78350F',
  },
  readOnlyValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1917',
    marginTop: 1,
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

export default EditLoanScreen;
