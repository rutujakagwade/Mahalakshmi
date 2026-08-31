import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import tw from 'twrnc';
import { AppHeader } from '../../components/AppHeader';
import { AppInput } from '../../components/AppInput';
import { AppDropdown } from '../../components/AppDropdown';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { colors } from '../../theme';
import { LoanService } from '../../utils/api';
import { Loan } from '../../types/loan';
import { CreditCard, FileText, Bell } from 'lucide-react-native';

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

  // Editable fields (non-financial – cannot change total/EMI after creation)
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
        // Pass required fields unchanged
        name: name.trim(),
        loan_type: loanType || undefined,
        lender_name: lenderName.trim(),
        account_number: accountNumber.trim() || undefined,
        interest_rate: parseFloat(interestRate) || undefined,
        reminder_days_before: parseInt(reminderDays, 10) || 3,
        notes: notes.trim() || undefined,
        // These are required by backend validation - send original values
        total_amount: loan.totalAmount,
        start_date: loan.startDate,
        emi_amount: loan.emiAmount,
        first_installment_date: loan.firstInstallmentDate,
        total_installments: loan.totalInstallments,
      });

      Alert.alert('यशस्वी', 'कर्जाचे तपशील यशस्वीरित्या अपडेट केले!', [
        { text: 'ठीक आहे', onPress: onSuccess },
      ]);
    } catch (err: any) {
      Alert.alert('त्रुटी', err?.message || 'कर्ज अपडेट करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-[${colors.background}]`}>
        <AppHeader title="कर्ज संपादन करा" showBack={true} onBackPress={onBack} />
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={tw`text-xs text-[${colors.textTertiary}] mt-2 font-medium`}>
            कर्ज डेटा लोड होत आहे...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-[${colors.background}]`}>
      <AppHeader
        title="कर्ज संपादन (Edit Loan)"
        showBack={true}
        onBackPress={onBack}
      />

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 pb-24 gap-4`}>
        {/* Info banner: financial fields are read-only */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            💡 कर्जाची एकूण रक्कम, EMI आणि हप्त्यांचे वेळापत्रक बदलता येणार नाही. फक्त नाव, बँक, व्याजदर आणि नोंदी बदलता येतात.
          </Text>
        </View>

        {/* Read-only summary of financial info */}
        {loan && (
          <View style={styles.readOnlySummary}>
            <Text style={styles.readOnlyTitle}>सध्याचे कर्ज तपशील (Read-Only)</Text>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>एकूण कर्ज रक्कम:</Text>
              <Text style={styles.readOnlyValue}>₹{loan.totalAmount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>EMI रक्कम:</Text>
              <Text style={styles.readOnlyValue}>₹{loan.emiAmount.toLocaleString('en-IN')}/महिना</Text>
            </View>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>एकूण हप्ते:</Text>
              <Text style={styles.readOnlyValue}>{loan.totalInstallments} हप्ते</Text>
            </View>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyLabel}>सुरुवात तारीख:</Text>
              <Text style={styles.readOnlyValue}>{loan.startDate}</Text>
            </View>
          </View>
        )}

        {/* Editable Fields */}
        <AppCard variant="elevated" style={styles.card}>
          <View style={tw`flex flex-row items-center gap-2 mb-3 pb-2 border-b border-gray-100`}>
            <CreditCard size={18} color={colors.primary} />
            <Text style={styles.cardSectionTitle}>कर्जाचे बदलता येणारे तपशील</Text>
          </View>

          <AppInput
            label="कर्जाचे नाव"
            value={name}
            onChangeText={setName}
            placeholder="उदा. JCB 3DX कर्ज / ट्रॅक्टर कर्ज"
            required
          />

          <AppDropdown
            label="कर्जाचा प्रकार"
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

          <AppInput
            label="बँक / सावकाराचे नाव"
            value={lenderName}
            onChangeText={setLenderName}
            placeholder="उदा. HDFC Bank, SBI, कोटक"
            required
          />

          <AppInput
            label="कर्ज खाते क्रमांक (Loan A/c No. - पर्यायी)"
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="उदा. LN-12345678"
          />

          <AppInput
            label="वार्षिक व्याजदर (% - पर्यायी)"
            value={interestRate}
            onChangeText={setInterestRate}
            placeholder="उदा. 8.5"
            keyboardType="numeric"
          />
        </AppCard>

        {/* Reminder Settings */}
        <AppCard variant="elevated" style={styles.card}>
          <View style={tw`flex flex-row items-center gap-2 mb-3 pb-2 border-b border-gray-100`}>
            <Bell size={18} color={colors.primary} />
            <Text style={styles.cardSectionTitle}>रिमाइंडर आणि नोंदी</Text>
          </View>

          <AppDropdown
            label="हप्ता रिमाइंडर कधी हवा?"
            value={reminderDays}
            onChangeText={setReminderDays}
            options={[
              { label: '७ दिवस आधी (7 Days Before)', value: '7' },
              { label: '३ दिवस आधी (3 Days Before - शिफारस)', value: '3' },
              { label: '१ दिवस आधी (1 Day Before)', value: '1' },
              { label: 'हप्त्याच्या दिवशी (On Due Date)', value: '0' },
            ]}
          />

          <AppInput
            label="इतर नोंदी / टीप (Notes - पर्यायी)"
            value={notes}
            onChangeText={setNotes}
            placeholder="उदा. ऑटो डेबिट HDFC खात्यातून दरमहा ५ तारखेला"
          />
        </AppCard>

        <AppButton
          title={saving ? 'अपडेट होत आहे...' : 'बदल जतन करा (Save Changes)'}
          onPress={handleSave}
          variant="primary"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  infoBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
  },
  infoBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 18,
  },
  readOnlySummary: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  readOnlyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textTertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readOnlyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  readOnlyValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  card: {
    padding: 16,
    borderRadius: 16,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
});

export default EditLoanScreen;
