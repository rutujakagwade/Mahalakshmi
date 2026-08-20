import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import tw from 'twrnc';
import { AppHeader } from '../../components/AppHeader';
import { AppDropdown } from '../../components/AppDropdown';
import { AppButton } from '../../components/AppButton';
import {
  Download,
  Share2,
  BarChart3,
  Calendar,
  X,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  Wallet,
  Truck,
  User,
  MapPin,
} from 'lucide-react-native';
import { formatCurrency } from '../../utils/currency';
import { ReportService, DailyLedgerService, MachineEntryService } from '../../utils/api';
import { colors } from '../../theme';

interface MonthlyReportScreenProps {
  onBack: () => void;
}

interface DailyChartItem {
  day: number;
  earnings: number;
  expense: number;
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

export const MonthlyReportScreen: React.FC<MonthlyReportScreenProps> = ({ onBack }) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const monthOptions = [
    { label: 'ऑगस्ट - 2026', value: '2026-8' },
    { label: 'जुलै - 2026', value: '2026-7' },
    { label: 'जून - 2026', value: '2026-6' },
    { label: 'मे - 2026', value: '2026-5' },
    { label: 'एप्रिल - 2026', value: '2026-4' },
    { label: 'मार्च - 2026', value: '2026-3' },
    { label: 'फेब्रुवारी - 2026', value: '2026-2' },
    { label: 'जानेवारी - 2026', value: '2026-1' },
  ];

  const [selectedMonthVal, setSelectedMonthVal] = useState<string>(`${currentYear}-${currentMonth}`);
  const [monthlySummary, setMonthlySummary] = useState({
    totalEarnings: 0,
    totalExpense: 0,
    totalProfit: 0,
  });
  const [machineSummary, setMachineSummary] = useState<any[]>([]);
  const [dailyChart, setDailyChart] = useState<DailyChartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<DailyChartItem | null>(null);

  // Expense Details Modal State
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [expenseList, setExpenseList] = useState<ExpenseItem[]>([]);
  const [expenseLoading, setExpenseLoading] = useState<boolean>(false);

  // Earnings Details Modal State
  const [showEarningsModal, setShowEarningsModal] = useState<boolean>(false);
  const [earningsList, setEarningsList] = useState<EarningDetailItem[]>([]);
  const [earningsLoading, setEarningsLoading] = useState<boolean>(false);

  // Net Profit Modal State
  const [showProfitModal, setShowProfitModal] = useState<boolean>(false);

  // Machine Detail Modal State
  const [selectedMachineReport, setSelectedMachineReport] = useState<any | null>(null);
  const [showMachineDetailModal, setShowMachineDetailModal] = useState<boolean>(false);
  const [machineDetailLoading, setMachineDetailLoading] = useState<boolean>(false);
  const [machineEntriesList, setMachineEntriesList] = useState<any[]>([]);

  const [y, m] = selectedMonthVal.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate() || 31;

  const fetchMonthly = async (mVal: string) => {
    const [year, month] = mVal.split('-').map(Number);
    const totalDays = new Date(year, month, 0).getDate() || 31;

    try {
      setLoading(true);
      const data = await ReportService.getMonthlyReport(year, month);

      let chartData: DailyChartItem[] = [];
      if (Array.isArray(data?.dailyChart) && data.dailyChart.length > 0) {
        chartData = data.dailyChart;
      } else {
        chartData = Array.from({ length: totalDays }, (_, i) => ({
          day: i + 1,
          earnings: 0,
          expense: 0,
        }));
      }

      if (data?.monthlySummary) {
        setMonthlySummary({
          totalEarnings: Number(data.monthlySummary.totalEarnings) || 0,
          totalExpense: Number(data.monthlySummary.totalExpense) || 0,
          totalProfit: Number(data.monthlySummary.totalProfit) || 0,
        });
        setMachineSummary(Array.isArray(data?.machineSummary) ? data.machineSummary : []);
        setDailyChart(chartData);

        const firstActive = chartData.find((d) => d.earnings > 0 || d.expense > 0) || chartData[0];
        if (firstActive) setSelectedDay(firstActive);
      } else {
        setMonthlySummary({ totalEarnings: 0, totalExpense: 0, totalProfit: 0 });
        setMachineSummary([]);
        setDailyChart(chartData);
        setSelectedDay(chartData[0] || null);
      }
    } catch {
      const emptyChart = Array.from({ length: totalDays }, (_, i) => ({
        day: i + 1,
        earnings: 0,
        expense: 0,
      }));
      setMonthlySummary({ totalEarnings: 0, totalExpense: 0, totalProfit: 0 });
      setMachineSummary([]);
      setDailyChart(emptyChart);
      setSelectedDay(emptyChart[0] || null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadExpenseDetails = async () => {
    const [year, month] = selectedMonthVal.split('-').map(Number);
    const mStr = String(month).padStart(2, '0');
    setExpenseLoading(true);
    setShowExpenseModal(true);

    try {
      const res = await DailyLedgerService.getAll({ type: 'expense' });
      const rawList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

      const filtered = rawList.filter((item: any) => {
        const rawDate = item.date || item.entry_date || item.created_at || '';
        const datePrefix = String(rawDate).slice(0, 7);
        return datePrefix === `${year}-${mStr}`;
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

  const loadEarningsDetails = async () => {
    const [year, month] = selectedMonthVal.split('-').map(Number);
    const mStr = String(month).padStart(2, '0');
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
        const datePrefix = String(rawDate).slice(0, 7);
        if (datePrefix === `${year}-${mStr}`) {
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
        const datePrefix = String(rawDate).slice(0, 7);
        if (datePrefix === `${year}-${mStr}`) {
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

  useEffect(() => {
    fetchMonthly(selectedMonthVal);
  }, [selectedMonthVal]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMonthly(selectedMonthVal);
  };

  const handleOpenMachineDetail = async (mItem: any) => {
    setSelectedMachineReport(mItem);
    setShowMachineDetailModal(true);
    setMachineDetailLoading(true);

    try {
      const [year, month] = selectedMonthVal.split('-').map(Number);
      const totalDays = new Date(year, month, 0).getDate() || 31;
      const startIso = `${year}-${String(month).padStart(2, '0')}-01`;
      const endIso = `${year}-${String(month).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;

      const res = await MachineEntryService.getAll({
        from_date: startIso,
        to_date: endIso,
        machine_id: String(mItem.machineId || mItem.id),
      });

      const rawList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setMachineEntriesList(rawList);
    } catch {
      setMachineEntriesList([]);
    } finally {
      setMachineDetailLoading(false);
    }
  };

  const totalMachineEarnings = machineSummary.reduce(
    (acc, cur) => acc + (Number(cur.totalEarnings) || 0),
    0
  );

  const chartDataToRender =
    dailyChart.length > 0
      ? dailyChart
      : Array.from({ length: daysInMonth }, (_, i) => ({
          day: i + 1,
          earnings: 0,
          expense: 0,
        }));

  const maxDayVal = Math.max(
    ...chartDataToRender.map((d) => Math.max(d.earnings || 0, d.expense || 0)),
    1000
  );

  const CHART_HEIGHT = 130;
  const activeEntries = chartDataToRender.filter((d) => d.earnings > 0 || d.expense > 0);

  const selectedMonthLabel =
    monthOptions.find((opt) => opt.value === selectedMonthVal)?.label || selectedMonthVal;

  // Earnings Tally Computations
  const earningsTallySum = earningsList.reduce((acc, it) => acc + it.amount, 0);
  const earningsMachineSum = earningsList.filter(it => it.source === 'machine').reduce((acc, it) => acc + it.amount, 0);
  const earningsLedgerSum = earningsList.filter(it => it.source === 'ledger').reduce((acc, it) => acc + it.amount, 0);

  // Expense Tally Computations
  const expenseTallySum = expenseList.reduce((acc, it) => acc + it.amount, 0);

  return (
    <View style={tw`flex-1 w-full bg-[${colors.background}]`}>
      <AppHeader title="मासिक रिपोर्ट" showBack={true} onBackPress={onBack} />

      <ScrollView
        contentContainerStyle={tw`p-3.5 max-w-lg mx-auto gap-3.5 pb-14`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Month Selector */}
        <View style={styles.cardContainer}>
          <AppDropdown
            label="महिना निवडा"
            value={selectedMonthVal}
            onChangeText={setSelectedMonthVal}
            options={monthOptions}
          />
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
                  {formatCurrency(monthlySummary.totalEarnings)}
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
                  {formatCurrency(monthlySummary.totalExpense)}
                </Text>
                <Text style={styles.tapToViewText}>तपशील व ताळेबंद ›</Text>
              </TouchableOpacity>

              {/* Total Profit */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setShowProfitModal(true)}
                style={[
                  styles.summaryBox,
                  styles.clickableProfitBox,
                  {
                    backgroundColor: monthlySummary.totalProfit >= 0 ? '#F0FDF4' : '#FEF2F2',
                    borderColor: monthlySummary.totalProfit >= 0 ? '#86EFAC' : '#FECDD3',
                  },
                ]}
              >
                <View style={tw`flex flex-row items-center justify-center gap-1`}>
                  <Text
                    style={[
                      styles.summaryLabel,
                      {
                        color: monthlySummary.totalProfit >= 0 ? colors.earnings : colors.expense,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    निव्वळ नफा
                  </Text>
                  <ChevronRight
                    size={12}
                    color={monthlySummary.totalProfit >= 0 ? colors.earnings : colors.expense}
                  />
                </View>
                <Text
                  style={[
                    styles.summaryAmount,
                    {
                      color: monthlySummary.totalProfit >= 0 ? colors.earnings : colors.expense,
                    },
                  ]}
                >
                  {formatCurrency(monthlySummary.totalProfit)}
                </Text>
                <Text
                  style={[
                    styles.tapEarningsText,
                    {
                      color: monthlySummary.totalProfit >= 0 ? '#059669' : '#DC2626',
                    },
                  ]}
                >
                  हिशोब ताळेबंद ›
                </Text>
              </TouchableOpacity>
            </View>

            {/* Main Day-wise Bar Chart Card */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View style={styles.chartTitleRow}>
                  <View style={styles.chartIconBadge}>
                    <BarChart3 size={16} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.chartTitle}>तारीखनिहाय हिशोब</Text>
                    <Text style={styles.chartSubtitle}>दिवसानुसार कमाई व खर्च</Text>
                  </View>
                </View>

                {/* Legend */}
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.legendText}>कमाई</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.legendText}>खर्च</Text>
                  </View>
                </View>
              </View>

              {/* Selected Day Floating Inspector */}
              {selectedDay && (
                <View style={styles.inspectorBanner}>
                  <View style={tw`flex flex-row items-center gap-1.5`}>
                    <Calendar size={13} color={colors.primary} />
                    <Text style={styles.inspectorDateText}>
                      तारीख {selectedDay.day} :
                    </Text>
                  </View>
                  <View style={styles.inspectorValuesRow}>
                    <Text style={[styles.inspectorValue, { color: '#059669' }]}>
                      कमाई {formatCurrency(selectedDay.earnings)}
                    </Text>
                    <Text style={styles.inspectorDivider}>|</Text>
                    <Text style={[styles.inspectorValue, { color: '#DC2626' }]}>
                      खर्च {formatCurrency(selectedDay.expense)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Unified Bar Chart Container */}
              <View style={styles.chartCanvas}>
                <View style={[styles.gridLine, { top: 10 }]} />
                <View style={[styles.gridLine, { top: CHART_HEIGHT / 2 }]} />

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chartScrollArea}
                >
                  {chartDataToRender.map((bar) => {
                    const hasData = bar.earnings > 0 || bar.expense > 0;
                    const earnHeight =
                      bar.earnings > 0
                        ? Math.max(Math.round((bar.earnings / maxDayVal) * CHART_HEIGHT), 10)
                        : 0;
                    const expHeight =
                      bar.expense > 0
                        ? Math.max(Math.round((bar.expense / maxDayVal) * CHART_HEIGHT), 10)
                        : 0;
                    const isSelected = selectedDay?.day === bar.day;

                    return (
                      <TouchableOpacity
                        key={bar.day}
                        activeOpacity={0.7}
                        onPress={() => setSelectedDay(bar)}
                        style={[
                          styles.barColumnTouchable,
                          isSelected && styles.barColumnSelected,
                        ]}
                      >
                        <View style={[styles.barStage, { height: CHART_HEIGHT }]}>
                          <View style={styles.pillarContainer}>
                            {earnHeight > 0 ? (
                              <View
                                style={[
                                  styles.pillar,
                                  {
                                    height: earnHeight,
                                    backgroundColor: '#10B981',
                                  },
                                ]}
                              />
                            ) : (
                              <View style={styles.pillarPlaceholder} />
                            )}
                          </View>

                          <View style={styles.pillarContainer}>
                            {expHeight > 0 ? (
                              <View
                                style={[
                                  styles.pillar,
                                  {
                                    height: expHeight,
                                    backgroundColor: '#EF4444',
                                  },
                                ]}
                              />
                            ) : (
                              <View style={styles.pillarPlaceholder} />
                            )}
                          </View>
                        </View>

                        <View style={[styles.axisDot, isSelected && styles.axisDotActive]} />

                        <Text
                          style={[
                            styles.dayNumberText,
                            isSelected && styles.dayNumberActive,
                            hasData && styles.dayNumberWithData,
                          ]}
                        >
                          {bar.day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Bottom Scroll Hint & Active Date Pills */}
              <View style={styles.chartFooter}>
                <Text style={styles.scrollHintText}>← सर्व तारखा पाहण्यासाठी आडवे सरकवा →</Text>

                {activeEntries.length > 0 && (
                  <View style={styles.activeDatesRow}>
                    <Text style={styles.activeDatesLabel}>नोंद असलेल्या तारखा:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-1.5`}>
                      {activeEntries.map((item) => (
                        <TouchableOpacity
                          key={item.day}
                          onPress={() => setSelectedDay(item)}
                          style={[
                            styles.dateChip,
                            selectedDay?.day === item.day && styles.dateChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dateChipText,
                              selectedDay?.day === item.day && styles.dateChipTextActive,
                            ]}
                          >
                            {item.day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={tw`flex flex-row gap-3`}>
              <View style={tw`flex-1`}>
                <AppButton
                  title="PDF डाउनलोड"
                  icon={<Download size={15} color="white" />}
                  onPress={() => alert('PDF तयार केली जात आहे...')}
                  variant="primary"
                />
              </View>
              <View style={tw`flex-1`}>
                <AppButton
                  title="शेअर करा"
                  icon={<Share2 size={15} color="white" />}
                  onPress={() => alert('WhatsApp शेअर मेसेज तयार केला!')}
                  variant="outline"
                />
              </View>
            </View>

            {/* Machine Breakdown Table (Clickable for Detail View) */}
            <View style={styles.tableCard}>
              <View style={tw`flex flex-row justify-between items-center px-3.5 py-2.5 bg-gray-50 border-b border-gray-200`}>
                <View style={tw`flex flex-row items-center gap-1.5`}>
                  <Truck size={14} color={colors.primary} />
                  <Text style={tw`text-xs font-bold text-[${colors.textPrimary}]`}>मशीननुसार कमाई अहवाल</Text>
                </View>
                <Text style={tw`text-[10px] font-semibold text-[${colors.textTertiary}]`}>तपशील पाहण्यासाठी टॅप करा ›</Text>
              </View>

              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { textAlign: 'left', flex: 1.3 }]}>मशीन नाव</Text>
                <Text style={[styles.tableHeaderCell, { textAlign: 'center', flex: 1 }]}>तास / फेऱ्या</Text>
                <Text style={[styles.tableHeaderCell, { textAlign: 'right', flex: 1 }]}>कमाई</Text>
              </View>

              {machineSummary.length === 0 ? (
                <Text style={tw`py-6 text-center text-xs text-[${colors.textMuted}]`}>
                  या महिन्यासाठी मशीन नोंद उपलब्ध नाही
                </Text>
              ) : (
                machineSummary.map((mItem, index) => (
                  <TouchableOpacity
                    key={mItem.id || index}
                    activeOpacity={0.7}
                    onPress={() => handleOpenMachineDetail(mItem)}
                    style={[
                      styles.tableRow,
                      index % 2 === 0 ? { backgroundColor: colors.surfaceSecondary } : { backgroundColor: colors.white },
                    ]}
                  >
                    <View style={[tw`flex flex-row items-center gap-1`, { flex: 1.3 }]}>
                      <Text style={[styles.tableCellText, { textAlign: 'left', fontWeight: '700' }]}>
                        {mItem.machineName}
                      </Text>
                      <ChevronRight size={12} color={colors.textTertiary} />
                    </View>
                    <Text style={[styles.tableCellText, { textAlign: 'center', flex: 1, color: colors.textTertiary }]}>
                      {mItem.hoursOrTrips || '0 तास'}
                    </Text>
                    <Text style={[styles.tableCellText, { textAlign: 'right', flex: 1, fontWeight: '700', color: colors.earnings }]}>
                      {formatCurrency(Number(mItem.totalEarnings) || 0)}
                    </Text>
                  </TouchableOpacity>
                ))
              )}

              {/* Table Total Footer */}
              <View style={styles.tableTotalRow}>
                <Text style={[styles.tableTotalText, { textAlign: 'left', flex: 1.3 }]}>एकूण</Text>
                <Text style={[styles.tableTotalText, { textAlign: 'center', flex: 1 }]}></Text>
                <Text style={[styles.tableTotalText, { textAlign: 'right', flex: 1, color: colors.earnings }]}>
                  {formatCurrency(totalMachineEarnings || monthlySummary.totalEarnings)}
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
                  <Text style={styles.modalTitle}>एकूण कमाई तपशील व ताळेबंद</Text>
                  <Text style={styles.modalSubtitle}>{selectedMonthLabel}</Text>
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
              <Text style={styles.earningsHeroLabel}>या महिन्यातील एकूण प्रत्यक्ष कमाई</Text>
              <Text style={styles.earningsHeroAmount}>
                {formatCurrency(earningsTallySum || monthlySummary.totalEarnings)}
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
                      या महिन्यासाठी कोणतीही कमाई नोंद उपलब्ध नाही
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

            {/* Modal Tally Verification Footer */}
            <View style={styles.modalFooter}>
              <View style={tw`flex flex-row justify-between items-center bg-gray-50 p-2.5 rounded-xl mb-2 border border-gray-200`}>
                <Text style={tw`text-xs font-bold text-gray-700`}>एकूण बेरीज ताळेबंद (Total Tally):</Text>
                <Text style={tw`text-sm font-extrabold text-green-700`}>
                  {formatCurrency(earningsTallySum || monthlySummary.totalEarnings)}
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
                  <Text style={styles.modalTitle}>एकूण खर्च तपशील व ताळेबंद</Text>
                  <Text style={styles.modalSubtitle}>{selectedMonthLabel}</Text>
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
              <Text style={styles.expenseHeroLabel}>या महिन्यातील एकूण प्रत्यक्ष खर्च</Text>
              <Text style={styles.expenseHeroAmount}>
                {formatCurrency(expenseTallySum || monthlySummary.totalExpense)}
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
                      या महिन्यासाठी खर्च नोंद उपलब्ध नाही
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

            {/* Modal Tally Verification Footer */}
            <View style={styles.modalFooter}>
              <View style={tw`flex flex-row justify-between items-center bg-gray-50 p-2.5 rounded-xl mb-2 border border-gray-200`}>
                <Text style={tw`text-xs font-bold text-gray-700`}>एकूण खर्च ताळेबंद (Total Tally):</Text>
                <Text style={tw`text-sm font-extrabold text-red-600`}>
                  {formatCurrency(expenseTallySum || monthlySummary.totalExpense)}
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
                        monthlySummary.totalProfit >= 0 ? '#DCFCE7' : '#FEE2E2',
                    },
                  ]}
                >
                  <Wallet
                    size={18}
                    color={monthlySummary.totalProfit >= 0 ? '#16A34A' : '#DC2626'}
                  />
                </View>
                <View>
                  <Text style={styles.modalTitle}>निव्वळ नफा हिशोब व ताळेबंद</Text>
                  <Text style={styles.modalSubtitle}>{selectedMonthLabel}</Text>
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
                    monthlySummary.totalProfit >= 0 ? '#F0FDF4' : '#FEF2F2',
                  borderColor:
                    monthlySummary.totalProfit >= 0 ? '#BBF7D0' : '#FECDD3',
                },
              ]}
            >
              <Text
                style={[
                  styles.profitHeroLabel,
                  {
                    color:
                      monthlySummary.totalProfit >= 0 ? '#15803D' : '#991B1B',
                  },
                ]}
              >
                {monthlySummary.totalProfit >= 0
                  ? 'या महिन्यातील निव्वळ नफा (Net Profit)'
                  : 'या महिन्यातील तोटा (Net Loss)'}
              </Text>
              <Text
                style={[
                  styles.profitHeroAmount,
                  {
                    color:
                      monthlySummary.totalProfit >= 0 ? '#059669' : '#DC2626',
                  },
                ]}
              >
                {formatCurrency(monthlySummary.totalProfit)}
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
                    {formatCurrency(monthlySummary.totalEarnings)}
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
                    {formatCurrency(monthlySummary.totalExpense)}
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

      {/* 4. MACHINE MONTHLY DETAIL MODAL */}
      <Modal
        visible={showMachineDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMachineDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={tw`flex flex-row items-center gap-2.5`}>
                <View style={[styles.modalIconBadge, { backgroundColor: '#EFF6FF' }]}>
                  <Truck size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {selectedMachineReport?.machineName || 'मशीन तपशील'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedMonthLabel} {selectedMachineReport?.regNumber ? `• ${selectedMachineReport.regNumber}` : ''}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowMachineDetailModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Machine Summary Highlight Card */}
            <View style={[styles.earningsHeroBanner, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <View style={tw`flex flex-row justify-between items-center`}>
                <View>
                  <Text style={[styles.earningsHeroLabel, { color: '#1D4ED8' }]}>
                    मशीन एकूण मासिक कमाई
                  </Text>
                  <Text style={[styles.earningsHeroAmount, { color: '#1E40AF' }]}>
                    {formatCurrency(
                      machineEntriesList.reduce((acc, it) => acc + (Number(it.amount) || 0), 0) ||
                      Number(selectedMachineReport?.totalEarnings) || 0
                    )}
                  </Text>
                </View>
                <View style={tw`items-end`}>
                  <Text style={tw`text-xs font-bold text-blue-900`}>
                    एकूण: {selectedMachineReport?.hoursOrTrips || '0 तास'}
                  </Text>
                  <Text style={tw`text-[11px] font-semibold text-blue-600 mt-0.5`}>
                    एकूण {machineEntriesList.length} नोंदी
                  </Text>
                </View>
              </View>
            </View>

            <Text style={tw`text-xs font-bold text-gray-700 px-1 pt-1`}>
              कामाचा सविस्तर तपशील ({machineEntriesList.length}):
            </Text>

            {/* Work Entries List */}
            {machineDetailLoading ? (
              <View style={tw`py-12 items-center justify-center`}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={tw`text-xs text-[${colors.textTertiary}] mt-2 font-medium`}>
                  कामाचा तपशील लोड होत आहे...
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={true}>
                {machineEntriesList.length === 0 ? (
                  <View style={tw`py-10 items-center justify-center`}>
                    <Text style={tw`text-xs font-semibold text-[${colors.textMuted}]`}>
                      या मशीनसाठी या महिन्यात कोणतीही नोंद उपलब्ध नाही
                    </Text>
                  </View>
                ) : (
                  machineEntriesList.map((entry, idx) => {
                    const entryDate = entry.date || entry.entry_date || '';
                    const entryToDate = entry.toDate || entry.to_date || null;
                    const dateText = entryToDate && entryToDate !== entryDate
                      ? `${entryDate} ते ${entryToDate}`
                      : entryDate;

                    const hoursVal = entry.hoursOrTrips ?? entry.hours_or_trips;
                    const unitVal = entry.hoursUnit || entry.hours_unit || 'hours';

                    return (
                      <View key={entry.id || idx} style={styles.machineEntryDetailCard}>
                        <View style={tw`flex flex-row justify-between items-start`}>
                          <View style={tw`flex-1 pr-2`}>
                            {/* Customer */}
                            <View style={tw`flex flex-row items-center gap-1.5`}>
                              <User size={13} color={colors.primary} />
                              <Text style={styles.machineCustomerName}>
                                {entry.customerName || entry.customer?.name || 'थेट ग्राहक'}
                              </Text>
                            </View>

                            {/* Work Description */}
                            <Text style={styles.machineWorkDesc} numberOfLines={2}>
                              {entry.workDescription || entry.work_description || 'मशीन काम'}
                            </Text>

                            {/* Date & Location */}
                            <View style={tw`flex flex-row items-center gap-2 mt-1 flex-wrap`}>
                              {dateText ? (
                                <View style={tw`flex flex-row items-center gap-1`}>
                                  <Calendar size={11} color={colors.textTertiary} />
                                  <Text style={tw`text-[11px] font-semibold text-[${colors.textTertiary}]`}>
                                    {dateText}
                                  </Text>
                                </View>
                              ) : null}

                              {entry.location ? (
                                <View style={tw`flex flex-row items-center gap-1`}>
                                  <MapPin size={11} color={colors.textTertiary} />
                                  <Text style={tw`text-[11px] text-[${colors.textTertiary}]`}>
                                    {entry.location}
                                  </Text>
                                </View>
                              ) : null}
                            </View>

                            {/* Hours / Trips Badge */}
                            <View style={tw`flex flex-row items-center gap-2 mt-2`}>
                              {hoursVal ? (
                                <View style={styles.hoursBadge}>
                                  <Text style={styles.hoursBadgeText}>
                                    {hoursVal} {unitVal === 'trips' ? 'फेऱ्या' : 'तास'}
                                  </Text>
                                </View>
                              ) : null}

                              <View style={styles.payBadge}>
                                <Text style={styles.payBadgeText}>
                                  {entry.paymentType === 'online' || entry.payment_type === 'online'
                                    ? 'Online'
                                    : entry.paymentType === 'credit' || entry.payment_type === 'credit'
                                    ? 'उधारी'
                                    : 'रोख'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Amount */}
                          <Text style={styles.machineEntryAmount}>
                            +{formatCurrency(Number(entry.amount) || 0)}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}

            {/* Modal Tally Verification Footer */}
            <View style={styles.modalFooter}>
              <View style={tw`flex flex-row justify-between items-center bg-blue-50 p-2.5 rounded-xl mb-2 border border-blue-200`}>
                <Text style={tw`text-xs font-bold text-blue-900`}>मशीन एकूण मासिक बेरीज (Tally):</Text>
                <Text style={tw`text-sm font-extrabold text-blue-700`}>
                  {formatCurrency(
                    machineEntriesList.reduce((acc, it) => acc + (Number(it.amount) || 0), 0) ||
                    Number(selectedMachineReport?.totalEarnings) || 0
                  )}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowMachineDetailModal(false)}
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
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  chartSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  inspectorBanner: {
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inspectorDateText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  inspectorValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inspectorValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  inspectorDivider: {
    fontSize: 10,
    color: colors.border,
  },
  chartCanvas: {
    height: 175,
    backgroundColor: '#FAFBFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    overflow: 'hidden',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  chartScrollArea: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  barColumnTouchable: {
    alignItems: 'center',
    paddingHorizontal: 3,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 26,
  },
  barColumnSelected: {
    backgroundColor: 'rgba(107, 18, 28, 0.08)',
  },
  barStage: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    paddingBottom: 2,
  },
  pillarContainer: {
    width: 7,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  pillar: {
    width: 7,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  pillarPlaceholder: {
    width: 7,
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 1.5,
  },
  axisDot: {
    width: '100%',
    height: 1.5,
    backgroundColor: '#CBD5E1',
    marginVertical: 3,
  },
  axisDotActive: {
    backgroundColor: colors.primary,
    height: 2,
  },
  dayNumberText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  dayNumberActive: {
    color: colors.primary,
    fontWeight: '900',
  },
  dayNumberWithData: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  chartFooter: {
    gap: 6,
  },
  scrollHintText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
    textAlign: 'center',
  },
  activeDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  activeDatesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  dateChip: {
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dateChipTextActive: {
    color: colors.white,
    fontWeight: '800',
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

  /* Common Modal Styles */
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

  /* List & Items */
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
  machineEntryDetailCard: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  machineCustomerName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  machineWorkDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  machineEntryAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.earnings,
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

export default MonthlyReportScreen;
