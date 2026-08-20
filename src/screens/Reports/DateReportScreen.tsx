import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import tw from 'twrnc';
import { AppHeader } from '../../components/AppHeader';
import { formatCurrency } from '../../utils/currency';
import { AppDatePicker } from '../../components/AppDatePicker';
import { ReportService, DailyLedgerService, MachineEntryService } from '../../utils/api';
import { colors } from '../../theme';
import {
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  ChevronRight,
} from 'lucide-react-native';

interface DateReportScreenProps {
  onBack: () => void;
}

interface DateRangeSummary {
  startDate?: string;
  endDate?: string;
  totalEarnings: number;
  totalExpense: number;
  totalProfit: number;
}

interface DateRow {
  id: string;
  date: string;
  earnings: number;
  expense: number;
  profit: number;
}

interface ExpenseItem {
  id: string | number;
  entry_date: string;
  description: string;
  amount: number;
  payment_type?: string;
  notes?: string;
  category?: string;
}

interface EarningDetailItem {
  id: string | number;
  entry_date: string;
  source: 'machine' | 'ledger';
  title: string;
  subtitle?: string;
  amount: number;
  payment_type?: string;
}

export const DateReportScreen: React.FC<DateReportScreenProps> = ({ onBack }) => {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const initialFrom = `01/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;
  const initialTo = `${pad(today.getDate())}/${pad(today.getMonth() + 1)}/${today.getFullYear()}`;

  const [fromDate, setFromDate] = useState<string>(initialFrom);
  const [toDate, setToDate] = useState<string>(initialTo);

  const [summary, setSummary] = useState<DateRangeSummary>({
    totalEarnings: 0,
    totalExpense: 0,
    totalProfit: 0,
  });
  const [rows, setRows] = useState<DateRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modals state
  const [showEarningsModal, setShowEarningsModal] = useState<boolean>(false);
  const [earningsList, setEarningsList] = useState<EarningDetailItem[]>([]);
  const [earningsLoading, setEarningsLoading] = useState<boolean>(false);

  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [expenseList, setExpenseList] = useState<ExpenseItem[]>([]);
  const [expenseLoading, setExpenseLoading] = useState<boolean>(false);

  const [showProfitModal, setShowProfitModal] = useState<boolean>(false);

  const getIsoRange = () => {
    const fromParts = fromDate.split('/');
    const toParts = toDate.split('/');
    const isoFrom = fromParts.length === 3 ? `${fromParts[2]}-${fromParts[1]}-${fromParts[0]}` : '';
    const isoTo = toParts.length === 3 ? `${toParts[2]}-${toParts[1]}-${toParts[0]}` : '';
    return { isoFrom, isoTo };
  };

  const fetchDateRangeReport = async () => {
    const { isoFrom, isoTo } = getIsoRange();

    setLoading(true);
    try {
      const data = await ReportService.getDateReport(isoFrom, isoTo);
      if (data?.dateRangeSummary) {
        setSummary({
          startDate: data.dateRangeSummary.startDate,
          endDate: data.dateRangeSummary.endDate,
          totalEarnings: Number(data.dateRangeSummary.totalEarnings) || 0,
          totalExpense: Number(data.dateRangeSummary.totalExpense) || 0,
          totalProfit: Number(data.dateRangeSummary.totalProfit) || 0,
        });
      } else {
        setSummary({ totalEarnings: 0, totalExpense: 0, totalProfit: 0 });
      }

      if (Array.isArray(data?.datewiseRows)) {
        setRows(data.datewiseRows);
      } else {
        setRows([]);
      }
    } catch {
      setSummary({ totalEarnings: 0, totalExpense: 0, totalProfit: 0 });
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadEarningsDetails = async () => {
    const { isoFrom, isoTo } = getIsoRange();
    setEarningsLoading(true);
    setShowEarningsModal(true);

    try {
      const [machineRes, ledgerRes] = await Promise.all([
        MachineEntryService.getAll(),
        DailyLedgerService.getAll({ type: 'earnings' }),
      ]);

      const items: EarningDetailItem[] = [];
      const rawMachines = Array.isArray(machineRes) ? machineRes : Array.isArray(machineRes?.data) ? machineRes.data : [];
      const rawLedger = Array.isArray(ledgerRes) ? ledgerRes : Array.isArray(ledgerRes?.data) ? ledgerRes.data : [];

      rawMachines.forEach((mItem: any) => {
        const rawDate = mItem.date || mItem.entry_date || '';
        const entryDate = String(rawDate).slice(0, 10);
        if ((!isoFrom || entryDate >= isoFrom) && (!isoTo || entryDate <= isoTo)) {
          const hoursVal = mItem.hoursOrTrips ?? mItem.hours_or_trips;
          const unitVal = mItem.hoursUnit || mItem.hours_unit;
          const hoursInfo = hoursVal ? `${hoursVal} ${unitVal === 'trips' ? 'फेऱ्या' : 'तास'}` : '';

          const machineName = mItem.machineName || mItem.machine?.name || 'मशीन काम';
          const customerName = mItem.customerName || mItem.customer?.name || '';
          const workDesc = mItem.workDescription || mItem.work_description || '';
          const subtitle = [customerName, workDesc, hoursInfo].filter(Boolean).join(' • ');

          items.push({
            id: `m-${mItem.id}`,
            entry_date: rawDate,
            source: 'machine',
            title: machineName,
            subtitle: subtitle || 'मशीन नोंद',
            amount: Number(mItem.amount) || 0,
            payment_type: mItem.paymentType || mItem.payment_type || 'cash',
          });
        }
      });

      rawLedger.forEach((lItem: any) => {
        const rawDate = lItem.date || lItem.entry_date || '';
        const entryDate = String(rawDate).slice(0, 10);
        if ((!isoFrom || entryDate >= isoFrom) && (!isoTo || entryDate <= isoTo)) {
          items.push({
            id: `l-${lItem.id}`,
            entry_date: rawDate,
            source: 'ledger',
            title: lItem.description || 'इतर कमाई',
            subtitle: lItem.notes || 'दैनिक नोंद',
            amount: Number(lItem.amount) || 0,
            payment_type: lItem.paymentType || lItem.payment_type || 'cash',
          });
        }
      });

      items.sort((a, b) => {
        const dateA = new Date(a.entry_date).getTime();
        const dateB = new Date(b.entry_date).getTime();
        return dateB - dateA;
      });

      setEarningsList(items);
    } catch {
      setEarningsList([]);
    } finally {
      setEarningsLoading(false);
    }
  };

  const loadExpenseDetails = async () => {
    const { isoFrom, isoTo } = getIsoRange();
    setExpenseLoading(true);
    setShowExpenseModal(true);

    try {
      const res = await DailyLedgerService.getAll({ type: 'expense' });
      const rawList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

      const filtered = rawList.filter((item: any) => {
        const rawDate = item.date || item.entry_date || item.created_at || '';
        const entryDate = String(rawDate).slice(0, 10);
        return (!isoFrom || entryDate >= isoFrom) && (!isoTo || entryDate <= isoTo);
      });

      setExpenseList(
        filtered.map((it: any) => {
          let category = 'दुरुस्ती व इतर';
          const descLower = (it.description || '').toLowerCase();
          if (descLower.includes('डिझेल') || descLower.includes('diesel') || descLower.includes('fuel')) {
            category = 'इंधन (Fuel)';
          } else if (descLower.includes('पगार') || descLower.includes('मजुरी') || descLower.includes('salary') || descLower.includes('labour')) {
            category = 'मजुरी (Labour)';
          } else if (descLower.includes('सर्व्हिस') || descLower.includes('ऑइल') || descLower.includes('oil') || descLower.includes('filter')) {
            category = 'सर्व्हिसिंग (Service)';
          }

          return {
            id: it.id,
            entry_date: it.date || it.entry_date || '',
            description: it.description || 'खर्च नोंद',
            amount: Number(it.amount) || 0,
            payment_type: it.paymentType || it.payment_type || 'cash',
            notes: it.notes,
            category,
          };
        })
      );
    } catch {
      setExpenseList([]);
    } finally {
      setExpenseLoading(false);
    }
  };

  useEffect(() => {
    fetchDateRangeReport();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDateRangeReport();
  };

  const selectedRangeLabel = `${fromDate} ते ${toDate}`;

  // Tally Calculations
  const earningsTallySum = earningsList.reduce((acc, it) => acc + it.amount, 0);
  const earningsMachineSum = earningsList.filter(it => it.source === 'machine').reduce((acc, it) => acc + it.amount, 0);
  const earningsLedgerSum = earningsList.filter(it => it.source === 'ledger').reduce((acc, it) => acc + it.amount, 0);
  const expenseTallySum = expenseList.reduce((acc, it) => acc + it.amount, 0);

  return (
    <View style={tw`flex-1 w-full bg-[${colors.background}]`}>
      <AppHeader
        title="तारीखनुसार हिशोब"
        showBack={true}
        onBackPress={onBack}
      />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 max-w-lg mx-auto w-full gap-4 pb-12`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Date Filters */}
        <View style={styles.cardContainer}>
          <View style={tw`flex flex-row gap-3`}>
            <View style={tw`flex-1`}>
              <AppDatePicker label="पासून (From)" value={fromDate} onChange={setFromDate} />
            </View>
            <View style={tw`flex-1`}>
              <AppDatePicker label="पर्यंत (To)" value={toDate} onChange={setToDate} />
            </View>
          </View>

          <TouchableOpacity
            onPress={fetchDateRangeReport}
            activeOpacity={0.8}
            style={styles.searchButton}
          >
            <Search size={16} color="white" />
            <Text style={styles.searchButtonText}>हिशोब शोधा (Search)</Text>
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={tw`py-12 items-center justify-center`}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={tw`text-xs text-[${colors.textTertiary}] mt-2 font-medium`}>
              डेटा लोड होत आहे...
            </Text>
          </View>
        ) : (
          <>
            {/* Interactive Summary Cards */}
            <View style={tw`flex flex-row gap-2.5`}>
              {/* Total Earnings */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={loadEarningsDetails}
                style={[
                  styles.summaryBox,
                  styles.clickableEarningsBox,
                  { backgroundColor: colors.earningsSurface, borderColor: '#BBF7D0' },
                ]}
              >
                <View style={tw`flex flex-row items-center justify-center gap-1`}>
                  <Text style={[styles.summaryLabel, { color: colors.earnings, fontWeight: '700' }]}>
                    एकूण कमाई
                  </Text>
                  <ChevronRight size={12} color={colors.earnings} />
                </View>
                <Text style={[styles.summaryAmount, { color: colors.earnings }]}>
                  {formatCurrency(summary.totalEarnings)}
                </Text>
                <Text style={styles.tapEarningsText}>तपशील व ताळेबंद ›</Text>
              </TouchableOpacity>

              {/* Total Expense */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={loadExpenseDetails}
                style={[
                  styles.summaryBox,
                  styles.clickableSummaryBox,
                  { backgroundColor: colors.expenseSurface, borderColor: '#FECDD3' },
                ]}
              >
                <View style={tw`flex flex-row items-center justify-center gap-1`}>
                  <Text style={[styles.summaryLabel, { color: colors.expense, fontWeight: '700' }]}>
                    एकूण खर्च
                  </Text>
                  <ChevronRight size={12} color={colors.expense} />
                </View>
                <Text style={[styles.summaryAmount, { color: colors.expense }]}>
                  {formatCurrency(summary.totalExpense)}
                </Text>
                <Text style={styles.tapExpenseText}>तपशील व ताळेबंद ›</Text>
              </TouchableOpacity>

              {/* Total Profit */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setShowProfitModal(true)}
                style={[
                  styles.summaryBox,
                  styles.clickableProfitBox,
                  {
                    backgroundColor: summary.totalProfit >= 0 ? '#F0FDF4' : '#FEF2F2',
                    borderColor: summary.totalProfit >= 0 ? '#86EFAC' : '#FECDD3',
                  },
                ]}
              >
                <View style={tw`flex flex-row items-center justify-center gap-1`}>
                  <Text
                    style={[
                      styles.summaryLabel,
                      {
                        color: summary.totalProfit >= 0 ? colors.earnings : colors.expense,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    नफा
                  </Text>
                  <ChevronRight
                    size={12}
                    color={summary.totalProfit >= 0 ? colors.earnings : colors.expense}
                  />
                </View>
                <Text
                  style={[
                    styles.summaryAmount,
                    {
                      color: summary.totalProfit >= 0 ? colors.earnings : colors.expense,
                    },
                  ]}
                >
                  {formatCurrency(summary.totalProfit)}
                </Text>
                <Text
                  style={[
                    styles.tapEarningsText,
                    {
                      color: summary.totalProfit >= 0 ? '#059669' : '#DC2626',
                    },
                  ]}
                >
                  हिशोब ताळेबंद ›
                </Text>
              </TouchableOpacity>
            </View>

            {/* Ledger Table */}
            <View style={styles.tableCard}>
              {/* Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'left' }]}>दिनांक</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>कमाई</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>खर्च</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>नफा</Text>
              </View>

              {/* Body */}
              {rows.length === 0 ? (
                <View style={tw`py-8 items-center justify-center`}>
                  <Text style={tw`text-xs font-semibold text-[${colors.textMuted}]`}>
                    निवडलेल्या कालावधीत कोणतीही नोंद उपलब्ध नाही
                  </Text>
                </View>
              ) : (
                rows.map((row, index) => (
                  <View
                    key={row.id || index}
                    style={[
                      styles.tableRow,
                      index % 2 === 0
                        ? { backgroundColor: colors.surfaceSecondary }
                        : { backgroundColor: colors.white },
                    ]}
                  >
                    <Text style={[styles.tableCellText, { flex: 1.2, textAlign: 'left', fontWeight: '600' }]}>
                      {row.date}
                    </Text>
                    <Text style={[styles.tableCellText, { flex: 1, textAlign: 'right', fontWeight: '700', color: colors.earnings }]}>
                      {formatCurrency(row.earnings)}
                    </Text>
                    <Text style={[styles.tableCellText, { flex: 1, textAlign: 'right', fontWeight: '700', color: colors.expense }]}>
                      {formatCurrency(row.expense)}
                    </Text>
                    <Text
                      style={[
                        styles.tableCellText,
                        {
                          flex: 1,
                          textAlign: 'right',
                          fontWeight: '800',
                          color: row.profit >= 0 ? colors.earnings : colors.expense,
                        },
                      ]}
                    >
                      {formatCurrency(row.profit)}
                    </Text>
                  </View>
                ))
              )}

              {/* Footer Total */}
              <View style={styles.tableTotalRow}>
                <Text style={[styles.tableTotalText, { flex: 1.2, textAlign: 'left' }]}>एकूण</Text>
                <Text style={[styles.tableTotalText, { flex: 1, textAlign: 'right', color: colors.earnings }]}>
                  {formatCurrency(summary.totalEarnings)}
                </Text>
                <Text style={[styles.tableTotalText, { flex: 1, textAlign: 'right', color: colors.expense }]}>
                  {formatCurrency(summary.totalExpense)}
                </Text>
                <Text
                  style={[
                    styles.tableTotalText,
                    {
                      flex: 1,
                      textAlign: 'right',
                      color: summary.totalProfit >= 0 ? colors.earnings : colors.expense,
                    },
                  ]}
                >
                  {formatCurrency(summary.totalProfit)}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* 1. EARNINGS DETAIL MODAL WITH FULL TALLY */}
      <Modal
        visible={showEarningsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEarningsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={tw`flex flex-row items-center gap-2`}>
                <View style={[styles.modalIconBadge, { backgroundColor: '#DCFCE7' }]}>
                  <TrendingUp size={18} color="#16A34A" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>कालावधीतील एकूण कमाई तपशील व ताळेबंद</Text>
                  <Text style={styles.modalSubtitle}>{selectedRangeLabel}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowEarningsModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Total Earnings Highlight Banner */}
            <View style={styles.earningsHeroBanner}>
              <Text style={styles.earningsHeroLabel}>निवडलेल्या कालावधीतील एकूण प्रत्यक्ष कमाई</Text>
              <Text style={styles.earningsHeroAmount}>
                {formatCurrency(earningsTallySum || summary.totalEarnings)}
              </Text>
              <View style={tw`flex flex-row items-center gap-3 mt-1.5`}>
                <Text style={styles.earningsHeroCount}>
                  एकूण {earningsList.length} नोंदी
                </Text>
                <Text style={styles.earningsHeroCount}>•</Text>
                <Text style={styles.earningsHeroCount}>
                  मशीन: {formatCurrency(earningsMachineSum)}
                </Text>
                <Text style={styles.earningsHeroCount}>•</Text>
                <Text style={styles.earningsHeroCount}>
                  जमा: {formatCurrency(earningsLedgerSum)}
                </Text>
              </View>
            </View>

            {/* Earnings Items List */}
            {earningsLoading ? (
              <View style={tw`py-12 items-center justify-center`}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={tw`text-xs text-[${colors.textTertiary}] mt-2`}>कमाई नोंदी लोड होत आहेत...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={true}>
                {earningsList.length === 0 ? (
                  <View style={tw`py-10 items-center justify-center`}>
                    <Text style={tw`text-sm font-semibold text-[${colors.textMuted}]`}>
                      या कालावधीत कोणतीही कमाई नोंद उपलब्ध नाही
                    </Text>
                  </View>
                ) : (
                  earningsList.map((item, index) => {
                    const dateFormatted = item.entry_date
                      ? item.entry_date.split('T')[0].split('-').reverse().join('/')
                      : '';

                    return (
                      <View key={item.id || index} style={styles.expenseItemCard}>
                        <View style={styles.expenseItemTopRow}>
                          <View style={tw`flex-1 pr-2`}>
                            <Text style={styles.expenseItemDesc} numberOfLines={2}>
                              {item.title}
                            </Text>
                            {item.subtitle ? (
                              <Text style={tw`text-xs text-[${colors.textTertiary}] mt-0.5`} numberOfLines={1}>
                                {item.subtitle}
                              </Text>
                            ) : null}
                            <View style={tw`flex flex-row items-center gap-2 mt-1.5`}>
                              <Text style={styles.expenseItemDate}>{dateFormatted}</Text>
                              <View
                                style={[
                                  styles.categoryBadge,
                                  item.source === 'machine'
                                    ? { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }
                                    : { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.categoryBadgeText,
                                    { color: item.source === 'machine' ? '#1D4ED8' : '#15803D' },
                                  ]}
                                >
                                  {item.source === 'machine' ? 'मशीन काम' : 'इतर उत्पन्न'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.expenseItemAmountCol}>
                            <Text style={[styles.expenseItemAmount, { color: '#059669' }]}>
                              +{formatCurrency(item.amount)}
                            </Text>
                            <View style={styles.payModeBadge}>
                              <Text style={styles.payModeText}>
                                {item.payment_type === 'online'
                                  ? 'Online'
                                  : item.payment_type === 'credit'
                                  ? 'उधार (Credit)'
                                  : 'रोख (Cash)'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}

            {/* Modal Footer Button */}
            <View style={styles.modalFooter}>
              <View style={tw`flex flex-row justify-between items-center bg-gray-50 p-2.5 rounded-xl mb-2 border border-gray-200`}>
                <Text style={tw`text-xs font-bold text-gray-700`}>एकूण बेरीज ताळेबंद (Total Tally):</Text>
                <Text style={tw`text-sm font-extrabold text-green-700`}>
                  {formatCurrency(earningsTallySum || summary.totalEarnings)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowEarningsModal(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseButtonText}>बंद करा (Close)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. EXPENSE DETAIL MODAL WITH FULL TALLY */}
      <Modal
        visible={showExpenseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowExpenseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={tw`flex flex-row items-center gap-2`}>
                <View style={styles.modalIconBadge}>
                  <TrendingDown size={18} color="#DC2626" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>कालावधीतील एकूण खर्च तपशील व ताळेबंद</Text>
                  <Text style={styles.modalSubtitle}>{selectedRangeLabel}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowExpenseModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Total Expense Highlight Banner */}
            <View style={styles.expenseHeroBanner}>
              <Text style={styles.expenseHeroLabel}>निवडलेल्या कालावधीतील एकूण प्रत्यक्ष खर्च</Text>
              <Text style={styles.expenseHeroAmount}>
                {formatCurrency(expenseTallySum || summary.totalExpense)}
              </Text>
              <Text style={styles.expenseHeroCount}>
                एकूण {expenseList.length} नोंदी (Entries)
              </Text>
            </View>

            {/* Expense Items List */}
            {expenseLoading ? (
              <View style={tw`py-12 items-center justify-center`}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={tw`text-xs text-[${colors.textTertiary}] mt-2`}>खर्च नोंदी लोड होत आहेत...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={true}>
                {expenseList.length === 0 ? (
                  <View style={tw`py-10 items-center justify-center`}>
                    <Text style={tw`text-sm font-semibold text-[${colors.textMuted}]`}>
                      या कालावधीत कोणतीही खर्च नोंद उपलब्ध नाही
                    </Text>
                  </View>
                ) : (
                  expenseList.map((item, index) => {
                    const dateFormatted = item.entry_date
                      ? item.entry_date.split('T')[0].split('-').reverse().join('/')
                      : '';

                    return (
                      <View key={item.id || index} style={styles.expenseItemCard}>
                        <View style={styles.expenseItemTopRow}>
                          <View style={tw`flex-1 pr-2`}>
                            <Text style={styles.expenseItemDesc} numberOfLines={2}>
                              {item.description}
                            </Text>
                            <View style={tw`flex flex-row items-center gap-2 mt-1.5`}>
                              <Text style={styles.expenseItemDate}>{dateFormatted}</Text>
                              {item.category && (
                                <View style={styles.categoryBadge}>
                                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          <View style={styles.expenseItemAmountCol}>
                            <Text style={styles.expenseItemAmount}>
                              -{formatCurrency(item.amount)}
                            </Text>
                            <View style={styles.payModeBadge}>
                              <Text style={styles.payModeText}>
                                {item.payment_type === 'online' ? 'Online' : 'रोख (Cash)'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}

            {/* Modal Footer Button */}
            <View style={styles.modalFooter}>
              <View style={tw`flex flex-row justify-between items-center bg-gray-50 p-2.5 rounded-xl mb-2 border border-gray-200`}>
                <Text style={tw`text-xs font-bold text-gray-700`}>एकूण खर्च ताळेबंद (Total Tally):</Text>
                <Text style={tw`text-sm font-extrabold text-red-600`}>
                  {formatCurrency(expenseTallySum || summary.totalExpense)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowExpenseModal(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseButtonText}>बंद करा (Close)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. NET PROFIT ANALYSIS MODAL */}
      <Modal
        visible={showProfitModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={tw`flex flex-row items-center gap-2`}>
                <View
                  style={[
                    styles.modalIconBadge,
                    {
                      backgroundColor:
                        summary.totalProfit >= 0 ? '#DCFCE7' : '#FEE2E2',
                    },
                  ]}
                >
                  <Wallet
                    size={18}
                    color={summary.totalProfit >= 0 ? '#16A34A' : '#DC2626'}
                  />
                </View>
                <View>
                  <Text style={styles.modalTitle}>नफा / तोटा हिशोब व ताळेबंद</Text>
                  <Text style={styles.modalSubtitle}>{selectedRangeLabel}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowProfitModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Net Profit Highlight Banner */}
            <View
              style={[
                styles.profitHeroBanner,
                {
                  backgroundColor:
                    summary.totalProfit >= 0 ? '#F0FDF4' : '#FEF2F2',
                  borderColor:
                    summary.totalProfit >= 0 ? '#BBF7D0' : '#FECDD3',
                },
              ]}
            >
              <Text
                style={[
                  styles.profitHeroLabel,
                  {
                    color:
                      summary.totalProfit >= 0 ? '#15803D' : '#991B1B',
                  },
                ]}
              >
                {summary.totalProfit >= 0
                  ? 'या कालावधीतील निव्वळ नफा (Net Profit)'
                  : 'या कालावधीतील निव्वळ तोटा (Net Loss)'}
              </Text>
              <Text
                style={[
                  styles.profitHeroAmount,
                  {
                    color:
                      summary.totalProfit >= 0 ? '#059669' : '#DC2626',
                  },
                ]}
              >
                {formatCurrency(summary.totalProfit)}
              </Text>
            </View>

            {/* Profit Calculation Summary Cards */}
            <View style={tw`gap-2.5 my-2`}>
              {/* Earnings Row */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setShowProfitModal(false);
                  loadEarningsDetails();
                }}
                style={[styles.profitCalcRow, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
              >
                <View style={tw`flex flex-row items-center gap-2`}>
                  <View style={[styles.profitDot, { backgroundColor: '#10B981' }]} />
                  <View>
                    <Text style={styles.profitCalcTitle}>एकूण जमा / कमाई (+)</Text>
                    <Text style={styles.profitCalcSub}>मशीन काम + इतर उत्पन्न</Text>
                  </View>
                </View>
                <View style={tw`flex flex-row items-center gap-1`}>
                  <Text style={[styles.profitCalcAmount, { color: '#059669' }]}>
                    {formatCurrency(summary.totalEarnings)}
                  </Text>
                  <ChevronRight size={14} color="#059669" />
                </View>
              </TouchableOpacity>

              {/* Expense Row */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setShowProfitModal(false);
                  loadExpenseDetails();
                }}
                style={[styles.profitCalcRow, { backgroundColor: '#FEF2F2', borderColor: '#FECDD3' }]}
              >
                <View style={tw`flex flex-row items-center gap-2`}>
                  <View style={[styles.profitDot, { backgroundColor: '#EF4444' }]} />
                  <View>
                    <Text style={styles.profitCalcTitle}>एकूण खर्च / देणी (-)</Text>
                    <Text style={styles.profitCalcSub}>इंधन, मजुरी, दुरुस्ती, इत्यादी</Text>
                  </View>
                </View>
                <View style={tw`flex flex-row items-center gap-1`}>
                  <Text style={[styles.profitCalcAmount, { color: '#DC2626' }]}>
                    {formatCurrency(summary.totalExpense)}
                  </Text>
                  <ChevronRight size={14} color="#DC2626" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Modal Footer Button */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setShowProfitModal(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseButtonText}>बंद करा (Close)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  searchButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchButtonText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 13,
  },
  summaryBox: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clickableEarningsBox: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  clickableSummaryBox: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  clickableProfitBox: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: 2,
  },
  summaryAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  tapToViewText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.expense,
    marginTop: 2,
  },
  tapEarningsText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.earnings,
    marginTop: 2,
  },
  tapExpenseText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.expense,
    marginTop: 2,
  },
  tableCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceTertiary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textTertiary,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tableCellText: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: colors.goldLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 2,
    borderTopColor: colors.gold,
  },
  tableTotalText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  /* Modal Common Styles */
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
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
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

  /* Earnings Banner */
  earningsHeroBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsHeroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 2,
  },
  earningsHeroAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#16A34A',
  },
  earningsHeroCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803D',
    marginTop: 2,
  },

  /* Expense Banner */
  expenseHeroBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseHeroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 2,
  },
  expenseHeroAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#DC2626',
  },
  expenseHeroCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B91C1C',
    marginTop: 2,
  },

  /* Profit Banner */
  profitHeroBanner: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profitHeroLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  profitHeroAmount: {
    fontSize: 24,
    fontWeight: '900',
  },
  profitCalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  profitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  profitCalcTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  profitCalcSub: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textTertiary,
    marginTop: 1,
  },
  profitCalcAmount: {
    fontSize: 14,
    fontWeight: '900',
  },

  /* Items */
  modalScrollBody: {
    maxHeight: 340,
  },
  expenseItemCard: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  expenseItemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseItemDesc: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  expenseItemDate: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
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
  expenseItemAmountCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  expenseItemAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#DC2626',
  },
  payModeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  payModeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  modalFooter: {
    paddingTop: 8,
  },
  modalCloseButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
});

export default DateReportScreen;
