import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import tw from 'twrnc';
import { AppHeader } from '../../components/AppHeader';
import {
  ReportService,
  DailyLedgerService,
  MachineEntryService,
} from '../../utils/api';
import { formatCurrency } from '../../utils/currency';
import { colors } from '../../theme';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Truck,
  User,
  MapPin,
  Calendar as CalendarIcon,
} from 'lucide-react-native';

interface CalendarViewScreenProps {
  onBack: () => void;
  onNavigateToEntry?: () => void;
}

interface DailyFinancialItem {
  day: number;
  earnings: number;
  expense: number;
  profit: number;
}

interface DayEntryItem {
  id: string | number;
  type: 'earnings_machine' | 'earnings_ledger' | 'expense';
  title: string;
  subtitle?: string;
  amount: number;
  paymentType?: string;
  location?: string;
  hoursOrTrips?: string;
  category?: string;
}

const marathiMonthNames = [
  'जानेवारी',
  'फेब्रुवारी',
  'मार्च',
  'एप्रिल',
  'मे',
  'जून',
  'जुलै',
  'ऑगस्ट',
  'सप्टेंबर',
  'ऑक्टोबर',
  'नोव्हेंबर',
  'डिसेंबर',
];

const marathiWeekDays = ['रवि', 'सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

export const CalendarViewScreen: React.FC<CalendarViewScreenProps> = ({ onBack, onNavigateToEntry }) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1); // 1-indexed

  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());
  const [monthlySummary, setMonthlySummary] = useState({
    totalEarnings: 0,
    totalExpense: 0,
    totalProfit: 0,
  });

  const [dailyDataMap, setDailyDataMap] = useState<Record<number, DailyFinancialItem>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Selected Day Details State
  const [dayEntries, setDayEntries] = useState<DayEntryItem[]>([]);
  const [dayLoading, setDayLoading] = useState<boolean>(false);

  const pad = (n: number) => String(n).padStart(2, '0');
  const getSelectedIsoDate = (dayNum: number) =>
    `${currentYear}-${pad(currentMonth)}-${pad(dayNum)}`;

  // Load Monthly Calendar Aggregates
  const fetchMonthCalendar = async () => {
    setLoading(true);
    try {
      const data = await ReportService.getMonthlyReport(currentYear, currentMonth);

      if (data?.monthlySummary) {
        setMonthlySummary({
          totalEarnings: Number(data.monthlySummary.totalEarnings) || 0,
          totalExpense: Number(data.monthlySummary.totalExpense) || 0,
          totalProfit: Number(data.monthlySummary.totalProfit) || 0,
        });
      } else {
        setMonthlySummary({ totalEarnings: 0, totalExpense: 0, totalProfit: 0 });
      }

      const map: Record<number, DailyFinancialItem> = {};
      if (Array.isArray(data?.dailyChart)) {
        data.dailyChart.forEach((item: any) => {
          const d = Number(item.day);
          const earn = Number(item.earnings) || 0;
          const exp = Number(item.expense) || 0;
          map[d] = {
            day: d,
            earnings: earn,
            expense: exp,
            profit: earn - exp,
          };
        });
      }
      setDailyDataMap(map);
    } catch {
      setDailyDataMap({});
      setMonthlySummary({ totalEarnings: 0, totalExpense: 0, totalProfit: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load Specific Selected Day's Itemized Entries
  const fetchDayEntries = async (dayNum: number) => {
    const isoDate = getSelectedIsoDate(dayNum);
    setDayLoading(true);

    try {
      const [machineRes, ledgerRes] = await Promise.all([
        MachineEntryService.getAll({ date: isoDate }),
        DailyLedgerService.getAll({ date: isoDate }),
      ]);

      const items: DayEntryItem[] = [];

      // Parse Machine Entries
      const rawMachines = Array.isArray(machineRes)
        ? machineRes
        : Array.isArray(machineRes?.data)
        ? machineRes.data
        : [];

      rawMachines.forEach((m: any) => {
        const hoursVal = m.hoursOrTrips ?? m.hours_or_trips;
        const unitVal = m.hoursUnit || m.hours_unit;
        const hoursInfo = hoursVal ? `${hoursVal} ${unitVal === 'trips' ? 'फेऱ्या' : 'तास'}` : '';

        const machineTitle = m.machineName || m.machine?.name || 'मशीन काम';
        const customerName = m.customerName || m.customer?.name || '';
        const workDesc = m.workDescription || m.work_description || '';
        const entryDateVal = m.entryDate || m.entry_date;
        const toDateVal = m.toDate || m.to_date;
        const dateRangeText = toDateVal ? `${entryDateVal} ते ${toDateVal}` : null;

        items.push({
          id: `m-${m.id}`,
          type: 'earnings_machine',
          title: machineTitle,
          subtitle: [customerName, workDesc, dateRangeText].filter(Boolean).join(' • '),
          amount: Number(m.amount) || 0,
          paymentType: m.paymentType || m.payment_type || 'cash',
          location: m.location,
          hoursOrTrips: hoursInfo,
        });


      });

      // Parse Daily Ledger (Earnings & Expenses)
      const rawLedger = Array.isArray(ledgerRes)
        ? ledgerRes
        : Array.isArray(ledgerRes?.data)
        ? ledgerRes.data
        : [];

      rawLedger.forEach((l: any) => {
        const isExp = l.type === 'expense';
        let category = 'दुरुस्ती व इतर';
        const descLower = (l.description || '').toLowerCase();
        if (descLower.includes('डिझेल') || descLower.includes('diesel')) {
          category = 'इंधन (Fuel)';
        } else if (descLower.includes('पगार') || descLower.includes('मजुरी')) {
          category = 'मजुरी (Labour)';
        } else if (descLower.includes('सर्व्हिस') || descLower.includes('ऑइल')) {
          category = 'सर्व्हिसिंग (Service)';
        }

        items.push({
          id: `l-${l.id}`,
          type: isExp ? 'expense' : 'earnings_ledger',
          title: l.description || (isExp ? 'खर्च नोंद' : 'जमा नोंद'),
          subtitle: l.notes,
          amount: Number(l.amount) || 0,
          paymentType: l.paymentType || l.payment_type || 'cash',
          category: isExp ? category : undefined,
        });
      });

      setDayEntries(items);
    } catch {
      setDayEntries([]);
    } finally {
      setDayLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthCalendar();
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchDayEntries(selectedDay);
  }, [selectedDay, currentYear, currentMonth]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMonthCalendar();
    fetchDayEntries(selectedDay);
  };

  // Month Navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
    setSelectedDay(1);
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
    setSelectedDay(now.getDate());
  };

  // Calendar Grid Calculation
  const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayWeekIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 = Sun, 6 = Sat

  // Generate blank spaces for starting offset
  const leadingBlanks = Array.from({ length: firstDayWeekIndex }, (_, i) => i);
  // Generate days array 1..daysInCurrentMonth
  const daysArray = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

  // Selected Day Financials
  const currentDayStats = dailyDataMap[selectedDay] || {
    day: selectedDay,
    earnings: 0,
    expense: 0,
    profit: 0,
  };

  const selectedDateObject = new Date(currentYear, currentMonth - 1, selectedDay);
  const selectedDayWeekMarathi = marathiWeekDays[selectedDateObject.getDay()];
  const selectedDateFormatted = `${selectedDay} ${marathiMonthNames[currentMonth - 1]} ${currentYear} (${selectedDayWeekMarathi})`;

  const isTodaySelected =
    today.getFullYear() === currentYear &&
    today.getMonth() + 1 === currentMonth &&
    today.getDate() === selectedDay;

  return (
    <View style={tw`flex-1 w-full bg-[${colors.background}]`}>
      <AppHeader title="कॅलेंडर हिशोब" showBack={true} onBackPress={onBack} />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-3.5 max-w-lg mx-auto w-full gap-3.5 pb-14`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Month Switcher Control Header */}
        <View style={styles.monthHeaderCard}>
          <TouchableOpacity
            onPress={handlePrevMonth}
            style={styles.navArrowBtn}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={colors.primary} />
          </TouchableOpacity>

          <View style={tw`items-center`}>
            <Text style={styles.monthTitleText}>
              {marathiMonthNames[currentMonth - 1]} - {currentYear}
            </Text>
            <TouchableOpacity onPress={handleJumpToToday} activeOpacity={0.7}>
              <Text style={styles.todayJumpText}>आजच्या तारखेवर जा</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleNextMonth}
            style={styles.navArrowBtn}
            activeOpacity={0.7}
          >
            <ChevronRight size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Monthly Summary Strip */}
        <View style={tw`flex flex-row gap-2.5`}>
          <View style={[styles.summaryPill, { backgroundColor: colors.earningsSurface, borderColor: '#BBF7D0' }]}>
            <Text style={styles.pillLabel}>महिना कमाई</Text>
            <Text style={[styles.pillAmount, { color: colors.earnings }]}>
              {formatCurrency(monthlySummary.totalEarnings)}
            </Text>
          </View>

          <View style={[styles.summaryPill, { backgroundColor: colors.expenseSurface, borderColor: '#FECDD3' }]}>
            <Text style={styles.pillLabel}>महिना खर्च</Text>
            <Text style={[styles.pillAmount, { color: colors.expense }]}>
              {formatCurrency(monthlySummary.totalExpense)}
            </Text>
          </View>

          <View
            style={[
              styles.summaryPill,
              {
                backgroundColor: monthlySummary.totalProfit >= 0 ? '#F0FDF4' : '#FEF2F2',
                borderColor: monthlySummary.totalProfit >= 0 ? '#86EFAC' : '#FECDD3',
              },
            ]}
          >
            <Text style={styles.pillLabel}>निव्वळ नफा</Text>
            <Text
              style={[
                styles.pillAmount,
                { color: monthlySummary.totalProfit >= 0 ? colors.earnings : colors.expense },
              ]}
            >
              {formatCurrency(monthlySummary.totalProfit)}
            </Text>
          </View>
        </View>

        {/* Calendar Card & Grid */}
        <View style={styles.calendarCard}>
          {/* Day of Week Headers */}
          <View style={styles.weekHeaderRow}>
            {marathiWeekDays.map((wDay, idx) => (
              <View key={idx} style={styles.weekHeaderCell}>
                <Text
                  style={[
                    styles.weekHeaderText,
                    idx === 0 && { color: '#DC2626' }, // Sunday in Red
                  ]}
                >
                  {wDay}
                </Text>
              </View>
            ))}
          </View>

          {/* Monthly Day Cells Grid */}
          {loading && !refreshing ? (
            <View style={tw`py-14 items-center justify-center`}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={tw`text-xs text-[${colors.textTertiary}] mt-2 font-medium`}>
                कॅलेंडर डेटा लोड होत आहे...
              </Text>
            </View>
          ) : (
            <View style={styles.calendarGrid}>
              {/* Empty leading cells */}
              {leadingBlanks.map((b) => (
                <View key={`blank-${b}`} style={styles.calendarCellDisabled} />
              ))}

              {/* Day cells */}
              {daysArray.map((dayNum) => {
                const dayStats = dailyDataMap[dayNum];
                const hasEarn = (dayStats?.earnings || 0) > 0;
                const hasExp = (dayStats?.expense || 0) > 0;
                const isSelected = selectedDay === dayNum;
                const isToday =
                  today.getFullYear() === currentYear &&
                  today.getMonth() + 1 === currentMonth &&
                  today.getDate() === dayNum;

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    activeOpacity={0.7}
                    onPress={() => setSelectedDay(dayNum)}
                    style={[
                      styles.calendarCell,
                      isSelected && styles.calendarCellSelected,
                      isToday && !isSelected && styles.calendarCellToday,
                    ]}
                  >
                    {/* Day Number Badge */}
                    <View
                      style={[
                        styles.dayNumBadge,
                        isSelected && styles.dayNumBadgeSelected,
                        isToday && styles.dayNumBadgeToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumText,
                          isSelected && styles.dayNumTextSelected,
                          isToday && !isSelected && styles.dayNumTextToday,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </View>

                    {/* Indicators for Earnings & Expense */}
                    <View style={styles.cellIndicatorsRow}>
                      {hasEarn ? (
                        <View style={[styles.miniIndicatorDot, { backgroundColor: '#10B981' }]} />
                      ) : null}
                      {hasExp ? (
                        <View style={[styles.miniIndicatorDot, { backgroundColor: '#EF4444' }]} />
                      ) : null}
                    </View>

                    {/* Compact Profit / Activity Label */}
                    {hasEarn || hasExp ? (
                      <Text
                        style={[
                          styles.cellAmountText,
                          {
                            color:
                              (dayStats?.profit || 0) >= 0 ? '#059669' : '#DC2626',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {(dayStats?.profit || 0) >= 0 ? `+` : `-`}
                        {Math.abs(Math.round((dayStats?.profit || 0) / 1000))}k
                      </Text>
                    ) : (
                      <View style={tw`h-3`} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Calendar Grid Legend */}
          <View style={styles.calendarLegendRow}>
            <View style={tw`flex flex-row items-center gap-1.5`}>
              <View style={[styles.miniIndicatorDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>कमाई नोंद</Text>
            </View>
            <View style={tw`flex flex-row items-center gap-1.5`}>
              <View style={[styles.miniIndicatorDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>खर्च नोंद</Text>
            </View>
            <View style={tw`flex flex-row items-center gap-1.5`}>
              <View style={[styles.dayNumBadgeToday, tw`w-3.5 h-3.5`]} />
              <Text style={styles.legendText}>आजची तारीख</Text>
            </View>
          </View>
        </View>

        {/* Selected Day Inspector & Itemized Entries */}
        <View style={styles.dayDetailsCard}>
          {/* Day Header */}
          <View style={styles.dayDetailsHeader}>
            <View style={tw`flex flex-row items-center gap-2`}>
              <View style={styles.dayIconBadge}>
                <CalendarIcon size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.dayTitleText}>{selectedDateFormatted}</Text>
                <Text style={styles.daySubText}>
                  {isTodaySelected ? '★ आजचा दिवस' : 'निवडलेल्या दिवसाचा हिशोब'}
                </Text>
              </View>
            </View>

            {onNavigateToEntry ? (
              <TouchableOpacity
                onPress={onNavigateToEntry}
                style={styles.addEntryBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.addEntryBtnText}>+ नोंद करा</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Day's Mini Summary Row */}
          <View style={tw`flex flex-row gap-2 my-1`}>
            <View style={[styles.daySummaryBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <Text style={styles.daySummaryLabel}>जमा (कमाई)</Text>
              <Text style={[styles.daySummaryAmount, { color: '#059669' }]}>
                {formatCurrency(currentDayStats.earnings)}
              </Text>
            </View>

            <View style={[styles.daySummaryBox, { backgroundColor: '#FEF2F2', borderColor: '#FECDD3' }]}>
              <Text style={styles.daySummaryLabel}>नावे (खर्च)</Text>
              <Text style={[styles.daySummaryAmount, { color: '#DC2626' }]}>
                {formatCurrency(currentDayStats.expense)}
              </Text>
            </View>

            <View
              style={[
                styles.daySummaryBox,
                {
                  backgroundColor: currentDayStats.profit >= 0 ? '#F0FDF4' : '#FEF2F2',
                  borderColor: currentDayStats.profit >= 0 ? '#86EFAC' : '#FECDD3',
                },
              ]}
            >
              <Text style={styles.daySummaryLabel}>शिल्लक नफा</Text>
              <Text
                style={[
                  styles.daySummaryAmount,
                  { color: currentDayStats.profit >= 0 ? '#059669' : '#DC2626' },
                ]}
              >
                {formatCurrency(currentDayStats.profit)}
              </Text>
            </View>
          </View>

          {/* Day's Itemized Entries List */}
          <View style={tw`mt-2`}>
            <Text style={tw`text-xs font-bold text-gray-700 mb-2 px-1`}>
              दिवसातील नोंदी ({dayEntries.length}):
            </Text>

            {dayLoading ? (
              <View style={tw`py-8 items-center justify-center`}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={tw`text-xs text-[${colors.textTertiary}] mt-2`}>नोंदी लोड होत आहेत...</Text>
              </View>
            ) : dayEntries.length === 0 ? (
              <View style={tw`py-6 bg-gray-50 rounded-xl items-center justify-center border border-gray-100`}>
                <Text style={tw`text-xs font-semibold text-[${colors.textMuted}]`}>
                  या तारखेला कोणतीही कमाई किंवा खर्च नोंद उपलब्ध नाही.
                </Text>
              </View>
            ) : (
              dayEntries.map((item, idx) => {
                const isExp = item.type === 'expense';
                const isMachine = item.type === 'earnings_machine';

                return (
                  <View key={item.id || idx} style={styles.entryItemCard}>
                    <View style={tw`flex flex-row justify-between items-start`}>
                      <View style={tw`flex-1 pr-2`}>
                        {/* Title Row */}
                        <View style={tw`flex flex-row items-center gap-1.5`}>
                          {isMachine ? (
                            <Truck size={14} color={colors.primary} />
                          ) : isExp ? (
                            <TrendingDown size={14} color="#DC2626" />
                          ) : (
                            <TrendingUp size={14} color="#16A34A" />
                          )}
                          <Text style={styles.entryTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                        </View>

                        {/* Subtitle / Customer / Description */}
                        {item.subtitle ? (
                          <Text style={styles.entrySub} numberOfLines={2}>
                            {item.subtitle}
                          </Text>
                        ) : null}

                        {/* Badges */}
                        <View style={tw`flex flex-row items-center gap-2 mt-1.5`}>
                          {item.hoursOrTrips ? (
                            <View style={styles.hoursBadge}>
                              <Text style={styles.hoursBadgeText}>{item.hoursOrTrips}</Text>
                            </View>
                          ) : null}

                          {item.category ? (
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryBadgeText}>{item.category}</Text>
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

                      {/* Amount */}
                      <View style={tw`items-end`}>
                        <Text
                          style={[
                            styles.entryAmount,
                            { color: isExp ? '#DC2626' : '#059669' },
                          ]}
                        >
                          {isExp ? '-' : '+'}
                          {formatCurrency(item.amount)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  /* Month Header */
  monthHeaderCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  navArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  monthTitleText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  todayJumpText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },

  /* Summary Pills */
  summaryPill: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    marginBottom: 2,
  },
  pillAmount: {
    fontSize: 12,
    fontWeight: '900',
  },

  /* Calendar Card & Grid */
  calendarCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: 8,
  },
  weekHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textTertiary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCellDisabled: {
    width: '14.28%',
    height: 60,
    opacity: 0.2,
  },
  calendarCell: {
    width: '14.28%',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderRadius: 10,
  },
  calendarCellSelected: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  calendarCellToday: {
    backgroundColor: colors.surfaceSecondary,
  },
  dayNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumBadgeSelected: {
    backgroundColor: colors.primary,
  },
  dayNumBadgeToday: {
    backgroundColor: '#FDE68A',
  },
  dayNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dayNumTextSelected: {
    color: colors.white,
    fontWeight: '900',
  },
  dayNumTextToday: {
    color: '#92400E',
    fontWeight: '900',
  },
  cellIndicatorsRow: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  miniIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  cellAmountText: {
    fontSize: 9,
    fontWeight: '800',
  },
  calendarLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
  },

  /* Day Details Card */
  dayDetailsCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    gap: 8,
  },
  dayDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dayIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  daySubText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 1,
  },
  addEntryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addEntryBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },
  daySummaryBox: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySummaryLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textTertiary,
    marginBottom: 2,
  },
  daySummaryAmount: {
    fontSize: 12,
    fontWeight: '900',
  },

  /* Entries List */
  entryItemCard: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  entrySub: {
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
  entryAmount: {
    fontSize: 13,
    fontWeight: '900',
  },
});

export default CalendarViewScreen;
