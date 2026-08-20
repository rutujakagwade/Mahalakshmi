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
  Calendar,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Truck,
  ChevronRight,
  X,
  User,
  MapPin,
  Wallet,
} from 'lucide-react-native';
import { formatCurrency } from '../../utils/currency';
import { AppDatePicker } from '../../components/AppDatePicker';
import { getTodayFormatted } from '../../utils/date';
import { DailyLedgerService, MachineEntryService } from '../../utils/api';
import { colors, radii } from '../../theme';

interface DailyEntryScreenProps {
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

interface ExpenseDetailItem {
  id: string | number;
  description: string;
  amount: number;
  paymentType?: string;
  category: string;
  notes?: string;
}

export const DailyEntryScreen: React.FC<DailyEntryScreenProps> = ({ onBack }) => {
  const [date, setDate] = useState<string>(getTodayFormatted());
  const [entryType, setEntryType] = useState<'earnings' | 'expense'>('earnings');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('रोख');
  const [notes, setNotes] = useState<string>('');

  const [summary, setSummary] = useState({
    earnings: 0,
    expense: 0,
    profit: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);

  const [savedMessage, setSavedMessage] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Detail Modal States
  const [activeModal, setActiveModal] = useState<'none' | 'earnings' | 'expense' | 'profit'>('none');
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [earningsList, setEarningsList] = useState<EarningDetailItem[]>([]);
  const [expenseList, setExpenseList] = useState<ExpenseDetailItem[]>([]);

  const getIsoDate = (dStr: string) => {
    const parts = dStr.split('/');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : new Date().toISOString().split('T')[0];
  };

  const fetchDaySummary = async () => {
    setSummaryLoading(true);
    try {
      const isoDate = getIsoDate(date);
      const [summaryRes, machineRes, ledgerRes] = await Promise.all([
        DailyLedgerService.getSummary(isoDate),
        MachineEntryService.getAll({ date: isoDate }),
        DailyLedgerService.getAll({ date: isoDate }),
      ]);

      const rawMachines = Array.isArray(machineRes)
        ? machineRes
        : Array.isArray(machineRes?.data)
        ? machineRes.data
        : [];

      const rawLedger = Array.isArray(ledgerRes)
        ? ledgerRes
        : Array.isArray(ledgerRes?.data)
        ? ledgerRes.data
        : [];

      // Calculate Machine Earnings
      const machineEarnings = rawMachines.reduce(
        (sum: number, it: any) => sum + (Number(it.amount) || 0),
        0
      );

      // Calculate Ledger Earnings & Expenses
      const ledgerEarnings = rawLedger
        .filter((it: any) => it.type === 'earnings' || it.type === 'income')
        .reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);

      const ledgerExpense = rawLedger
        .filter((it: any) => it.type === 'expense')
        .reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);

      const totalEarnings = machineEarnings + ledgerEarnings;
      const totalExpense = ledgerExpense;
      const netProfit = totalEarnings - totalExpense;

      setSummary({
        earnings: totalEarnings,
        expense: totalExpense,
        profit: netProfit,
      });
    } catch {
      setSummary({ earnings: 0, expense: 0, profit: 0 });
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

      const rawMachines = Array.isArray(machineRes)
        ? machineRes
        : Array.isArray(machineRes?.data)
        ? machineRes.data
        : [];

      const rawLedger = Array.isArray(ledgerRes)
        ? ledgerRes
        : Array.isArray(ledgerRes?.data)
        ? ledgerRes.data
        : [];

      // Process Earnings (Machines + Ledger Income)
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

      // Process Expenses
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
      setEarningsList([]);
      setExpenseList([]);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    fetchDaySummary();
  }, [date]);

  const openDetailsModal = async (type: 'earnings' | 'expense' | 'profit') => {
    setActiveModal(type);
    await loadDetailEntries();
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    if (numAmount <= 0) {
      alert('कृपया योग्य रक्कम टाका');
      return;
    }
    if (!description.trim()) {
      alert('कृपया कामाचे किंवा खर्चाचे वर्णन टाका');
      return;
    }

    const payTypeMap: Record<string, 'cash' | 'online' | 'credit'> = {
      'रोख': 'cash',
      'ऑनलाइन': 'online',
      'उधारी': 'credit',
    };

    const isoDate = getIsoDate(date);
    setSaving(true);

    try {
      await DailyLedgerService.create({
        entry_date: isoDate,
        type: entryType,
        description: description.trim(),
        amount: numAmount,
        payment_type: payTypeMap[paymentType] || 'cash',
        notes: notes.trim() || undefined,
      });

      setSavedMessage('नोंद यशस्वीरित्या सेव्ह झाली!');
      setDescription('');
      setAmount('');
      setNotes('');
      await fetchDaySummary();
      setTimeout(() => setSavedMessage(''), 3000);
    } catch {
      alert('नोंद सेव्ह करताना त्रुटी आली.');
    } finally {
      setSaving(false);
    }
  };

  // Tally sums for verification
  const earningsSum = earningsList.reduce((acc, it) => acc + it.amount, 0);
  const expenseSum = expenseList.reduce((acc, it) => acc + it.amount, 0);
  const machineEarningsSum = earningsList
    .filter((it) => it.source === 'machine')
    .reduce((acc, it) => acc + it.amount, 0);
  const ledgerEarningsSum = earningsList
    .filter((it) => it.source === 'ledger')
    .reduce((acc, it) => acc + it.amount, 0);

  return (
    <View style={tw`flex-1 w-full bg-[${colors.background}]`}>
      <AppHeader
        title="रोजचा हिशोब"
        showBack={true}
        onBackPress={onBack}
        rightActionIcon="calendar"
        onRightActionPress={() => setDate(getTodayFormatted())}
      />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 max-w-lg mx-auto w-full gap-4 pb-12`}
      >
        {/* Success Banner */}
        {savedMessage ? (
          <View
            style={tw`bg-[${colors.successBg}] border border-green-200 rounded-xl py-3 px-4 flex flex-row items-center gap-2`}
          >
            <CheckCircle size={16} color={colors.success} />
            <Text style={tw`text-xs font-bold text-[${colors.success}]`}>
              {savedMessage}
            </Text>
          </View>
        ) : null}

        {/* Entry Form */}
        <AppCard style={tw`gap-4 p-4`}>
          <AppDatePicker label="दिनांक" value={date} onChange={setDate} />

          {/* Type Toggle */}
          <View>
            <Text
              style={tw`text-xs font-semibold text-[${colors.textSecondary}] mb-2`}
            >
              नोंद प्रकार
            </Text>
            <View
              style={tw`flex-row gap-2 p-1 bg-[${colors.surfaceTertiary}] rounded-xl`}
            >
              <TouchableOpacity
                onPress={() => setEntryType('earnings')}
                activeOpacity={0.7}
                style={tw`flex-1 py-2.5 rounded-lg ${
                  entryType === 'earnings'
                    ? `bg-[${colors.earnings}]`
                    : 'bg-transparent'
                }`}
              >
                <Text
                  style={tw`text-xs font-bold text-center ${
                    entryType === 'earnings'
                      ? 'text-white'
                      : `text-[${colors.textSecondary}]`
                  }`}
                >
                  कमाई (आवक)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setEntryType('expense')}
                activeOpacity={0.7}
                style={tw`flex-1 py-2.5 rounded-lg ${
                  entryType === 'expense'
                    ? `bg-[${colors.expense}]`
                    : 'bg-transparent'
                }`}
              >
                <Text
                  style={tw`text-xs font-bold text-center ${
                    entryType === 'expense'
                      ? 'text-white'
                      : `text-[${colors.textSecondary}]`
                  }`}
                >
                  खर्च (जावक)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <AppInput
            label="वर्णन"
            value={description}
            onChangeText={setDescription}
            placeholder={
              entryType === 'earnings'
                ? 'उदा. इतर भाडे / थेट काम जमा'
                : 'उदा. डिझेल / कामगार पगार / ऑइल'
            }
          />

          <AppInput
            label="रक्कम (₹)"
            value={amount}
            onChangeText={setAmount}
            placeholder="उदा. 5000"
            keyboardType="numeric"
          />

          <AppDropdown
            label="पेमेंट प्रकार"
            value={paymentType}
            onChangeText={setPaymentType}
            options={[
              { label: 'रोख (Cash)', value: 'रोख' },
              { label: 'ऑनलाइन (GPay/PhonePe)', value: 'ऑनलाइन' },
              { label: 'उधारी (Credit)', value: 'उधारी' },
            ]}
          />

          <AppInput
            label="नोंद / तपशील"
            value={notes}
            onChangeText={setNotes}
            placeholder="काही अतिरिक्त माहिती असल्यास"
          />

          <View style={tw`pt-2`}>
            <AppButton
              title={saving ? 'सेव्ह होत आहे...' : 'सेव्ह करा'}
              onPress={handleSave}
              variant="primary"
            />
          </View>
        </AppCard>

        {/* Today Summary (Original Card Design - Clickable for Detail View) */}
        <View>
          <View style={tw`flex flex-row items-center justify-between px-1 mb-2`}>
            <Text style={tw`text-xs font-bold text-[${colors.textTertiary}] uppercase tracking-wider`}>
              आजचा सारांश
            </Text>
            <Text style={tw`text-[11px] font-semibold text-[${colors.textTertiary}]`}>
              {date}
            </Text>
          </View>

          <AppCard variant="elevated" style={tw`gap-3 p-4`}>
            {/* Row 1: Total Earnings */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openDetailsModal('earnings')}
              style={tw`flex-row justify-between items-center w-full py-1.5`}
            >
              <View style={tw`flex-row items-center gap-2`}>
                <Text style={tw`font-semibold text-[${colors.textSecondary}]`}>
                  एकूण कमाई :
                </Text>
              </View>
              <View style={tw`flex-row items-center gap-1.5`}>
                <Text style={tw`font-bold text-[${colors.earnings}]`}>
                  {formatCurrency(summary.earnings)}
                </Text>
                <ChevronRight size={15} color={colors.earnings} />
              </View>
            </TouchableOpacity>

            <View style={tw`h-px bg-[${colors.borderLight}]`} />

            {/* Row 2: Total Expense */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openDetailsModal('expense')}
              style={tw`flex-row justify-between items-center w-full py-1.5`}
            >
              <View style={tw`flex-row items-center gap-2`}>
                <Text style={tw`font-semibold text-[${colors.textSecondary}]`}>
                  एकूण खर्च :
                </Text>
              </View>
              <View style={tw`flex-row items-center gap-1.5`}>
                <Text style={tw`font-bold text-[${colors.expense}]`}>
                  {formatCurrency(summary.expense)}
                </Text>
                <ChevronRight size={15} color={colors.expense} />
              </View>
            </TouchableOpacity>

            <View style={tw`h-px bg-[${colors.borderLight}]`} />

            {/* Row 3: Net Profit */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => openDetailsModal('profit')}
              style={tw`flex-row justify-between items-center w-full py-1.5`}
            >
              <View style={tw`flex-row items-center gap-2`}>
                <Text style={tw`font-bold text-[${colors.textPrimary}]`}>
                  नफा :
                </Text>
              </View>
              <View style={tw`flex-row items-center gap-1.5`}>
                <Text
                  style={[
                    tw`text-lg font-extrabold`,
                    {
                      color:
                        summary.profit >= 0
                          ? colors.earnings
                          : colors.expense,
                    },
                  ]}
                >
                  {formatCurrency(summary.profit)}
                </Text>
                <ChevronRight
                  size={16}
                  color={
                    summary.profit >= 0 ? colors.earnings : colors.expense
                  }
                />
              </View>
            </TouchableOpacity>
          </AppCard>
        </View>
      </ScrollView>

      {/* DETAIL VIEW MODAL (EARNINGS / EXPENSES / PROFIT) */}
      <Modal
        visible={activeModal !== 'none'}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActiveModal('none')}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={tw`flex flex-row items-center gap-2.5`}>
                <View
                  style={[
                    styles.modalIconBadge,
                    {
                      backgroundColor:
                        activeModal === 'earnings'
                          ? '#DCFCE7'
                          : activeModal === 'expense'
                          ? '#FEE2E2'
                          : '#FEF3C7',
                    },
                  ]}
                >
                  {activeModal === 'earnings' ? (
                    <TrendingUp size={20} color={colors.earnings} />
                  ) : activeModal === 'expense' ? (
                    <TrendingDown size={20} color={colors.expense} />
                  ) : (
                    <Wallet size={20} color="#B45309" />
                  )}
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {activeModal === 'earnings'
                      ? 'आजची एकूण कमाई तपशील'
                      : activeModal === 'expense'
                      ? 'आजचा एकूण खर्च तपशील'
                      : 'आजचा निव्वळ नफा ताळेबंद'}
                  </Text>
                  <Text style={styles.modalSubtitle}>तारीख: {date}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setActiveModal('none')}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            {modalLoading ? (
              <View style={tw`py-14 items-center justify-center`}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text
                  style={tw`text-xs text-[${colors.textTertiary}] mt-2 font-medium`}
                >
                  तपशील लोड होत आहे...
                </Text>
              </View>
            ) : (
              <>
                {/* 1. EARNINGS MODAL VIEW */}
                {activeModal === 'earnings' && (
                  <>
                    <View style={styles.heroBannerEarnings}>
                      <View
                        style={tw`flex flex-row justify-between items-center`}
                      >
                        <View>
                          <Text style={styles.heroBannerLabel}>
                            आजची एकूण कमाई
                          </Text>
                          <Text style={styles.heroBannerAmountGreen}>
                            {formatCurrency(summary.earnings)}
                          </Text>
                        </View>
                        <View style={tw`items-end`}>
                          <Text style={tw`text-[11px] text-green-700 font-bold`}>
                            मशीन: {formatCurrency(machineEarningsSum)}
                          </Text>
                          <Text
                            style={tw`text-[11px] text-green-700 font-bold mt-0.5`}
                          >
                            इतर: {formatCurrency(ledgerEarningsSum)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={tw`text-xs font-bold text-gray-700 px-1 pt-1`}>
                      कमाई नोंदी ({earningsList.length}):
                    </Text>

                    <ScrollView
                      style={styles.modalScrollBody}
                      showsVerticalScrollIndicator={true}
                    >
                      {earningsList.length === 0 ? (
                        <View style={tw`py-10 items-center justify-center`}>
                          <Text
                            style={tw`text-xs font-semibold text-[${colors.textMuted}]`}
                          >
                            आजसाठी कोणतीही कमाई नोंद उपलब्ध नाही.
                          </Text>
                        </View>
                      ) : (
                        earningsList.map((item, idx) => (
                          <View key={item.id || idx} style={styles.itemCard}>
                            <View
                              style={tw`flex flex-row justify-between items-start`}
                            >
                              <View style={tw`flex-1 pr-2`}>
                                <View
                                  style={tw`flex flex-row items-center gap-1.5`}
                                >
                                  {item.source === 'machine' ? (
                                    <Truck size={14} color={colors.primary} />
                                  ) : (
                                    <TrendingUp
                                      size={14}
                                      color={colors.earnings}
                                    />
                                  )}
                                  <Text
                                    style={styles.itemTitle}
                                    numberOfLines={1}
                                  >
                                    {item.title}
                                  </Text>
                                </View>

                                {item.subtitle ? (
                                  <Text
                                    style={styles.itemSub}
                                    numberOfLines={1}
                                  >
                                    {item.subtitle}
                                  </Text>
                                ) : null}

                                <View
                                  style={tw`flex flex-row items-center gap-2 mt-2`}
                                >
                                  {item.hoursOrTrips ? (
                                    <View style={styles.hoursBadge}>
                                      <Text style={styles.hoursBadgeText}>
                                        {item.hoursOrTrips}
                                      </Text>
                                    </View>
                                  ) : null}
                                  <View style={styles.payBadge}>
                                    <Text style={styles.payBadgeText}>
                                      {item.paymentType === 'online'
                                        ? 'Online'
                                        : item.paymentType === 'credit'
                                        ? 'उधारी'
                                        : 'रोख'}
                                    </Text>
                                  </View>
                                </View>
                              </View>

                              <Text style={styles.amountGreen}>
                                +{formatCurrency(item.amount)}
                              </Text>
                            </View>
                          </View>
                        ))
                      )}
                    </ScrollView>

                    {/* Tally Footer */}
                    <View style={styles.tallyFooter}>
                      <Text style={tw`text-xs font-bold text-gray-700`}>
                        एकूण कमाई बेरीज (Tally):
                      </Text>
                      <Text style={tw`text-sm font-extrabold text-green-700`}>
                        {formatCurrency(earningsSum)}
                      </Text>
                    </View>
                  </>
                )}

                {/* 2. EXPENSE MODAL VIEW */}
                {activeModal === 'expense' && (
                  <>
                    <View style={styles.heroBannerExpense}>
                      <View
                        style={tw`flex flex-row justify-between items-center`}
                      >
                        <View>
                          <Text style={styles.heroBannerLabelRed}>
                            आजचा एकूण खर्च
                          </Text>
                          <Text style={styles.heroBannerAmountRed}>
                            {formatCurrency(summary.expense)}
                          </Text>
                        </View>
                        <View style={tw`items-end`}>
                          <Text style={tw`text-[11px] text-red-700 font-bold`}>
                            एकूण नोंदी: {expenseList.length}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Text style={tw`text-xs font-bold text-gray-700 px-1 pt-1`}>
                      खर्च नोंदी ({expenseList.length}):
                    </Text>

                    <ScrollView
                      style={styles.modalScrollBody}
                      showsVerticalScrollIndicator={true}
                    >
                      {expenseList.length === 0 ? (
                        <View style={tw`py-10 items-center justify-center`}>
                          <Text
                            style={tw`text-xs font-semibold text-[${colors.textMuted}]`}
                          >
                            आजसाठी कोणतीही खर्च नोंद उपलब्ध नाही.
                          </Text>
                        </View>
                      ) : (
                        expenseList.map((item, idx) => (
                          <View key={item.id || idx} style={styles.itemCard}>
                            <View
                              style={tw`flex flex-row justify-between items-start`}
                            >
                              <View style={tw`flex-1 pr-2`}>
                                <View
                                  style={tw`flex flex-row items-center gap-1.5`}
                                >
                                  <TrendingDown size={14} color="#DC2626" />
                                  <Text
                                    style={styles.itemTitle}
                                    numberOfLines={1}
                                  >
                                    {item.description}
                                  </Text>
                                </View>

                                {item.notes ? (
                                  <Text
                                    style={styles.itemSub}
                                    numberOfLines={1}
                                  >
                                    {item.notes}
                                  </Text>
                                ) : null}

                                <View
                                  style={tw`flex flex-row items-center gap-2 mt-2`}
                                >
                                  <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryBadgeText}>
                                      {item.category}
                                    </Text>
                                  </View>
                                  <View style={styles.payBadge}>
                                    <Text style={styles.payBadgeText}>
                                      {item.paymentType === 'online'
                                        ? 'Online'
                                        : item.paymentType === 'credit'
                                        ? 'उधारी'
                                        : 'रोख'}
                                    </Text>
                                  </View>
                                </View>
                              </View>

                              <Text style={styles.amountRed}>
                                -{formatCurrency(item.amount)}
                              </Text>
                            </View>
                          </View>
                        ))
                      )}
                    </ScrollView>

                    {/* Tally Footer */}
                    <View style={styles.tallyFooter}>
                      <Text style={tw`text-xs font-bold text-gray-700`}>
                        एकूण खर्च बेरीज (Tally):
                      </Text>
                      <Text style={tw`text-sm font-extrabold text-red-600`}>
                        {formatCurrency(expenseSum)}
                      </Text>
                    </View>
                  </>
                )}

                {/* 3. PROFIT / LOSS STATEMENT MODAL VIEW */}
                {activeModal === 'profit' && (
                  <>
                    <View
                      style={[
                        styles.heroBannerProfit,
                        {
                          backgroundColor:
                            summary.profit >= 0 ? '#F0FDF4' : '#FEF2F2',
                          borderColor:
                            summary.profit >= 0 ? '#BBF7D0' : '#FECDD3',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.heroBannerLabel,
                          {
                            color:
                              summary.profit >= 0 ? '#15803D' : '#991B1B',
                          },
                        ]}
                      >
                        आजचा निव्वळ नफा / तोटा (Net Profit)
                      </Text>
                      <Text
                        style={[
                          styles.heroBannerAmountGreen,
                          {
                            color:
                              summary.profit >= 0 ? '#16A34A' : '#DC2626',
                          },
                        ]}
                      >
                        {formatCurrency(summary.profit)}
                      </Text>
                    </View>

                    <ScrollView
                      style={styles.modalScrollBody}
                      showsVerticalScrollIndicator={true}
                    >
                      <View style={styles.statementCard}>
                        <Text style={styles.statementTitle}>
                          आजचा आर्थिक हिशोब पडताळणी:
                        </Text>

                        <View style={styles.statementRow}>
                          <Text style={tw`text-xs font-bold text-gray-700`}>
                            (+) एकूण कमाई (मशीन + इतर):
                          </Text>
                          <Text style={tw`text-sm font-extrabold text-green-600`}>
                            +{formatCurrency(summary.earnings)}
                          </Text>
                        </View>

                        <View style={styles.statementRow}>
                          <Text style={tw`text-xs font-bold text-gray-700`}>
                            (-) एकूण खर्च (इंधन, मजुरी, इ.):
                          </Text>
                          <Text style={tw`text-sm font-extrabold text-red-600`}>
                            -{formatCurrency(summary.expense)}
                          </Text>
                        </View>

                        <View style={styles.statementDivider} />

                        <View style={styles.statementRow}>
                          <Text style={tw`text-sm font-extrabold text-gray-900`}>
                            (=) निव्वळ नफा शिल्लक:
                          </Text>
                          <Text
                            style={[
                              tw`text-base font-black`,
                              {
                                color:
                                  summary.profit >= 0
                                    ? colors.earnings
                                    : colors.expense,
                              },
                            ]}
                          >
                            {formatCurrency(summary.profit)}
                          </Text>
                        </View>
                      </View>
                    </ScrollView>

                    <View style={styles.tallyFooter}>
                      <Text style={tw`text-xs font-bold text-gray-700`}>
                        ताळेबंद स्थिती (Status):
                      </Text>
                      <Text
                        style={[
                          tw`text-sm font-extrabold`,
                          {
                            color:
                              summary.profit >= 0 ? '#15803D' : '#991B1B',
                          },
                        ]}
                      >
                        {summary.profit >= 0
                          ? '✓ नफा समाधानकारक'
                          : '⚠ तोटा नोंदवला गेला'}
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}

            {/* Bottom Close Button */}
            <TouchableOpacity
              onPress={() => setActiveModal('none')}
              style={styles.modalCloseButton}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseButtonText}>बंद करा (Close)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  summarySection: {
    marginTop: 4,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 104,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
  },
  clickableEarningsBox: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 4,
  },
  clickableExpenseBox: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 4,
  },
  clickableProfitBox: {
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    marginVertical: 4,
  },
  badgeEarnings: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeExpense: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeProfit: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tapEarningsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  tapExpenseText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991B1B',
  },

  /* Modal Styles */
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
  },
  modalScrollBody: {
    maxHeight: 320,
  },
  heroBannerEarnings: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
  },
  heroBannerExpense: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 14,
    padding: 14,
  },
  heroBannerProfit: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  heroBannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 2,
  },
  heroBannerLabelRed: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  heroBannerAmountGreen: {
    fontSize: 22,
    fontWeight: '900',
    color: '#16A34A',
  },
  heroBannerAmountRed: {
    fontSize: 22,
    fontWeight: '900',
    color: '#DC2626',
  },
  itemCard: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  itemSub: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  hoursBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  hoursBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  categoryBadge: {
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  payBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  payBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  amountGreen: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.earnings,
  },
  amountRed: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.expense,
  },
  statementCard: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  statementTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statementDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4,
  },
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
  modalCloseButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
});

export default DailyEntryScreen;
