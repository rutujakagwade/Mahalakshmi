import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import tw from 'twrnc';
import { AppButton } from '../../components/AppButton';
import { AppDatePicker } from '../../components/AppDatePicker';
import { getTodayFormatted } from '../../utils/date';
import { DailyLedgerService } from '../../utils/api';
import { colors } from '../../theme';
import {
  FileText,
  User,
  Phone,
  MapPin,
  Clock,
  IndianRupee,
  Calendar,
  StickyNote,
  CheckCircle,
} from 'lucide-react-native';

interface NavinKamFormProps {
  onBack: () => void;
}

export const NavinKamForm: React.FC<NavinKamFormProps> = ({ onBack }) => {
  const [workName, setWorkName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [workType, setWorkType] = useState<'hourly' | 'contract'>('hourly');
  const [hourlyRate, setHourlyRate] = useState('');
  const [totalHours, setTotalHours] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [startDate, setStartDate] = useState(getTodayFormatted());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const rate = parseFloat(hourlyRate.replace(/,/g, '')) || 0;
  const hours = parseFloat(totalHours.replace(/,/g, '')) || 0;
  const totalAmount = rate * hours;

  const handleSave = async () => {
    if (!workName.trim()) {
      Alert.alert('त्रुटी', 'कृपया कामाचे नाव टाका');
      return;
    }
    if (totalAmount <= 0) {
      Alert.alert('त्रुटी', 'कृपया दर व तास टाका');
      return;
    }

    setSaving(true);
    try {
      const parts = startDate.split('/');
      const isoDate = parts.length === 3
        ? `${parts[2]}-${parts[1]}-${parts[0]}`
        : new Date().toISOString().split('T')[0];

      await DailyLedgerService.create({
        entry_date: isoDate,
        type: 'earnings',
        description: `${workName.trim()}${customerName.trim() ? ' - ' + customerName.trim() : ''}`,
        amount: totalAmount,
        payment_type: 'cash',
        notes: [
          address.trim() ? `पत्ता: ${address.trim()}` : '',
          mobileNumber.trim() ? `मोबाईल: ${mobileNumber.trim()}` : '',
          `प्रकार: ${workType === 'hourly' ? 'प्रति घंटा' : 'ठेका'}`,
          rate > 0 ? `दर: ₹${rate}/तास` : '',
          hours > 0 ? `तास: ${hours}` : '',
          advanceAmount.trim() ? `अग्रिम: ₹${advanceAmount.trim()}` : '',
          notes.trim(),
        ].filter(Boolean).join(' | ') || undefined,
      });

      setSavedMsg('नवीन काम यशस्वीरित्या सेव्ह झाली!');
      setTimeout(() => setSavedMsg(''), 3000);

      setWorkName('');
      setCustomerName('');
      setMobileNumber('');
      setAddress('');
      setHourlyRate('');
      setTotalHours('');
      setAdvanceAmount('');
      setNotes('');
    } catch {
      Alert.alert('त्रुटी', 'नोंद सेव्ह करताना त्रुटी आली.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>नवीन काम</Text>
        <TouchableOpacity style={styles.headerAction}>
          <Text style={styles.headerActionText}>फॉर्म भरा</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {savedMsg ? (
          <View style={styles.successBanner}>
            <CheckCircle size={16} color="#15803D" />
            <Text style={styles.successText}>{savedMsg}</Text>
          </View>
        ) : null}

        {/* Single Form Card */}
        <View style={styles.formCard}>

          {/* कामाचे नाव */}
          <View style={styles.fieldRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
              <FileText size={18} color="#0284C7" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>कामाचे नाव *</Text>
              <TextInput
                style={styles.textInput}
                value={workName}
                onChangeText={setWorkName}
                placeholder="उदा. बेल्ट फिटींग काम"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* ग्राहकाचे नाव */}
          <View style={styles.fieldRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <User size={18} color="#D97706" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>ग्राहकाचे नाव *</Text>
              <TextInput
                style={styles.textInput}
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="उदा. रमेश पाटील"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* मोबाईल क्र */}
          <View style={styles.fieldRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Phone size={18} color="#16A34A" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>मोबाईल क्र</Text>
              <TextInput
                style={styles.textInput}
                value={mobileNumber}
                onChangeText={(t) => setMobileNumber(t.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="9876543210"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>

          {/* पत्ता */}
          <View style={styles.fieldRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
              <MapPin size={18} color="#DC2626" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>पत्ता</Text>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="उदा. पुणे, शिवाजी नगर"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* कामाचा प्रकार */}
          <View style={styles.fieldRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
              <Clock size={18} color="#7C3AED" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>कामाचा प्रकार</Text>
              <View style={styles.radioRow}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setWorkType('hourly')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radioCircle, workType === 'hourly' && styles.radioActive]}>
                    {workType === 'hourly' && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.radioLabel, workType === 'hourly' && styles.radioLabelActive]}>
                    प्रति घंटा
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setWorkType('contract')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radioCircle, workType === 'contract' && styles.radioActive]}>
                    {workType === 'contract' && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.radioLabel, workType === 'contract' && styles.radioLabelActive]}>
                    ठेका
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* प्रति घंटा दर + एकूण तास */}
          <View style={styles.sideBySideRow}>
            <View style={styles.halfField}>
              <View style={styles.fieldRowCompact}>
                <View style={[styles.iconCircleSmall, { backgroundColor: '#FEF3C7' }]}>
                  <IndianRupee size={14} color="#D97706" />
                </View>
                <Text style={styles.fieldLabelSmall}>प्रति घंटा दर (₹)</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={hourlyRate}
                onChangeText={setHourlyRate}
                placeholder="350"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <View style={styles.fieldRowCompact}>
                <View style={[styles.iconCircleSmall, { backgroundColor: '#E0F2FE' }]}>
                  <Clock size={14} color="#0284C7" />
                </View>
                <Text style={styles.fieldLabelSmall}>एकूण तास (अंदाजे)</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={totalHours}
                onChangeText={setTotalHours}
                placeholder="120"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* एकूण रक्कम - Highlighted */}
          <View style={styles.totalAmountContainer}>
            <View style={styles.totalAmountRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF9C3' }]}>
                <IndianRupee size={18} color="#A16207" />
              </View>
              <Text style={styles.totalLabel}>एकूण रक्कम</Text>
            </View>
            <View style={styles.totalAmountDisplay}>
              <Text style={styles.totalAmountText}>
                ₹ {totalAmount > 0 ? totalAmount.toLocaleString('en-IN') : '0'}
              </Text>
            </View>
          </View>

          {/* अग्रिम रक्कम */}
          <View style={styles.fieldRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <IndianRupee size={18} color="#16A34A" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>अग्रिम रक्कम (₹)</Text>
              <TextInput
                style={styles.textInput}
                value={advanceAmount}
                onChangeText={setAdvanceAmount}
                placeholder="5000"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* सुरुवातीची तारीख */}
          <View style={styles.fieldRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Calendar size={18} color="#0284C7" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>सुरुवातीची तारीख</Text>
              <AppDatePicker label="" value={startDate} onChange={setStartDate} />
            </View>
          </View>

          {/* नोंद */}
          <View style={styles.fieldRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
              <StickyNote size={18} color="#7C3AED" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>नोंद</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="काही अतिरिक्त माहिती लिहा..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

        </View>

        {/* Save Button */}
        <View style={styles.btnWrapper}>
          <AppButton
            title={saving ? 'सेव्ह होत आहे...' : 'नवीन काम सेव्ह करा'}
            onPress={handleSave}
            variant="primary"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    backgroundColor: '#7F1D1D',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 8,
  },
  backArrow: {
    fontSize: 22,
    color: 'white',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerAction: {
    backgroundColor: '#1C1917',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  headerActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },

  // Success Banner
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
    fontSize: 12,
    fontWeight: '700',
  },

  // Single Form Card
  formCard: {
    backgroundColor: '#F5F5F4',
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },

  // Field Row (icon + label + input in one row)
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 70,
    paddingTop: 10,
  },

  // Radio
  radioRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: '#7C3AED',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7C3AED',
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  radioLabelActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },

  // Side by Side
  sideBySideRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  fieldRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  iconCircleSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabelSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },

  // Total Amount
  totalAmountContainer: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1.5,
    borderColor: '#FDE047',
    borderRadius: 12,
    padding: 12,
  },
  totalAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#854D0E',
  },
  totalAmountDisplay: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#FDE047',
    alignItems: 'flex-end',
  },
  totalAmountText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#15803D',
  },

  // Button
  btnWrapper: {
    paddingTop: 4,
  },
});

export default NavinKamForm;
