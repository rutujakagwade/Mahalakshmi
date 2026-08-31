import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import tw from 'twrnc';
import { AppHeader } from '../../components/AppHeader';
import { AppInput } from '../../components/AppInput';
import { AppDropdown } from '../../components/AppDropdown';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppDatePicker } from '../../components/AppDatePicker';
import { getTodayFormatted } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';
import { colors } from '../../theme';
import { LoanService } from '../../utils/api';
import { CreditCard, Clock, Bell, CheckCircle2 } from 'lucide-react-native';

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

  // Auto-estimate installments if total and EMI are entered, or vice-versa
  const handleAutoCalcInstallments = () => {
    if (numTotalAmt > 0 && numEmiAmt > 0) {
      const estimated = Math.ceil(numTotalAmt / numEmiAmt);
      setTotalInstallments(String(estimated));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('त्रुटी', 'कृपया कर्जाचे नाव प्रविष्ट करा.');
      return;
    }
    if (!lenderName.trim()) {
      Alert.alert('त्रुटी', 'कृपया बँक किंवा सावकाराचे नाव प्रविष्ट करा.');
      return;
    }
    if (numTotalAmt <= 0) {
      Alert.alert('त्रुटी', 'कृपया योग्य एकूण कर्ज रक्कम प्रविष्ट करा.');
      return;
    }
    if (numEmiAmt <= 0) {
      Alert.alert('त्रुटी', 'कृपया हप्ता (EMI) रक्कम प्रविष्ट करा.');
      return;
    }
    if (numInstallments <= 0) {
      Alert.alert('त्रुटी', 'कृपया एकूण हप्त्यांची संख्या प्रविष्ट करा.');
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

      Alert.alert('यशस्वी', 'नवीन कर्ज आणि हप्त्यांचे वेळापत्रक यशस्वीरित्या तयार झाले!', [
        { text: 'ठीक आहे', onPress: onSuccess },
      ]);
    } catch (err: any) {
      Alert.alert('त्रुटी', err?.message || 'कर्ज सेव्ह करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-[${colors.background}]`}>
      <AppHeader title="नवीन कर्ज जोडा (+ Add Loan)" showBack={true} onBackPress={onBack} />

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 pb-24 gap-4`}>
        {/* Loan Basic Details Card */}
        <AppCard variant="elevated" style={styles.card}>
          <View style={tw`flex flex-row items-center gap-2 mb-3 pb-2 border-b border-gray-100`}>
            <CreditCard size={18} color={colors.primary} />
            <Text style={styles.cardSectionTitle}>कर्जाची प्राथमिक माहिती</Text>
          </View>

          <AppInput
            label="कर्जाचे नाव"
            value={name}
            onChangeText={setName}
            placeholder="उदा. JCB 3DX कर्ज / ट्रॅक्टर कर्ज / गृहकर्ज"
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
            placeholder="उदा. HDFC Bank, SBI, कोटक, सावकार नाव"
            required
          />

          <AppInput
            label="कर्ज खाते क्रमांक (Loan A/c No. - पर्यायी)"
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="उदा. LN-12345678"
          />

          <View style={tw`flex flex-row gap-3`}>
            <View style={tw`flex-1`}>
              <AppInput
                label="एकूण कर्ज रक्कम (₹)"
                value={totalAmount}
                onChangeText={setTotalAmount}
                placeholder="उदा. 1000000"
                keyboardType="numeric"
                required
              />
            </View>
            <View style={tw`flex-1`}>
              <AppInput
                label="वार्षिक व्याजदर (% - पर्यायी)"
                value={interestRate}
                onChangeText={setInterestRate}
                placeholder="उदा. 8.5"
                keyboardType="numeric"
              />
            </View>
          </View>

          <AppDatePicker
            label="कर्ज मंजुरी / सुरुवातीची तारीख"
            value={startDate}
            onChange={setStartDate}
          />
        </AppCard>

        {/* EMI & Installment Schedule Setup */}
        <AppCard variant="elevated" style={styles.card}>
          <View style={tw`flex flex-row items-center gap-2 mb-3 pb-2 border-b border-gray-100`}>
            <Clock size={18} color={colors.primary} />
            <Text style={styles.cardSectionTitle}>हप्ता (EMI) व परतफेड तपशील</Text>
          </View>

          <View style={tw`flex flex-row gap-3`}>
            <View style={tw`flex-1`}>
              <AppInput
                label="हप्ता रक्कम (EMI ₹)"
                value={emiAmount}
                onChangeText={setEmiAmount}
                placeholder="उदा. 25000"
                keyboardType="numeric"
                required
              />
            </View>

            <View style={tw`flex-1`}>
              <AppInput
                label="एकूण हप्ते (Installments)"
                value={totalInstallments}
                onChangeText={setTotalInstallments}
                placeholder="उदा. 24 किंवा 36"
                keyboardType="numeric"
                required
              />
            </View>
          </View>

          {/* Quick Auto-estimate Button */}
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

          <View style={tw`flex flex-row gap-3`}>
            <View style={tw`flex-1`}>
              <AppDropdown
                label="हप्ता वारंवारता (Frequency)"
                value={frequency}
                onChangeText={setFrequency}
                options={[
                  { label: 'दरमहा (Monthly)', value: 'monthly' },
                  { label: '३ महिन्यांनी (Quarterly)', value: 'quarterly' },
                  { label: 'वार्षिक (Yearly)', value: 'yearly' },
                ]}
              />
            </View>

            <View style={tw`flex-1`}>
              <AppDatePicker
                label="पहिल्या हप्त्याची तारीख"
                value={firstInstallmentDate}
                onChange={setFirstInstallmentDate}
              />
            </View>
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

        {/* Live Calculation Summary Badge */}
        {numEmiAmt > 0 && numInstallments > 0 ? (
          <View style={styles.summaryBadge}>
            <View style={tw`flex flex-row items-center gap-2 mb-2`}>
              <CheckCircle2 size={16} color="#15803D" />
              <Text style={styles.summaryBadgeTitle}>हप्ता वेळापत्रक अंदाज</Text>
            </View>
            <View style={styles.summaryBadgeRow}>
              <Text style={styles.summaryBadgeLabel}>एकूण हप्त्यांची बेरीज:</Text>
              <Text style={styles.summaryBadgeVal}>
                {formatCurrency(numEmiAmt * numInstallments)}
              </Text>
            </View>
            <View style={styles.summaryBadgeRow}>
              <Text style={styles.summaryBadgeLabel}>कालावधी:</Text>
              <Text style={styles.summaryBadgeVal}>
                {frequency === 'quarterly'
                  ? `${numInstallments * 3} महिने (${((numInstallments * 3) / 12).toFixed(1)} वर्षे)`
                  : frequency === 'yearly'
                  ? `${numInstallments} वर्षे`
                  : `${numInstallments} महिने (${(numInstallments / 12).toFixed(1)} वर्षे)`}
              </Text>
            </View>
            <Text style={styles.summaryBadgeNote}>
              💡 हे कर्ज सेव्ह केल्यावर सर्व {numInstallments} हप्त्यांचे तारीखनिहाय वेळापत्रक आपोआप तयार होईल.
            </Text>
          </View>
        ) : null}

        {/* Submit Button */}
        <AppButton
          title={saving ? 'कर्ज सेव्ह होत आहे...' : 'कर्ज सेव्ह करा (+ Save Loan)'}
          onPress={handleSave}
          variant="primary"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  autoCalcBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  autoCalcText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1D4ED8',
    textAlign: 'center',
  },
  summaryBadge: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
  },
  summaryBadgeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryBadgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  summaryBadgeVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14532D',
  },
  summaryBadgeNote: {
    fontSize: 11,
    fontWeight: '500',
    color: '#166534',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

export default AddLoanScreen;
