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
  TrendingDown,
  X,
  Wallet,
  CheckCircle,
  IndianRupee,
} from 'lucide-react-native';
import { formatCurrency } from '../../utils/currency';
import { AppDatePicker } from '../../components/AppDatePicker';
import { getTodayFormatted } from '../../utils/date';
import { DailyLedgerService } from '../../utils/api';
import { colors } from '../../theme';

interface KharchEntryScreenProps {
  onBack: () => void;
}

interface ExpenseDetailItem {
  id: string | number;
  description: string;
  amount: number;
  paymentType?: string;
  category: string;
  notes?: string;
}

export const KharchEntryScreen: React.FC<KharchEntryScreenProps> = ({ onBack }) => {
  const [date, setDate] = useState<string>(getTodayFormatted());
  const [kharchDescription, setKharchDescription] = useState('');
  const [kharchAmount, setKharchAmount] = useState('');
  const [kharchPaymentType, setKharchPaymentType] = useState('रोख');
  const [kharchNotes, setKharchNotes] = useState('');
  const [kharchSaving, setKharchSaving] = useState(false);
  const [kharchSavedMsg, setKharchSavedMsg] = useState('');

  const [summary, setSummary] = useState({ expense: 0 });
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [showDetails, setShowDetails] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [expenseList, setExpenseList] = useState<ExpenseDetailItem[]>([]);

  const getIsoDate = (dStr: string) => {
    const parts = dStr.split('/');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : new Date().toISOString().split('T')[0];
  };

  const fetchDaySummary = async () => {
    setSummaryLoading(true);
    try {
      const isoDate = getIsoDate(date);
      const ledgerRes = await DailyLedgerService.getAll({ date: isoDate });
      const rawLedger = Array.isArray(ledgerRes) ? ledgerRes : Array.isArray(ledgerRes?.data) ? ledgerRes.data : [];
      const ledgerExpense = rawLedger
        .filter((it: any) => it.type === 'expense')
        .reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);
      setSummary({ expense: ledgerExpense });
    } catch {
      setSummary({ expense: 0 });
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadDetailEntries = async () => {
    setModalLoading(true);
    const isoDate = getIsoDate(date);
    try {
      const ledgerRes = await DailyLedgerService.getAll({ date: isoDate });
      const rawLedger = Array.isArray(ledgerRes) ? ledgerRes : Array.isArray(ledgerRes?.data) ? ledgerRes.data : [];

      const expItems: ExpenseDetailItem[] = [];
      rawLedger
        .filter((it: any) => it.type === 'expense')
        .forEach((l: any) => {
          let category = 'इतर खर्च';
          const descLower = (l.description || '').toLowerCase();
          if (descLower.includes('डिझेल') || descLower.includes('diesel') || descLower.includes('fuel')) {
            category = 'इंधन (Fuel)';
          } else if (descLower.includes('पगार') || descLower.includes('मजुरी') || descLower.includes('salary') || descLower.includes('bhatta')) {
            category = 'मजुरी (Labour)';
          } else if (descLower.includes('सर्व्हिस') || descLower.includes('ऑइल') || descLower.includes('oil')) {
            category = 'सर्व्हिसिंग (Service)';
          } else if (descLower.includes('दुरुस्ती') || descLower.includes('repair') || descLower.includes('spares')) {
            category = 'दुरुस्ती (Repair)';
          }
          expItems.push({
            id: `exp-${l.id}`,
            description: l.description || 'खर्च नोंद',
            amount: Number(l.amount) || 0,
            paymentType: l.paymentType || l.payment_type || 'cash',
            category,
            notes: l.notes,
          });
        });
      setExpenseList(expItems);
    } catch {
      setExpenseList([]);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    fetchDaySummary();
  }, [date]);

  const handleSaveKharch = async () => {
    const numAmount = parseFloat(kharchAmount.replace(/,/g, '')) || 0;
    if (numAmount <= 0) { alert('कृपया योग्य रक्कम टाका'); return; }
    if (!kharchDescription.trim()) { alert('कृपया वर्णन टाका'); return; }

    const payTypeMap: Record<string, 'cash' | 'online' | 'credit'> = {
      'रोख': 'cash', 'ऑनलाइन': 'online', 'उधारी': 'credit',
    };

    setKharchSaving(true);
    try {
      await DailyLedgerService.create({
        entry_date: getIsoDate(date),
        type: 'expense',
        description: kharchDescription.trim(),
        amount: numAmount,
        payment_type: payTypeMap[kharchPaymentType] || 'cash',
        notes: kharchNotes.trim() || undefined,
      });
      setKharchSavedMsg('खर्च नोंद यशस्वीरित्या सेव्ह झाली!');
      setKharchDescription('');
      setKharchAmount('');
      setKharchNotes('');
      setKharchPaymentType('रोख');
      await fetchDaySummary();
      setTimeout(() => setKharchSavedMsg(''), 3000);
    } catch {
      alert('नोंद सेव्ह करताना त्रुटी आली.');
    } finally {
      setKharchSaving(false);
    }
  };

  const expenseSum = expenseList.reduce((acc, it) => acc + it.amount, 0);

  return (
    <View style={tw`flex-1 w-full bg-[${colors.background}]`}>
      <AppHeader
        title="खर्च (जावक)"
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

        {/* KHARCH FORM */}
        <AppCard style={tw`gap-4 p-4`}>
          <View style={styles.formHeader}>
            <View style={styles.formHeaderIcon}>
              <IndianRupee size={18} color="white" />
            </View>
            <Text style={tw`text-base font-bold text-white`}>खर्च नोंद टाका</Text>
          </View>

          {kharchSavedMsg ? (
            <View style={styles.successBanner}>
              <CheckCircle size={14} color="#DC2626" />
              <Text style={tw`text-xs font-bold text-[#DC2626]`}>{kharchSavedMsg}</Text>
            </View>
          ) : null}

          <AppInput
            label="वर्णन"
            value={kharchDescription}
            onChangeText={setKharchDescription}
            placeholder="उदा. डिझेल / कामगार पगार / ऑइल"
          />

          <AppInput
            label="रक्कम (₹)"
            value={kharchAmount}
            onChangeText={setKharchAmount}
            placeholder="उदा. 2000"
            keyboardType="numeric"
          />

          <AppDropdown
            label="पेमेंट प्रकार"
            value={kharchPaymentType}
            onChangeText={setKharchPaymentType}
            options={[
              { label: 'रोख (Cash)', value: 'रोख' },
              { label: 'ऑनलाइन (GPay/PhonePe)', value: 'ऑनलाइन' },
              { label: 'उधारी (Credit)', value: 'उधारी' },
            ]}
          />

          <AppInput
            label="नोंद / तपशील"
            value={kharchNotes}
            onChangeText={setKharchNotes}
            placeholder="काही अतिरिक्त माहिती असल्यास"
          />

          <View style={tw`pt-2`}>
            <AppButton
              title={kharchSaving ? 'सेव्ह होत आहे...' : 'खर्च सेव्ह करा'}
              onPress={handleSaveKharch}
              variant="danger"
            />
          </View>
        </AppCard>

        {/* SUMMARY */}
        <View>
          <View style={tw`flex flex-row items-center justify-between px-1 mb-2`}>
            <Text style={tw`text-xs font-bold text-[${colors.textTertiary}] uppercase tracking-wider`}>
              आजचा खर्च सारांश
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
                <TrendingDown size={16} color="#DC2626" />
              </View>
              <Text style={tw`text-sm font-bold text-[#DC2626]`}>एकूण खर्च</Text>
            </View>
            <Text style={tw`text-xl font-black text-[#DC2626]`}>
              {formatCurrency(summary.expense)}
            </Text>
            <Text style={tw`text-[10px] font-semibold text-[#DC2626] mt-1 opacity-70`}>
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
                  <TrendingDown size={20} color="#DC2626" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>खर्च तपशील</Text>
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
                      <Text style={styles.heroBannerLabel}>एकूण खर्च</Text>
                      <Text style={styles.heroBannerAmount}>{formatCurrency(summary.expense)}</Text>
                    </View>
                    <View style={tw`items-end`}>
                      <Text style={tw`text-[11px] text-red-700 font-bold`}>एकूण नोंदी: {expenseList.length}</Text>
                    </View>
                  </View>
                </View>

                <Text style={tw`text-xs font-bold text-gray-700 px-1 pt-1`}>
                  खर्च नोंदी ({expenseList.length}):
                </Text>

                <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={true}>
                  {expenseList.length === 0 ? (
                    <View style={tw`py-10 items-center justify-center`}>
                      <Text style={tw`text-xs font-semibold text-[${colors.textMuted}]`}>आजसाठी कोणतीही खर्च नोंद उपलब्ध नाही.</Text>
                    </View>
                  ) : (
                    expenseList.map((item, idx) => (
                      <View key={item.id || idx} style={styles.itemCard}>
                        <View style={tw`flex flex-row justify-between items-start`}>
                          <View style={tw`flex-1 pr-2`}>
                            <View style={tw`flex flex-row items-center gap-1.5`}>
                              <TrendingDown size={14} color="#DC2626" />
                              <Text style={styles.itemTitle} numberOfLines={1}>{item.description}</Text>
                            </View>
                            {item.notes ? (
                              <Text style={styles.itemSub} numberOfLines={1}>{item.notes}</Text>
                            ) : null}
                            <View style={tw`flex flex-row items-center gap-2 mt-2`}>
                              <View style={styles.categoryBadge}>
                                <Text style={styles.categoryBadgeText}>{item.category}</Text>
                              </View>
                              <View style={styles.payBadge}>
                                <Text style={styles.payBadgeText}>
                                  {item.paymentType === 'online' ? 'Online' : item.paymentType === 'credit' ? 'उधारी' : 'रोख'}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <Text style={styles.amountRed}>-{formatCurrency(item.amount)}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>

                <View style={styles.tallyFooter}>
                  <Text style={tw`text-xs font-bold text-gray-700`}>एकूण खर्च बेरीज:</Text>
                  <Text style={tw`text-sm font-extrabold text-red-600`}>{formatCurrency(expenseSum)}</Text>
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
    backgroundColor: '#DC2626',
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
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  summaryCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    borderRadius: 14,
    padding: 14,
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
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
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  modalSubtitle: { fontSize: 12, fontWeight: '600', color: colors.textTertiary },
  modalCloseBtn: { padding: 6, borderRadius: 20, backgroundColor: colors.surfaceSecondary },
  modalScrollBody: { maxHeight: 320 },
  heroBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 14,
    padding: 14,
  },
  heroBannerLabel: { fontSize: 11, fontWeight: '700', color: '#991B1B', marginBottom: 2 },
  heroBannerAmount: { fontSize: 22, fontWeight: '900', color: '#DC2626' },
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
  categoryBadge: {
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryBadgeText: { fontSize: 9, fontWeight: '600', color: colors.textSecondary },
  payBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  payBadgeText: { fontSize: 9, fontWeight: '700', color: colors.textTertiary },
  amountRed: { fontSize: 14, fontWeight: '900', color: colors.expense },
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

export default KharchEntryScreen;
