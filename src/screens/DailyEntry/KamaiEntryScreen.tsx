import tw from 'twrnc';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { AppInput } from '../../components/AppInput';
import { AppDropdown } from '../../components/AppDropdown';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import {
  TrendingUp,
  TrendingDown,
  Truck,
  X,
  Wallet,
  CheckCircle,
  IndianRupee,
} from 'lucide-react-native';
import { formatCurrency } from '../../utils/currency';
import { AppDatePicker } from '../../components/AppDatePicker';
import { getTodayFormatted } from '../../utils/date';
import { DailyLedgerService, MachineEntryService } from '../../utils/api';
import { colors } from '../../theme';

interface KamaiEntryScreenProps {
  onBack: () => void;
}

interface EarningDetailItem {
  id: string | number;
  source: 'machine' | 'ledger';
  title: string;
  subtitle?: string;
  amount: number;
  paymentType?: string;
  location?: string;
  hoursOrTrips?: string;
}

export const KamaiEntryScreen: React.FC<KamaiEntryScreenProps> = ({ onBack }) => {
  const [date, setDate] = useState<string>(getTodayFormatted());
  const [kamaiDescription, setKamaiDescription] = useState('');
  const [kamaiAmount, setKamaiAmount] = useState('');
  const [kamaiPaymentType, setKamaiPaymentType] = useState('रोख');
  const [kamaiNotes, setKamaiNotes] = useState('');
  const [kamaiSaving, setKamaiSaving] = useState(false);
  const [kamaiSavedMsg, setKamaiSavedMsg] = useState('');

  const [summary, setSummary] = useState({ earnings: 0 });
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [showDetails, setShowDetails] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [earningsList, setEarningsList] = useState<EarningDetailItem[]>([]);

  const getIsoDate = (dStr: string) => {
    const parts = dStr.split('/');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : new Date().toISOString().split('T')[0];
  };

  const fetchDaySummary = async () => {
    setSummaryLoading(true);
    try {
      const isoDate = getIsoDate(date);
      const [machineRes, ledgerRes] = await Promise.all([
        MachineEntryService.getAll({ date: isoDate }),
        DailyLedgerService.getAll({ date: isoDate }),
      ]);

      const rawMachines = Array.isArray(machineRes) ? machineRes : Array.isArray(machineRes?.data) ? machineRes.data : [];
      const rawLedger = Array.isArray(ledgerRes) ? ledgerRes : Array.isArray(ledgerRes?.data) ? ledgerRes.data : [];

      const machineEarnings = rawMachines.reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);
      const ledgerEarnings = rawLedger
        .filter((it: any) => it.type === 'earnings' || it.type === 'income')
        .reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);

      setSummary({ earnings: machineEarnings + ledgerEarnings });
    } catch {
      setSummary({ earnings: 0 });
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadDetailEntries = async () => {
    setModalLoading(true);
    const isoDate = getIsoDate(date);
    try {
      const [machineRes, ledgerRes] = await Promise.all([
        MachineEntryService.getAll({ date: isoDate }),
        DailyLedgerService.getAll({ date: isoDate }),
      ]);

      const rawMachines = Array.isArray(machineRes) ? machineRes : Array.isArray(machineRes?.data) ? machineRes.data : [];
      const rawLedger = Array.isArray(ledgerRes) ? ledgerRes : Array.isArray(ledgerRes?.data) ? ledgerRes.data : [];

      const eItems: EarningDetailItem[] = [];
      rawMachines.forEach((m: any) => {
        const hoursVal = m.hoursOrTrips ?? m.hours_or_trips;
        const unitVal = m.hoursUnit || m.hours_unit;
        const hoursInfo = hoursVal ? `${hoursVal} ${unitVal === 'trips' ? 'फेऱ्या' : 'तास'}` : '';
        eItems.push({
          id: `m-${m.id}`,
          source: 'machine',
          title: m.machineName || m.machine?.name || 'मशीन काम',
          subtitle: m.customerName || m.customer?.name || m.workDescription || 'थेट ग्राहक',
          amount: Number(m.amount) || 0,
          paymentType: m.paymentType || m.payment_type || 'cash',
          location: m.location,
          hoursOrTrips: hoursInfo,
        });
      });

      rawLedger
        .filter((it: any) => it.type === 'earnings' || it.type === 'income')
        .forEach((l: any) => {
          eItems.push({
            id: `l-${l.id}`,
            source: 'ledger',
            title: l.description || 'जमा नोंद',
            subtitle: l.notes,
            amount: Number(l.amount) || 0,
            paymentType: l.paymentType || l.payment_type || 'cash',
          });
        });
      setEarningsList(eItems);
    } catch {
      setEarningsList([]);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    fetchDaySummary();
  }, [date]);

  const handleSaveKamai = async () => {
    const numAmount = parseFloat(kamaiAmount.replace(/,/g, '')) || 0;
    if (numAmount <= 0) { alert('कृपया योग्य रक्कम टाका'); return; }
    if (!kamaiDescription.trim()) { alert('कृपया वर्णन टाका'); return; }

    const payTypeMap: Record<string, 'cash' | 'online' | 'credit'> = {
      'रोख': 'cash', 'ऑनलाइन': 'online', 'उधारी': 'credit',
    };

    setKamaiSaving(true);
    try {
      await DailyLedgerService.create({
        entry_date: getIsoDate(date),
        type: 'earnings',
        description: kamaiDescription.trim(),
        amount: numAmount,
        payment_type: payTypeMap[kamaiPaymentType] || 'cash',
        notes: kamaiNotes.trim() || undefined,
      });
      setKamaiSavedMsg('कमाई नोंद यशस्वीरित्या सेव्ह झाली!');
      setKamaiDescription('');
      setKamaiAmount('');
      setKamaiNotes('');
      setKamaiPaymentType('रोख');
      await fetchDaySummary();
      setTimeout(() => setKamaiSavedMsg(''), 3000);
    } catch {
      alert('नोंद सेव्ह करताना त्रुटी आली.');
    } finally {
      setKamaiSaving(false);
    }
  };

  const earningsSum = earningsList.reduce((acc, it) => acc + it.amount, 0);
  const machineEarningsSum = earningsList.filter(it => it.source === 'machine').reduce((acc, it) => acc + it.amount, 0);
  const ledgerEarningsSum = earningsList.filter(it => it.source === 'ledger').reduce((acc, it) => acc + it.amount, 0);

  return (
    <View style={tw`flex-1 w-full bg-[${colors.background}]`}>
      <AppHeader
        title="कमाई (आवक)"
        showBack={true}
        onBackPress={onBack}
        rightActionIcon="calendar"
        onRightActionPress={() => setDate(getTodayFormatted())}
      />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 max-w-lg mx-auto w-full gap-4 pb-12`}
      >
        <AppDatePicker label="दिनांक" value={date} onChange={setDate} />

        {/* KAMAI FORM */}
        <AppCard style={tw`gap-4 p-4`}>
          <View style={styles.formHeader}>
            <View style={styles.formHeaderIcon}>
              <IndianRupee size={18} color="white" />
            </View>
            <Text style={tw`text-base font-bold text-white`}>कमाई नोंद टाका</Text>
          </View>

          {kamaiSavedMsg ? (
            <View style={styles.successBanner}>
              <CheckCircle size={14} color="#15803D" />
              <Text style={tw`text-xs font-bold text-[#15803D]`}>{kamaiSavedMsg}</Text>
            </View>
          ) : null}

          <AppInput
            label="वर्णन"
            value={kamaiDescription}
            onChangeText={setKamaiDescription}
            placeholder="उदा. इतर भाडे / थेट काम जमा"
          />

          <AppInput
            label="रक्कम (₹)"
            value={kamaiAmount}
            onChangeText={setKamaiAmount}
            placeholder="उदा. 5000"
            keyboardType="numeric"
          />

          <AppDropdown
            label="पेमेंट प्रकार"
            value={kamaiPaymentType}
            onChangeText={setKamaiPaymentType}
            options={[
              { label: 'रोख (Cash)', value: 'रोख' },
              { label: 'ऑनलाइन (GPay/PhonePe)', value: 'ऑनलाइन' },
              { label: 'उधारी (Credit)', value: 'उधारी' },
            ]}
          />

          <AppInput
            label="नोंद / तपशील"
            value={kamaiNotes}
            onChangeText={setKamaiNotes}
            placeholder="काही अतिरिक्त माहिती असल्यास"
          />

          <View style={tw`pt-2`}>
            <AppButton
              title={kamaiSaving ? 'सेव्ह होत आहे...' : 'कमाई सेव्ह करा'}
              onPress={handleSaveKamai}
              variant="success"
            />
          </View>
        </AppCard>

        {/* SUMMARY */}
        <View>
          <View style={tw`flex flex-row items-center justify-between px-1 mb-2`}>
            <Text style={tw`text-xs font-bold text-[${colors.textTertiary}] uppercase tracking-wider`}>
              आजचा कमाई सारांश
            </Text>
            <Text style={tw`text-[11px] font-semibold text-[${colors.textTertiary}]`}>{date}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => { setShowDetails(true); loadDetailEntries(); }}
            style={styles.summaryCard}
          >
            <View style={tw`flex flex-row items-center gap-2 mb-2`}>
              <View style={styles.summaryIcon}>
                <TrendingUp size={16} color="#15803D" />
              </View>
              <Text style={tw`text-sm font-bold text-[#15803D]`}>एकूण कमाई</Text>
            </View>
            <Text style={tw`text-xl font-black text-[#15803D]`}>
              {formatCurrency(summary.earnings)}
            </Text>
            <Text style={tw`text-[10px] font-semibold text-[#15803D] mt-1 opacity-70`}>
              तपशील पहा ›
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* DETAIL MODAL */}
      <Modal
        visible={showDetails}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={tw`flex flex-row items-center gap-2.5`}>
                <View style={styles.modalIconBadge}>
                  <TrendingUp size={20} color={colors.earnings} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>कमाई तपशील</Text>
                  <Text style={styles.modalSubtitle}>तारीख: {date}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowDetails(false)} style={styles.modalCloseBtn} activeOpacity={0.7}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {modalLoading ? (
              <View style={tw`py-14 items-center justify-center`}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={tw`text-xs text-[${colors.textTertiary}] mt-2 font-medium`}>तपशील लोड होत आहे...</Text>
              </View>
            ) : (
              <>
                <View style={styles.heroBanner}>
                  <View style={tw`flex flex-row justify-between items-center`}>
                    <View>
                      <Text style={styles.heroBannerLabel}>एकूण कमाई</Text>
                      <Text style={styles.heroBannerAmount}>{formatCurrency(summary.earnings)}</Text>
                    </View>
                    <View style={tw`items-end`}>
                      <Text style={tw`text-[11px] text-green-700 font-bold`}>मशीन: {formatCurrency(machineEarningsSum)}</Text>
                      <Text style={tw`text-[11px] text-green-700 font-bold mt-0.5`}>इतर: {formatCurrency(ledgerEarningsSum)}</Text>
                    </View>
                  </View>
                </View>

                <Text style={tw`text-xs font-bold text-gray-700 px-1 pt-1`}>
                  कमाई नोंदी ({earningsList.length}):
                </Text>

                <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={true}>
                  {earningsList.length === 0 ? (
                    <View style={tw`py-10 items-center justify-center`}>
                      <Text style={tw`text-xs font-semibold text-[${colors.textMuted}]`}>आजसाठी कोणतीही कमाई नोंद उपलब्ध नाही.</Text>
                    </View>
                  ) : (
                    earningsList.map((item, idx) => (
                      <View key={item.id || idx} style={styles.itemCard}>
                        <View style={tw`flex flex-row justify-between items-start`}>
                          <View style={tw`flex-1 pr-2`}>
                            <View style={tw`flex flex-row items-center gap-1.5`}>
                              {item.source === 'machine' ? (
                                <Truck size={14} color={colors.primary} />
                              ) : (
                                <TrendingUp size={14} color={colors.earnings} />
                              )}
                              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                            </View>
                            {item.subtitle ? (
                              <Text style={styles.itemSub} numberOfLines={1}>{item.subtitle}</Text>
                            ) : null}
                            <View style={tw`flex flex-row items-center gap-2 mt-2`}>
                              {item.hoursOrTrips ? (
                                <View style={styles.hoursBadge}>
                                  <Text style={styles.hoursBadgeText}>{item.hoursOrTrips}</Text>
                                </View>
                              ) : null}
                              <View style={styles.payBadge}>
                                <Text style={styles.payBadgeText}>
                                  {item.paymentType === 'online' ? 'Online' : item.paymentType === 'credit' ? 'उधारी' : 'रोख'}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <Text style={styles.amountGreen}>+{formatCurrency(item.amount)}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>

                <View style={styles.tallyFooter}>
                  <Text style={tw`text-xs font-bold text-gray-700`}>एकूण कमाई बेरीज:</Text>
                  <Text style={tw`text-sm font-extrabold text-green-700`}>{formatCurrency(earningsSum)}</Text>
                </View>
              </>
            )}

            <TouchableOpacity onPress={() => setShowDetails(false)} style={styles.modalCloseButton} activeOpacity={0.8}>
              <Text style={styles.modalCloseButtonText}>बंद करा (Close)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#15803D',
    borderRadius: 12,
    padding: 12,
  },
  formHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  summaryCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  modalSubtitle: { fontSize: 12, fontWeight: '600', color: colors.textTertiary },
  modalCloseBtn: { padding: 6, borderRadius: 20, backgroundColor: colors.surfaceSecondary },
  modalScrollBody: { maxHeight: 320 },
  heroBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
  },
  heroBannerLabel: { fontSize: 11, fontWeight: '700', color: '#15803D', marginBottom: 2 },
  heroBannerAmount: { fontSize: 22, fontWeight: '900', color: '#16A34A' },
  itemCard: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  itemSub: { fontSize: 11, fontWeight: '500', color: colors.textSecondary, marginTop: 2 },
  hoursBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  hoursBadgeText: { fontSize: 9, fontWeight: '700', color: '#1D4ED8' },
  payBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  payBadgeText: { fontSize: 9, fontWeight: '700', color: colors.textTertiary },
  amountGreen: { fontSize: 14, fontWeight: '900', color: colors.earnings },
  tallyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
  },
  modalCloseButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCloseButtonText: { fontSize: 14, fontWeight: '800', color: colors.white },
});

export default KamaiEntryScreen;
