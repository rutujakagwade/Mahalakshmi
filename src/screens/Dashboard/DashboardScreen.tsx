import tw from 'twrnc';
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
import React, { useEffect, useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { MetricSummaryRow, ActionTileCard } from '../../components/DashboardCard';
import {
  FileText,
  Truck,
  Users,
  BarChart3,
  Calendar,
  Wrench,
  Wifi,
  WifiOff,
  TrendingUp,
  TrendingDown,
  Wallet,
  X,
  ChevronRight,
  CreditCard,
} from 'lucide-react-native';
import { ActiveScreen } from '../../types/navigation';
import {
  DashboardService,
  DailyLedgerService,
  MachineEntryService,
} from '../../utils/api';
import { formatCurrency } from '../../utils/currency';
import { colors } from '../../theme';

interface DashboardScreenProps {
  onNavigate: (screen: ActiveScreen) => void;
  onOpenDrawer?: () => void;
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

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate, onOpenDrawer }) => {
  const [summary, setSummary] = useState({ earnings: 0, expense: 0, profit: 0 });
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('डेटा लोड होत आहे...');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modals State
  const [showEarningsModal, setShowEarningsModal] = useState<boolean>(false);
  const [earningsList, setEarningsList] = useState<EarningDetailItem[]>([]);
  const [earningsLoading, setEarningsLoading] = useState<boolean>(false);

  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [expenseList, setExpenseList] = useState<ExpenseItem[]>([]);
  const [expenseLoading, setExpenseLoading] = useState<boolean>(false);

  const [showProfitModal, setShowProfitModal] = useState<boolean>(false);

  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const dateStr = today.toLocaleDateString('mr-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const fetchDashboard = async () => {
    try {
      const data = await DashboardService.getSummary();
      if (data?.todaySummary) {
        setSummary({
          earnings: Number(data.todaySummary.earnings) || 0,
          expense: Number(data.todaySummary.expense) || 0,
          profit: Number(data.todaySummary.profit) || 0,
        });
        setIsOnline(true);
        setStatusText(data.status || 'डेटा : ऑनलाइन (सिंक्ड)');
      }
    } catch {
      setIsOnline(false);
      setStatusText('डेटा : ऑफलाइन मोड');
    }
  };

  const loadEarningsDetails = async () => {
    setEarningsLoading(true);
    setShowEarningsModal(true);

    try {
      const [machineRes, ledgerRes] = await Promise.all([
        MachineEntryService.getAll({ date: todayIso }),
        DailyLedgerService.getAll({ date: todayIso, type: 'earnings' }),
      ]);

      const items: EarningDetailItem[] = [];
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

      rawMachines.forEach((mItem: any) => {
        const rawDate = mItem.date || mItem.entry_date || todayIso;
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
      });

      rawLedger.forEach((lItem: any) => {
        const rawDate = lItem.date || lItem.entry_date || todayIso;
        items.push({
          id: `l-${lItem.id}`,
          entry_date: rawDate,
          source: 'ledger',
          title: lItem.description || 'इतर कमाई',
          subtitle: lItem.notes || 'दैनिक नोंद',
          amount: Number(lItem.amount) || 0,
          payment_type: lItem.paymentType || lItem.payment_type || 'cash',
        });
      });

      setEarningsList(items);
    } catch {
      setEarningsList([]);
    } finally {
      setEarningsLoading(false);
    }
  };

  const loadExpenseDetails = async () => {
    setExpenseLoading(true);
    setShowExpenseModal(true);

    try {
      const res = await DailyLedgerService.getAll({ date: todayIso, type: 'expense' });
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : [];

      setExpenseList(
        rawList.map((it: any) => {
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
            entry_date: it.date || it.entry_date || todayIso,
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
    fetchDashboard();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  // Tally Calculations
  const earningsTallySum = earningsList.reduce((acc, it) => acc + it.amount, 0);
  const earningsMachineSum = earningsList.filter(it => it.source === 'machine').reduce((acc, it) => acc + it.amount, 0);
  const earningsLedgerSum = earningsList.filter(it => it.source === 'ledger').reduce((acc, it) => acc + it.amount, 0);
  const expenseTallySum = expenseList.reduce((acc, it) => acc + it.amount, 0);

  return (
    <View style={tw`flex-1 w-full bg-[${colors.background}]`}>
      <View style={tw`flex-1`}>
        <AppHeader
          title="महालक्ष्मी"
          subtitle="इन्फ्रा अँड अर्थमूव्हर्स"
          showMenu={true}
          onMenuPress={onOpenDrawer}
          rightActionIcon="calendar"
          onRightActionPress={() => onNavigate('CalendarView')}
          secondRightIcon="bell"
          onSecondRightActionPress={() => onNavigate('NotificationList')}
        />



        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`p-4 max-w-lg mx-auto w-full pb-8`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
              title="अपडेट होत आहे..."
              titleColor={colors.textSecondary}
            />
          }
        >
          {/* Date */}
          <Text style={tw`text-xs font-semibold text-[${colors.textTertiary}] mb-3`}>{dateStr}</Text>

          {/* Metrics Summary Cards (CLICKABLE FOR DETAIL POPUPS) */}
          <MetricSummaryRow
            earnings={summary.earnings}
            expense={summary.expense}
            profit={summary.profit}
            onEarningsPress={loadEarningsDetails}
            onExpensePress={loadExpenseDetails}
            onProfitPress={() => setShowProfitModal(true)}
          />

          {/* Action Tiles */}
          <View style={tw`mt-5`}>
            <Text style={tw`text-xs font-bold text-[${colors.textTertiary}] uppercase tracking-wider mb-3 px-1`}>कार्ये</Text>
            <View style={tw`gap-3`}>
              <View style={tw`flex flex-row gap-3`}>
                <ActionTileCard
                  title="रोजचा हिशोब"
                  subtitle="दैनिक आवक/जावक"
                  bgColor={`bg-[${colors.tileDaily}]`}
                  icon={<FileText size={22} color="white" />}
                  onPress={() => onNavigate('DailyEntry')}
                />
                <ActionTileCard
                  title="मशीन नोंद"
                  subtitle="कामाची नोंद"
                  bgColor={`bg-[${colors.tileMachine}]`}
                  icon={<Truck size={22} color="white" />}
                  onPress={() => onNavigate('MachineEntry')}
                />
              </View>

              <View style={tw`flex flex-row gap-3`}>
                <ActionTileCard
                  title="ग्राहक"
                  subtitle="ग्राहक व्यवस्थापन"
                  bgColor={`bg-[${colors.tileCustomer}]`}
                  icon={<Users size={22} color="white" />}
                  onPress={() => onNavigate('CustomerList')}
                />
                <ActionTileCard
                  title="रिपोर्ट"
                  subtitle="मासिक अहवाल"
                  bgColor={`bg-[${colors.tileReport}]`}
                  icon={<BarChart3 size={22} color="white" />}
                  onPress={() => onNavigate('MonthlyReport')}
                />
              </View>

              <View style={tw`flex flex-row gap-3`}>
                <ActionTileCard
                  title="माझं Loan"
                  subtitle="कर्ज व EMI हिशोब"
                  bgColor="bg-amber-600"
                  icon={<CreditCard size={22} color="white" />}
                  onPress={() => onNavigate('MyLoan')}
                />
                <ActionTileCard
                  title="तारीख अहवाल"
                  subtitle="दिनांक निहित"
                  bgColor={`bg-[${colors.tileDatewise}]`}
                  icon={<Calendar size={22} color="white" />}
                  onPress={() => onNavigate('DateReport')}
                />
              </View>

            </View>
          </View>
        </ScrollView>
      </View>

      {/* Status Banner */}
      <View style={tw`px-4 pb-3 pt-1 max-w-lg mx-auto w-full`}>
        <View style={tw`bg-[${isOnline ? colors.successBg : colors.earningsSurface}] border border-[${isOnline ? '#A7F3D0' : '#BBF7D0'}] rounded-xl py-2.5 px-3 flex flex-row items-center justify-center gap-2`}>
          {isOnline ? (
            <Wifi size={14} color={colors.success} />
          ) : (
            <WifiOff size={14} color={colors.earnings} />
          )}
          <Text style={tw`text-[11px] font-semibold text-[${isOnline ? colors.success : colors.earnings}]`}>{statusText}</Text>
        </View>
      </View>

      {/* 1. TODAY'S EARNINGS MODAL */}
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
                  <Text style={styles.modalTitle}>आजची एकूण कमाई तपशील</Text>
                  <Text style={styles.modalSubtitle}>{dateStr}</Text>
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

            {/* Highlight Banner */}
            <View style={styles.earningsHeroBanner}>
              <Text style={styles.earningsHeroLabel}>आजची एकूण प्रत्यक्ष कमाई</Text>
              <Text style={styles.earningsHeroAmount}>
                {formatCurrency(earningsTallySum || summary.earnings)}
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
                <Text style={tw`text-xs text-[${colors.textTertiary}] mt-2`}>नोंदी लोड होत आहेत...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={true}>
                {earningsList.length === 0 ? (
                  <View style={tw`py-10 items-center justify-center`}>
                    <Text style={tw`text-sm font-semibold text-[${colors.textMuted}]`}>
                      आजसाठी कोणतीही कमाई नोंद उपलब्ध नाही
                    </Text>
                  </View>
                ) : (
                  earningsList.map((item, index) => (
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
                  ))
                )}
              </ScrollView>
            )}

            {/* Modal Tally Verification Footer */}
            <View style={styles.modalFooter}>
              <View style={tw`flex flex-row justify-between items-center bg-gray-50 p-2.5 rounded-xl mb-2 border border-gray-200`}>
                <Text style={tw`text-xs font-bold text-gray-700`}>एकूण बेरीज ताळेबंद:</Text>
                <Text style={tw`text-sm font-extrabold text-green-700`}>
                  {formatCurrency(earningsTallySum || summary.earnings)}
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

      {/* 2. TODAY'S EXPENSE MODAL */}
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
                  <Text style={styles.modalTitle}>आजचा एकूण खर्च तपशील</Text>
                  <Text style={styles.modalSubtitle}>{dateStr}</Text>
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

            {/* Highlight Banner */}
            <View style={styles.expenseHeroBanner}>
              <Text style={styles.expenseHeroLabel}>आजचा एकूण प्रत्यक्ष खर्च</Text>
              <Text style={styles.expenseHeroAmount}>
                {formatCurrency(expenseTallySum || summary.expense)}
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
                      आजसाठी कोणतीही खर्च नोंद उपलब्ध नाही
                    </Text>
                  </View>
                ) : (
                  expenseList.map((item, index) => (
                    <View key={item.id || index} style={styles.expenseItemCard}>
                      <View style={styles.expenseItemTopRow}>
                        <View style={tw`flex-1 pr-2`}>
                          <Text style={styles.expenseItemDesc} numberOfLines={2}>
                            {item.description}
                          </Text>
                          <View style={tw`flex flex-row items-center gap-2 mt-1.5`}>
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
                  ))
                )}
              </ScrollView>
            )}

            {/* Modal Tally Verification Footer */}
            <View style={styles.modalFooter}>
              <View style={tw`flex flex-row justify-between items-center bg-gray-50 p-2.5 rounded-xl mb-2 border border-gray-200`}>
                <Text style={tw`text-xs font-bold text-gray-700`}>एकूण खर्च ताळेबंद:</Text>
                <Text style={tw`text-sm font-extrabold text-red-600`}>
                  {formatCurrency(expenseTallySum || summary.expense)}
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

      {/* 3. TODAY'S PROFIT ANALYSIS MODAL */}
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
                        summary.profit >= 0 ? '#DCFCE7' : '#FEE2E2',
                    },
                  ]}
                >
                  <Wallet
                    size={18}
                    color={summary.profit >= 0 ? '#16A34A' : '#DC2626'}
                  />
                </View>
                <View>
                  <Text style={styles.modalTitle}>आजचा नफा / तोटा हिशोब</Text>
                  <Text style={styles.modalSubtitle}>{dateStr}</Text>
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

            {/* Highlight Banner */}
            <View
              style={[
                styles.profitHeroBanner,
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
                  styles.profitHeroLabel,
                  {
                    color: summary.profit >= 0 ? '#15803D' : '#991B1B',
                  },
                ]}
              >
                {summary.profit >= 0
                  ? 'आजचा निव्वळ नफा (Today\'s Net Profit)'
                  : 'आजचा निव्वळ तोटा (Today\'s Net Loss)'}
              </Text>
              <Text
                style={[
                  styles.profitHeroAmount,
                  {
                    color: summary.profit >= 0 ? '#059669' : '#DC2626',
                  },
                ]}
              >
                {formatCurrency(summary.profit)}
              </Text>
            </View>

            {/* Profit Calculation Summary Cards */}
            <View style={tw`gap-2.5 my-2`}>
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
                    <Text style={styles.profitCalcTitle}>आजची जमा / कमाई (+)</Text>
                    <Text style={styles.profitCalcSub}>मशीन काम + इतर उत्पन्न</Text>
                  </View>
                </View>
                <View style={tw`flex flex-row items-center gap-1`}>
                  <Text style={[styles.profitCalcAmount, { color: '#059669' }]}>
                    {formatCurrency(summary.earnings)}
                  </Text>
                  <ChevronRight size={14} color="#059669" />
                </View>
              </TouchableOpacity>

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
                    <Text style={styles.profitCalcTitle}>आजचा खर्च / देणी (-)</Text>
                    <Text style={styles.profitCalcSub}>इंधन, मजुरी, दुरुस्ती, इत्यादी</Text>
                  </View>
                </View>
                <View style={tw`flex flex-row items-center gap-1`}>
                  <Text style={[styles.profitCalcAmount, { color: '#DC2626' }]}>
                    {formatCurrency(summary.expense)}
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

export default DashboardScreen;
