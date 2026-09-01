import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import tw from 'twrnc';
import { AppHeader } from '../../components/AppHeader';
import { AppCard } from '../../components/AppCard';
import { formatCurrency } from '../../utils/currency';
import { colors } from '../../theme';
import { LoanService, MachineService } from '../../utils/api';
import { SafeStorage } from '../../utils/storage';
import { AppDatePicker } from '../../components/AppDatePicker';
import { getTodayFormatted } from '../../utils/date';
import {
  Loan,
  LoanDashboardSummary,
  CCLoanAccount,
  CCTransaction,
  CCTransactionType,
} from '../../types/loan';
import {
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  ChevronRight,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Percent,
  History,
  Trash2,
  Edit3,
  X,
  Truck,
  FileText,
} from 'lucide-react-native';

interface LoanListScreenProps {
  onBack: () => void;
  onNavigateToAddLoan: () => void;
  onNavigateToLoanDetail: (loanId: string) => void;
}

type LoanSection = 'emi' | 'cc';
type FilterTab = 'all' | 'active' | 'due' | 'completed';

const CC_STORAGE_KEY = '@mahalaxmi_cc_loans_v1';

export const LoanListScreen: React.FC<LoanListScreenProps> = ({
  onBack,
  onNavigateToAddLoan,
  onNavigateToLoanDetail,
}) => {
  // Top Level Section Switcher
  const [loanSection, setLoanSection] = useState<LoanSection>('emi');

  // ─── Regular EMI Loans State ──────────────────────────────────────────────
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanDashboardSummary | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // ─── CC Loans State ───────────────────────────────────────────────────────
  const [ccLoans, setCcLoans] = useState<CCLoanAccount[]>([]);
  const [machinesList, setMachinesList] = useState<any[]>([]);

  // Modals for CC
  const [isAddCCModalOpen, setIsAddCCModalOpen] = useState<boolean>(false);
  const [editingCCId, setEditingCCId] = useState<string | null>(null);
  const [ccBankName, setCcBankName] = useState<string>('');
  const [ccAccountNo, setCcAccountNo] = useState<string>('');
  const [ccLimit, setCcLimit] = useState<string>('');
  const [ccInitialUsed, setCcInitialUsed] = useState<string>('');
  const [ccInterestRate, setCcInterestRate] = useState<string>('9.5');
  const [ccRenewalDate, setCcRenewalDate] = useState<string>(getTodayFormatted());
  const [ccLinkedMachine, setCcLinkedMachine] = useState<string>('');
  const [ccNotes, setCcNotes] = useState<string>('');

  // CC Transaction Modal
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);
  const [selectedCCForTx, setSelectedCCForTx] = useState<CCLoanAccount | null>(null);
  const [txType, setTxType] = useState<CCTransactionType>('withdraw');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(getTodayFormatted());
  const [txPaymentMethod, setTxPaymentMethod] = useState<'cash' | 'online' | 'bank_transfer' | 'cheque'>('bank_transfer');
  const [txDesc, setTxDesc] = useState<string>('');

  // CC Passbook Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [detailCCAccount, setDetailCCAccount] = useState<CCLoanAccount | null>(null);

  // ─── Load Data ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [loansRes, summaryRes, storedCC, machRes] = await Promise.all([
        LoanService.getAll().catch(() => []),
        LoanService.getDashboardSummary().catch(() => null),
        SafeStorage.getItem(CC_STORAGE_KEY).catch(() => null),
        MachineService.getAll().catch(() => []),
      ]);

      const loansList = Array.isArray(loansRes)
        ? loansRes
        : Array.isArray(loansRes?.data)
        ? loansRes.data
        : [];

      setLoans(loansList);
      if (summaryRes?.data || summaryRes) {
        setSummary(summaryRes?.data || summaryRes);
      }

      if (storedCC) {
        try {
          const parsed = JSON.parse(storedCC);
          if (Array.isArray(parsed)) {
            setCcLoans(parsed);
          }
        } catch {}
      }

      const machData = Array.isArray(machRes) ? machRes : Array.isArray(machRes?.data) ? machRes.data : [];
      setMachinesList(machData);
    } catch {
      setLoans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ─── CC Loans Persistence ────────────────────────────────────────────────
  const saveCCLoans = async (updated: CCLoanAccount[]) => {
    setCcLoans(updated);
    try {
      await SafeStorage.setItem(CC_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // ─── CC Dashboard Calculations ───────────────────────────────────────────
  const ccDashboardSummary = useMemo(() => {
    const totalSanctionLimit = ccLoans.reduce((sum, c) => sum + (Number(c.sanctionLimit) || 0), 0);
    const totalUsedAmount = ccLoans.reduce((sum, c) => sum + (Number(c.currentOutstanding) || 0), 0);
    const totalAvailableLimit = Math.max(0, totalSanctionLimit - totalUsedAmount);
    const utilizationPercentage = totalSanctionLimit > 0
      ? Math.min(100, Math.round((totalUsedAmount / totalSanctionLimit) * 100))
      : 0;

    // Monthly estimated interest
    const estimatedMonthlyInterest = ccLoans.reduce((sum, c) => {
      const used = Number(c.currentOutstanding) || 0;
      const rate = Number(c.interestRate) || 9.5;
      return sum + (used * (rate / 100)) / 12;
    }, 0);

    return {
      totalSanctionLimit,
      totalUsedAmount,
      totalAvailableLimit,
      utilizationPercentage,
      estimatedMonthlyInterest: Math.round(estimatedMonthlyInterest),
      totalAccountsCount: ccLoans.length,
    };
  }, [ccLoans]);

  // ─── Handlers: Add / Edit CC Account ─────────────────────────────────────
  const handleOpenAddCC = () => {
    setEditingCCId(null);
    setCcBankName('');
    setCcAccountNo('');
    setCcLimit('');
    setCcInitialUsed('');
    setCcInterestRate('9.5');
    setCcRenewalDate(getTodayFormatted());
    setCcLinkedMachine('');
    setCcNotes('');
    setIsAddCCModalOpen(true);
  };

  const handleOpenEditCC = (acc: CCLoanAccount) => {
    setEditingCCId(acc.id);
    setCcBankName(acc.bankName);
    setCcAccountNo(acc.accountNumber || '');
    setCcLimit(String(acc.sanctionLimit || ''));
    setCcInitialUsed(String(acc.currentOutstanding || ''));
    setCcInterestRate(String(acc.interestRate || '9.5'));
    setCcRenewalDate(acc.renewalDate || getTodayFormatted());
    setCcLinkedMachine(acc.linkedMachine || '');
    setCcNotes(acc.notes || '');
    setIsAddCCModalOpen(true);
  };

  const handleSaveCCAccount = () => {
    if (!ccBankName.trim()) {
      Alert.alert('त्रुटी', 'कृपया बँक किंवा संस्थेचे नाव टाका.');
      return;
    }
    const limit = parseFloat(ccLimit.replace(/,/g, '')) || 0;
    if (limit <= 0) {
      Alert.alert('त्रुटी', 'कृपया वैध CC मर्यादा (Limit) टाका.');
      return;
    }
    const used = parseFloat(ccInitialUsed.replace(/,/g, '')) || 0;
    const rate = parseFloat(ccInterestRate) || 9.5;

    if (editingCCId) {
      // Edit
      const updated = ccLoans.map((c) =>
        c.id === editingCCId
          ? {
              ...c,
              bankName: ccBankName.trim(),
              accountNumber: ccAccountNo.trim() || undefined,
              sanctionLimit: limit,
              currentOutstanding: used,
              interestRate: rate,
              renewalDate: ccRenewalDate,
              linkedMachine: ccLinkedMachine.trim() || undefined,
              notes: ccNotes.trim() || undefined,
            }
          : c
      );
      saveCCLoans(updated);
      if (detailCCAccount && detailCCAccount.id === editingCCId) {
        const refreshed = updated.find((c) => c.id === editingCCId) || null;
        setDetailCCAccount(refreshed);
      }
    } else {
      // New
      const newId = `cc_${Date.now()}`;
      const initialTx: CCTransaction[] = [];
      if (used > 0) {
        initialTx.push({
          id: `tx_${Date.now()}`,
          ccLoanId: newId,
          date: ccRenewalDate || getTodayFormatted(),
          type: 'withdraw',
          amount: used,
          description: 'सुरुवातीची उचल शिल्लक (Opening Balance)',
          balanceAfter: used,
          paymentMethod: 'bank_transfer',
          createdAt: new Date().toISOString(),
        });
      }

      const newAccount: CCLoanAccount = {
        id: newId,
        bankName: ccBankName.trim(),
        accountNumber: ccAccountNo.trim() || undefined,
        sanctionLimit: limit,
        currentOutstanding: used,
        interestRate: rate,
        renewalDate: ccRenewalDate,
        linkedMachine: ccLinkedMachine.trim() || undefined,
        notes: ccNotes.trim() || undefined,
        transactions: initialTx,
        createdAt: new Date().toISOString(),
      };
      saveCCLoans([newAccount, ...ccLoans]);
    }

    setIsAddCCModalOpen(false);
  };

  const handleDeleteCCAccount = (id: string) => {
    Alert.alert('CC खाते हटवा', 'तुम्हाला खरोखर हे CC खाते व त्याचे सर्व व्यवहार हटवायचे आहेत का?', [
      { text: 'नाही', style: 'cancel' },
      {
        text: 'होय, हटवा',
        style: 'destructive',
        onPress: () => {
          const updated = ccLoans.filter((c) => c.id !== id);
          saveCCLoans(updated);
          setIsDetailModalOpen(false);
          setDetailCCAccount(null);
        },
      },
    ]);
  };

  // ─── Handlers: CC Transactions (Withdraw / Deposit / Interest) ─────────────
  const handleOpenTransaction = (acc: CCLoanAccount, defaultType: CCTransactionType = 'withdraw') => {
    setSelectedCCForTx(acc);
    setTxType(defaultType);
    setTxAmount('');
    setTxDate(getTodayFormatted());
    setTxPaymentMethod('bank_transfer');
    setTxDesc('');
    setIsTransactionModalOpen(true);
  };

  const handleSaveTransaction = () => {
    if (!selectedCCForTx) return;
    const amt = parseFloat(txAmount.replace(/,/g, '')) || 0;
    if (amt <= 0) {
      Alert.alert('त्रुटी', 'कृपया वैध रक्कम टाका.');
      return;
    }

    const currentUsed = Number(selectedCCForTx.currentOutstanding) || 0;
    let newUsed = currentUsed;

    if (txType === 'withdraw' || txType === 'interest') {
      newUsed = currentUsed + amt;
      if (newUsed > selectedCCForTx.sanctionLimit && txType === 'withdraw') {
        Alert.alert(
          'मर्यादा ओलांडली',
          `ही उचल केल्यास वापरलेली रक्कम (₹${newUsed.toLocaleString('en-IN')}) CC मर्यादेपेक्षा (₹${selectedCCForTx.sanctionLimit.toLocaleString('en-IN')}) जास्त होईल. तरीही नोंद करायची आहे का?`,
          [
            { text: 'रद्द करा', style: 'cancel' },
            { text: 'होय, करा', onPress: () => commitTransaction(newUsed, amt) },
          ]
        );
        return;
      }
    } else if (txType === 'deposit') {
      newUsed = Math.max(0, currentUsed - amt);
    }

    commitTransaction(newUsed, amt);
  };

  const commitTransaction = (newUsed: number, amt: number) => {
    if (!selectedCCForTx) return;

    const newTx: CCTransaction = {
      id: `tx_${Date.now()}`,
      ccLoanId: selectedCCForTx.id,
      date: txDate,
      type: txType,
      amount: amt,
      description: txDesc.trim() || (txType === 'withdraw' ? 'उचल नोंद' : txType === 'deposit' ? 'भरणा / जमा नोंद' : 'मासिक व्याज आकारणी'),
      balanceAfter: newUsed,
      paymentMethod: txPaymentMethod,
      createdAt: new Date().toISOString(),
    };

    const updatedAcc = {
      ...selectedCCForTx,
      currentOutstanding: newUsed,
      transactions: [newTx, ...(selectedCCForTx.transactions || [])],
    };

    const updatedList = ccLoans.map((c) => (c.id === selectedCCForTx.id ? updatedAcc : c));
    saveCCLoans(updatedList);

    if (detailCCAccount && detailCCAccount.id === selectedCCForTx.id) {
      setDetailCCAccount(updatedAcc);
    }

    setIsTransactionModalOpen(false);
    setSelectedCCForTx(null);
  };

  // ─── Handlers: Open Detail Modal ──────────────────────────────────────────
  const handleOpenDetailModal = (acc: CCLoanAccount) => {
    setDetailCCAccount(acc);
    setIsDetailModalOpen(true);
  };

  // ─── Filter EMI Loans ─────────────────────────────────────────────────────
  const filteredLoans = loans.filter((loan) => {
    if (activeTab === 'active') return loan.status === 'active' || loan.status === 'payment_due';
    if (activeTab === 'due') return loan.status === 'payment_due' || loan.status === 'overdue';
    if (activeTab === 'completed') return loan.status === 'completed';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          bg: '#ECFDF5',
          text: '#059669',
          border: '#A7F3D0',
          label: 'कर्ज पूर्ण (Completed)',
          icon: CheckCircle2,
        };
      case 'overdue':
        return {
          bg: '#FEF2F2',
          text: '#DC2626',
          border: '#FECDD3',
          label: 'थकीत हप्ता (Overdue)',
          icon: AlertCircle,
        };
      case 'payment_due':
        return {
          bg: '#FFFBEB',
          text: '#D97706',
          border: '#FDE68A',
          label: 'हप्ता देय (Due Soon)',
          icon: Clock,
        };
      default:
        return {
          bg: '#EFF6FF',
          text: '#2563EB',
          border: '#BFDBFE',
          label: 'चालू कर्ज (Active)',
          icon: CreditCard,
        };
    }
  };

  return (
    <View style={tw`flex-1 bg-[${colors.background}]`}>
      <AppHeader
        title="माझं Loan (कर्ज खाते)"
        showBack={true}
        onBackPress={onBack}
        rightActionIcon="plus"
        onRightActionPress={loanSection === 'emi' ? onNavigateToAddLoan : handleOpenAddCC}
      />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-24 gap-3.5`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* ═════════════════════════════════════════════════════════════════════
            1. TOP SECTION TOGGLE: [ हप्ते कर्ज ] vs [ CC कर्ज ]
        ═════════════════════════════════════════════════════════════════════ */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            onPress={() => setLoanSection('emi')}
            style={[styles.segmentBtn, loanSection === 'emi' && styles.segmentBtnActive]}
            activeOpacity={0.8}
          >
            <Landmark size={15} color={loanSection === 'emi' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.segmentText, loanSection === 'emi' && styles.segmentTextActive]}>
              हप्ते कर्ज (EMI)
            </Text>
            <View style={[styles.segmentBadge, loanSection === 'emi' && styles.segmentBadgeActive]}>
              <Text style={[styles.segmentBadgeText, loanSection === 'emi' && styles.segmentBadgeTextActive]}>
                {loans.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setLoanSection('cc')}
            style={[styles.segmentBtn, loanSection === 'cc' && styles.segmentBtnActiveCC]}
            activeOpacity={0.8}
          >
            <CreditCard size={15} color={loanSection === 'cc' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.segmentText, loanSection === 'cc' && styles.segmentTextActive]}>
              CC कर्ज (Cash Credit)
            </Text>
            <View style={[styles.segmentBadge, loanSection === 'cc' && styles.segmentBadgeActive]}>
              <Text style={[styles.segmentBadgeText, loanSection === 'cc' && styles.segmentBadgeTextActive]}>
                {ccLoans.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ═════════════════════════════════════════════════════════════════════
            2. SECTION A: EMI LOANS (हप्ते कर्ज)
        ═════════════════════════════════════════════════════════════════════ */}
        {loanSection === 'emi' ? (
          <>
            {/* Overall Dashboard Summary Hero */}
            <View style={styles.heroCard}>
              <View style={tw`flex flex-row justify-between items-center mb-3`}>
                <View style={tw`flex flex-row items-center gap-2`}>
                  <View style={styles.heroIconBox}>
                    <Landmark size={20} color={colors.gold} />
                  </View>
                  <Text style={styles.heroTitle}>हप्ते कर्ज सारांश (Overview)</Text>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>
                    {summary?.activeLoansCount || 0} चालू कर्जे
                  </Text>
                </View>
              </View>

              {/* Grid of 3 Main Counters */}
              <View style={tw`flex flex-row gap-2 mb-3`}>
                <View style={[styles.statBox, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                  <Text style={styles.statBoxLabel}>एकूण कर्ज</Text>
                  <Text style={styles.statBoxAmount} numberOfLines={1}>
                    {formatCurrency(summary?.totalLoanAmount || 0)}
                  </Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: 'rgba(22, 163, 74, 0.15)' }]}>
                  <Text style={[styles.statBoxLabel, { color: '#86EFAC' }]}>भरलेली रक्कम</Text>
                  <Text style={[styles.statBoxAmount, { color: '#4ADE80' }]} numberOfLines={1}>
                    {formatCurrency(summary?.totalPaidAmount || 0)}
                  </Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Text style={[styles.statBoxLabel, { color: '#FCA5A5' }]}>बाकी रक्कम</Text>
                  <Text style={[styles.statBoxAmount, { color: '#F87171' }]} numberOfLines={1}>
                    {formatCurrency(summary?.totalRemainingAmount || 0)}
                  </Text>
                </View>
              </View>

              {/* Overall Repayment Progress Bar */}
              <View style={tw`mt-1`}>
                <View style={tw`flex flex-row justify-between items-center mb-1.5`}>
                  <Text style={styles.progressLabel}>एकूण परतफेड प्रगती</Text>
                  <Text style={styles.progressValue}>{summary?.overallProgress || 0}%</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.min(summary?.overallProgress || 0, 100)}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Upcoming EMI Reminder Banner (If Any) */}
            {summary?.upcomingInstallments && summary.upcomingInstallments.length > 0 ? (
              <View style={styles.reminderBanner}>
                <View style={tw`flex flex-row items-center gap-2 mb-1.5`}>
                  <AlertCircle size={16} color="#B45309" />
                  <Text style={styles.reminderTitle}>
                    पुढील हप्ता रिमाइंडर ({summary.upcomingInstallments.length})
                  </Text>
                </View>

                <View style={tw`gap-1.5`}>
                  {summary.upcomingInstallments.slice(0, 2).map((up, i) => (
                    <TouchableOpacity
                      key={up.installmentId || i}
                      onPress={() => onNavigateToLoanDetail(up.loanId)}
                      activeOpacity={0.8}
                      style={styles.upcomingItemRow}
                    >
                      <View style={tw`flex-1`}>
                        <Text style={styles.upcomingLoanName} numberOfLines={1}>
                          {up.loanName} ({up.lenderName})
                        </Text>
                        <Text style={styles.upcomingDueText}>
                          हप्ता #{up.installmentNumber} • दिनांक: {up.dueDate}
                          {up.daysLeft < 0
                            ? ` (🔴 ${Math.abs(up.daysLeft)} दिवस उशीर)`
                            : up.daysLeft === 0
                            ? ' (🟠 आज देय)'
                            : ` (${up.daysLeft} दिवस शिल्लक)`}
                        </Text>
                      </View>
                      <View style={tw`items-end`}>
                        <Text style={styles.upcomingAmount}>{formatCurrency(up.amount)}</Text>
                        <Text style={styles.payNowActionText}>हप्ता भरा ›</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Filter Tabs */}
            <View style={styles.tabsContainer}>
              {[
                { key: 'all', label: `सर्व (${loans.length})` },
                {
                  key: 'active',
                  label: `चालू (${loans.filter((l) => l.status === 'active' || l.status === 'payment_due').length})`,
                },
                {
                  key: 'due',
                  label: `थकीत (${loans.filter((l) => l.status === 'payment_due' || l.status === 'overdue').length})`,
                },
                {
                  key: 'completed',
                  label: `पूर्ण (${loans.filter((l) => l.status === 'completed').length})`,
                },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key as FilterTab)}
                  style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === tab.key && styles.tabButtonTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Loan Cards List */}
            {loading && !refreshing ? (
              <View style={tw`py-12 items-center justify-center`}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={tw`text-xs text-[${colors.textTertiary}] mt-2 font-medium`}>
                  कर्ज डेटा लोड होत आहे...
                </Text>
              </View>
            ) : filteredLoans.length === 0 ? (
              <View style={styles.emptyCard}>
                <Landmark size={42} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>कोणतेही हप्ते कर्ज सापडले नाही</Text>
                <Text style={styles.emptySub}>
                  तुमचे बँक कर्ज, वाहन कर्ज किंवा खाजगी कर्ज नोंदवण्यासाठी खालील बटनावर क्लिक करा.
                </Text>
                <TouchableOpacity
                  style={styles.addLoanCta}
                  onPress={onNavigateToAddLoan}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color={colors.white} />
                  <Text style={styles.addLoanCtaText}>नवीन कर्ज जोडा (+ Add Loan)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredLoans.map((loan) => {
                const badge = getStatusBadge(loan.status);
                const BadgeIcon = badge.icon;
                const progress = loan.progressPercentage || 0;

                return (
                  <AppCard
                    key={loan.id}
                    variant="elevated"
                    style={styles.loanCard}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => onNavigateToLoanDetail(loan.id)}
                    >
                      {/* Top Header Row */}
                      <View style={tw`flex flex-row justify-between items-start mb-2`}>
                        <View style={tw`flex-1 pr-2`}>
                          <Text style={styles.loanCardName} numberOfLines={1}>
                            {loan.name}
                          </Text>
                          <Text style={styles.loanCardLender} numberOfLines={1}>
                            🏦 {loan.lenderName}
                            {loan.accountNumber ? ` • खा. क्र: ${loan.accountNumber}` : ''}
                          </Text>
                        </View>

                        {/* Status Badge */}
                        <View
                          style={[
                            styles.loanStatusBadge,
                            {
                              backgroundColor: badge.bg,
                              borderColor: badge.border,
                            },
                          ]}
                        >
                          <BadgeIcon size={11} color={badge.text} />
                          <Text style={[styles.loanStatusText, { color: badge.text }]}>
                            {badge.label}
                          </Text>
                        </View>
                      </View>

                      {/* 3-Col Financial Breakdown */}
                      <View style={styles.loanFinancialsGrid}>
                        <View style={styles.loanFinCol}>
                          <Text style={styles.loanFinLabel}>एकूण कर्ज</Text>
                          <Text style={styles.loanFinValue} numberOfLines={1}>
                            {formatCurrency(loan.totalAmount)}
                          </Text>
                        </View>
                        <View style={[styles.loanFinCol, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.borderLight }]}>
                          <Text style={[styles.loanFinLabel, { color: '#059669' }]}>भरलेले</Text>
                          <Text style={[styles.loanFinValue, { color: '#059669' }]} numberOfLines={1}>
                            {formatCurrency(loan.paidAmount || 0)}
                          </Text>
                        </View>
                        <View style={styles.loanFinCol}>
                          <Text style={[styles.loanFinLabel, { color: '#DC2626' }]}>शिल्लक</Text>
                          <Text style={[styles.loanFinValue, { color: '#DC2626' }]} numberOfLines={1}>
                            {formatCurrency(loan.remainingAmount || 0)}
                          </Text>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View style={tw`my-2.5`}>
                        <View style={tw`flex flex-row justify-between items-center mb-1`}>
                          <Text style={tw`text-[11px] text-gray-500 font-medium`}>
                            हप्ते: {loan.paidInstallmentsCount || 0}/{loan.totalInstallments}
                          </Text>
                          <Text style={tw`text-[11px] font-bold text-gray-700`}>{progress}%</Text>
                        </View>
                        <View style={styles.loanProgressTrack}>
                          <View
                            style={[
                              styles.loanProgressFill,
                              {
                                width: `${Math.min(progress, 100)}%`,
                                backgroundColor:
                                  progress >= 100
                                    ? '#10B981'
                                    : progress >= 50
                                    ? '#2563EB'
                                    : '#F59E0B',
                              },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Card Footer: Next EMI Info */}
                      <View style={styles.loanCardFooter}>
                        {loan.status === 'completed' ? (
                          <View style={tw`flex flex-row items-center gap-1.5`}>
                            <CheckCircle2 size={14} color="#10B981" />
                            <Text style={tw`text-xs font-bold text-green-700`}>
                              सर्व हप्ते पूर्ण भरले आहेत!
                            </Text>
                          </View>
                        ) : loan.nextInstallment ? (
                          <View style={tw`flex-1`}>
                            <Text style={styles.nextEmiLabel}>पुढील EMI:</Text>
                            <Text style={styles.nextEmiValue}>
                              {formatCurrency(loan.nextInstallment.amount)} •{' '}
                              {loan.nextInstallment.dueDate}
                            </Text>
                          </View>
                        ) : (
                          <Text style={tw`text-xs text-gray-500`}>EMI: {formatCurrency(loan.emiAmount)}/महिना</Text>
                        )}

                        <View style={tw`flex flex-row items-center gap-1`}>
                          <Text style={styles.viewDetailText}>तपशील पहा</Text>
                          <ChevronRight size={14} color={colors.primary} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </AppCard>
                );
              })
            )}
          </>
        ) : (
          /* ═════════════════════════════════════════════════════════════════════
              3. SECTION B: CC KARJ (CASH CREDIT / OVERDRAFT)
          ═════════════════════════════════════════════════════════════════════ */
          <>
            {/* CC Overview Hero Card */}
            <View style={styles.ccHeroCard}>
              <View style={tw`flex flex-row justify-between items-center mb-3`}>
                <View style={tw`flex flex-row items-center gap-2`}>
                  <View style={styles.ccHeroIconBox}>
                    <CreditCard size={20} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={styles.heroTitle}>CC कर्ज खाते सारांश</Text>
                    <Text style={tw`text-[11px] text-amber-200 font-medium`}>कॅश क्रेडिट / ओव्हरड्राफ्ट लिमिट</Text>
                  </View>
                </View>
                <View style={styles.ccActiveBadge}>
                  <Text style={styles.ccActiveBadgeText}>
                    {ccDashboardSummary.totalAccountsCount} खाती
                  </Text>
                </View>
              </View>

              {/* Grid of 3 Main Counters */}
              <View style={tw`flex flex-row gap-2 mb-3`}>
                <View style={[styles.statBox, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                  <Text style={styles.statBoxLabel}>एकूण मर्यादा (Limit)</Text>
                  <Text style={styles.statBoxAmount} numberOfLines={1}>
                    {formatCurrency(ccDashboardSummary.totalSanctionLimit)}
                  </Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <Text style={[styles.statBoxLabel, { color: '#FCA5A5' }]}>वापरलेली उचल</Text>
                  <Text style={[styles.statBoxAmount, { color: '#F87171' }]} numberOfLines={1}>
                    {formatCurrency(ccDashboardSummary.totalUsedAmount)}
                  </Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <Text style={[styles.statBoxLabel, { color: '#6EE7B7' }]}>शिल्लक मर्यादा</Text>
                  <Text style={[styles.statBoxAmount, { color: '#34D399' }]} numberOfLines={1}>
                    {formatCurrency(ccDashboardSummary.totalAvailableLimit)}
                  </Text>
                </View>
              </View>

              {/* CC Utilization Progress Bar */}
              <View style={tw`mt-1`}>
                <View style={tw`flex flex-row justify-between items-center mb-1.5`}>
                  <Text style={styles.progressLabel}>
                    मर्यादा वापर (Utilization): {ccDashboardSummary.utilizationPercentage}%
                  </Text>
                  <Text style={tw`text-[11px] text-amber-300 font-bold`}>
                    अंदाजे व्याज: ₹{ccDashboardSummary.estimatedMonthlyInterest.toLocaleString('en-IN')}/महिना
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${ccDashboardSummary.utilizationPercentage}%`,
                        backgroundColor:
                          ccDashboardSummary.utilizationPercentage > 85
                            ? '#EF4444'
                            : ccDashboardSummary.utilizationPercentage > 60
                            ? '#F59E0B'
                            : '#10B981',
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* CC Action Bar */}
            <View style={tw`flex flex-row items-center justify-between px-1 py-1`}>
              <Text style={tw`text-[14px] font-bold text-gray-800`}>
                नोंदवलेली CC खाती ({ccLoans.length})
              </Text>
              <TouchableOpacity
                onPress={handleOpenAddCC}
                style={tw`flex-row items-center gap-1 bg-[#78350F] px-3 py-1.5 rounded-lg shadow-sm`}
                activeOpacity={0.8}
              >
                <Plus size={14} color="white" />
                <Text style={tw`text-[12px] font-bold text-white`}>+ नवीन CC खाते</Text>
              </TouchableOpacity>
            </View>

            {/* CC Loan Accounts List */}
            {ccLoans.length === 0 ? (
              <View style={styles.emptyCard}>
                <CreditCard size={42} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>कोणतेही CC कर्ज खाते सापडले नाही</Text>
                <Text style={styles.emptySub}>
                  बँकेचे कॅश क्रेडिट (Cash Credit / CC) किंवा ओव्हरड्राफ्ट खाते नोंदवण्यासाठी खालील बटनावर क्लिक करा.
                </Text>
                <TouchableOpacity
                  style={[styles.addLoanCta, { backgroundColor: '#78350F' }]}
                  onPress={handleOpenAddCC}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color={colors.white} />
                  <Text style={styles.addLoanCtaText}>नवीन CC कर्ज जोडा (+ Add CC Loan)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              ccLoans.map((acc) => {
                const limit = Number(acc.sanctionLimit) || 0;
                const used = Number(acc.currentOutstanding) || 0;
                const available = Math.max(0, limit - used);
                const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
                const estInterest = Math.round((used * ((Number(acc.interestRate) || 9.5) / 100)) / 12);

                return (
                  <AppCard key={acc.id} variant="elevated" style={styles.ccCard}>
                    {/* Header */}
                    <View style={tw`flex-row justify-between items-start mb-2`}>
                      <View style={tw`flex-1 pr-2`}>
                        <View style={tw`flex-row items-center gap-2`}>
                          <Text style={styles.ccCardBankName} numberOfLines={1}>
                            {acc.bankName}
                          </Text>
                        </View>
                        <Text style={styles.ccCardSub} numberOfLines={1}>
                          {acc.accountNumber ? `खाते क्र: ${acc.accountNumber}` : 'CC कर्ज खाते'}
                          {acc.interestRate ? ` • व्याज: ${acc.interestRate}%` : ''}
                        </Text>
                      </View>

                      {acc.linkedMachine ? (
                        <View style={styles.ccMachineBadge}>
                          <Truck size={10} color="#78350F" />
                          <Text style={styles.ccMachineBadgeText} numberOfLines={1}>
                            {acc.linkedMachine}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.ccStatusPill}>
                          <Text style={styles.ccStatusPillText}>सक्रिय (Active)</Text>
                        </View>
                      )}
                    </View>

                    {/* Financial Stats 3-Col Box */}
                    <View style={styles.ccFinancialsGrid}>
                      <View style={styles.ccFinCol}>
                        <Text style={styles.ccFinLabel}>CC मर्यादा</Text>
                        <Text style={styles.ccFinValue} numberOfLines={1}>
                          {formatCurrency(limit)}
                        </Text>
                      </View>
                      <View style={[styles.ccFinCol, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E5E7EB' }]}>
                        <Text style={[styles.ccFinLabel, { color: '#DC2626' }]}>वापरलेली उचल</Text>
                        <Text style={[styles.ccFinValue, { color: '#DC2626' }]} numberOfLines={1}>
                          {formatCurrency(used)}
                        </Text>
                      </View>
                      <View style={styles.ccFinCol}>
                        <Text style={[styles.ccFinLabel, { color: '#059669' }]}>शिल्लक मर्यादा</Text>
                        <Text style={[styles.ccFinValue, { color: '#059669' }]} numberOfLines={1}>
                          {formatCurrency(available)}
                        </Text>
                      </View>
                    </View>

                    {/* Utilization Bar */}
                    <View style={tw`my-2.5`}>
                      <View style={tw`flex-row justify-between items-center mb-1`}>
                        <Text style={tw`text-[11px] text-gray-500 font-medium`}>
                          मर्यादा वापर: <Text style={tw`font-bold text-gray-800`}>{percent}%</Text>
                        </Text>
                        <Text style={tw`text-[11px] text-amber-800 font-bold`}>
                          अंदाजे मासिक व्याज: ₹{estInterest.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.loanProgressTrack}>
                        <View
                          style={[
                            styles.loanProgressFill,
                            {
                              width: `${percent}%`,
                              backgroundColor: percent > 85 ? '#DC2626' : percent > 60 ? '#D97706' : '#16A34A',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Action Buttons Row */}
                    <View style={styles.ccActionsRow}>
                      {/* 1. Withdraw Button (उचल) */}
                      <TouchableOpacity
                        style={[styles.ccActionBtn, styles.ccWithdrawBtn]}
                        onPress={() => handleOpenTransaction(acc, 'withdraw')}
                        activeOpacity={0.8}
                      >
                        <ArrowUpRight size={13} color="#DC2626" />
                        <Text style={styles.ccWithdrawBtnText}>उचल (- ₹)</Text>
                      </TouchableOpacity>

                      {/* 2. Deposit Button (जमा) */}
                      <TouchableOpacity
                        style={[styles.ccActionBtn, styles.ccDepositBtn]}
                        onPress={() => handleOpenTransaction(acc, 'deposit')}
                        activeOpacity={0.8}
                      >
                        <ArrowDownLeft size={13} color="#16A34A" />
                        <Text style={styles.ccDepositBtnText}>जमा (+ ₹)</Text>
                      </TouchableOpacity>

                      {/* 3. Passbook Statement */}
                      <TouchableOpacity
                        style={[styles.ccActionBtn, styles.ccStatementBtn]}
                        onPress={() => handleOpenDetailModal(acc)}
                        activeOpacity={0.8}
                      >
                        <History size={13} color="#2563EB" />
                        <Text style={styles.ccStatementBtnText}>पासबुक ›</Text>
                      </TouchableOpacity>
                    </View>
                  </AppCard>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Add CTA */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={loanSection === 'emi' ? onNavigateToAddLoan : handleOpenAddCC}
        activeOpacity={0.85}
      >
        <Plus size={20} color={colors.white} />
        <Text style={styles.fabText}>
          {loanSection === 'emi' ? '+ नवीन हप्ते कर्ज जोडा' : '+ नवीन CC कर्ज जोडा'}
        </Text>
      </TouchableOpacity>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 1: ADD / EDIT CC LOAN ACCOUNT
      ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isAddCCModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAddCCModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {/* Header */}
            <View style={styles.modalSheetHeader}>
              <View style={tw`flex-row items-center gap-2`}>
                <CreditCard size={20} color="#78350F" />
                <Text style={styles.modalSheetTitle}>
                  {editingCCId ? 'CC खाते माहिती बदला' : 'नवीन CC कर्ज खाते जोडा'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddCCModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={tw`p-4 gap-3.5`} keyboardShouldPersistTaps="handled">
              {/* Field 1: Bank Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>बँक किंवा संस्थेचे नाव <Text style={styles.reqStar}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  value={ccBankName}
                  onChangeText={setCcBankName}
                  placeholder="उदा. बँक ऑफ महाराष्ट्र CC / SBI Overdraft"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Field 2: Account Number */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>CC खाते क्रमांक (ऐच्छिक)</Text>
                <TextInput
                  style={styles.formInput}
                  value={ccAccountNo}
                  onChangeText={setCcAccountNo}
                  placeholder="उदा. 60123456789"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* Field 3: Sanction Limit */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>मंजूर CC मर्यादा (Limit ₹) <Text style={styles.reqStar}>*</Text></Text>
                <TextInput
                  style={[styles.formInput, { fontWeight: 'bold' }]}
                  value={ccLimit}
                  onChangeText={setCcLimit}
                  placeholder="उदा. 1000000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* Field 4: Initial Used Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>सध्या वापरलेली उचल रक्कम (Used ₹)</Text>
                <TextInput
                  style={[styles.formInput, { color: '#DC2626', fontWeight: 'bold' }]}
                  value={ccInitialUsed}
                  onChangeText={setCcInitialUsed}
                  placeholder="उदा. 450000 (नसल्यास 0 ठेवा)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* Field 5: Interest Rate */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>वार्षिक व्याज दर (% Interest Rate)</Text>
                <TextInput
                  style={styles.formInput}
                  value={ccInterestRate}
                  onChangeText={setCcInterestRate}
                  placeholder="उदा. 9.5"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* Field 6: Renewal Date */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>रिन्यूअल / एक्सपायरी तारीख</Text>
                <AppDatePicker label="" value={ccRenewalDate} onChange={setCcRenewalDate} />
              </View>

              {/* Field 7: Linked Machine Picker */}
              {machinesList.length > 0 ? (
                <View style={styles.formGroup}>
                  <View style={tw`flex-row justify-between items-center mb-1`}>
                    <Text style={styles.formLabel}>संबंधित मशीन / तारण (ऐच्छिक)</Text>
                    {ccLinkedMachine ? (
                      <TouchableOpacity onPress={() => setCcLinkedMachine('')}>
                        <Text style={tw`text-[11px] text-red-600 font-bold`}>काढून टाका</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`flex-row gap-1.5 py-1`}>
                    {machinesList.map((m: any) => {
                      const mName = m.name || m.machine_name;
                      const isSel = ccLinkedMachine === mName;
                      return (
                        <TouchableOpacity
                          key={m.id || mName}
                          onPress={() => setCcLinkedMachine(isSel ? '' : mName)}
                          style={[styles.machineChip, isSel && styles.machineChipActive]}
                          activeOpacity={0.7}
                        >
                          <Truck size={12} color={isSel ? '#78350F' : '#4B5563'} />
                          <Text style={[styles.machineChipText, isSel && styles.machineChipTextActive]}>
                            {mName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              {/* Field 8: Notes */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>टिप / शेरा (Notes)</Text>
                <TextInput
                  style={[styles.formInput, { minHeight: 50, textAlignVertical: 'top' }]}
                  value={ccNotes}
                  onChangeText={setCcNotes}
                  placeholder="उदा. स्टॉक तारण, शाखेचे नाव..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.modalPrimarySaveBtn}
                onPress={handleSaveCCAccount}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimarySaveBtnText}>
                  {editingCCId ? 'बदल जतन करा (Update)' : 'CC कर्ज खाते जोडा (Save)'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 2: CC TRANSACTION (उचल / जमा / व्याज नोंद)
      ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isTransactionModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsTransactionModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {/* Header */}
            <View style={styles.modalSheetHeader}>
              <View style={tw`flex-row items-center gap-2`}>
                {txType === 'withdraw' ? (
                  <ArrowUpRight size={20} color="#DC2626" />
                ) : txType === 'deposit' ? (
                  <ArrowDownLeft size={20} color="#16A34A" />
                ) : (
                  <Percent size={20} color="#D97706" />
                )}
                <Text style={styles.modalSheetTitle}>
                  {selectedCCForTx?.bankName}: {txType === 'withdraw' ? 'उचल नोंद (Withdraw)' : txType === 'deposit' ? 'जमा / भरणा (Deposit)' : 'व्याज आकारणी (Interest)'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsTransactionModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={tw`p-4 gap-3.5`} keyboardShouldPersistTaps="handled">
              {/* Type Switcher */}
              <View style={styles.txTypeSegmentContainer}>
                <TouchableOpacity
                  style={[styles.txTypeSegmentBtn, txType === 'withdraw' && styles.txTypeWithdrawActive]}
                  onPress={() => setTxType('withdraw')}
                  activeOpacity={0.7}
                >
                  <ArrowUpRight size={13} color={txType === 'withdraw' ? 'white' : '#DC2626'} />
                  <Text style={[styles.txTypeSegmentText, txType === 'withdraw' && { color: 'white' }]}>
                    उचल (Withdraw)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.txTypeSegmentBtn, txType === 'deposit' && styles.txTypeDepositActive]}
                  onPress={() => setTxType('deposit')}
                  activeOpacity={0.7}
                >
                  <ArrowDownLeft size={13} color={txType === 'deposit' ? 'white' : '#16A34A'} />
                  <Text style={[styles.txTypeSegmentText, txType === 'deposit' && { color: 'white' }]}>
                    जमा (Deposit)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.txTypeSegmentBtn, txType === 'interest' && styles.txTypeInterestActive]}
                  onPress={() => setTxType('interest')}
                  activeOpacity={0.7}
                >
                  <Percent size={13} color={txType === 'interest' ? 'white' : '#D97706'} />
                  <Text style={[styles.txTypeSegmentText, txType === 'interest' && { color: 'white' }]}>
                    व्याज
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Current Status Box */}
              <View style={tw`bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex-row justify-between items-center`}>
                <View>
                  <Text style={tw`text-[11px] text-amber-800 font-medium`}>सध्याची वापरलेली उचल</Text>
                  <Text style={tw`text-[13px] font-bold text-red-600`}>
                    {formatCurrency(selectedCCForTx?.currentOutstanding || 0)}
                  </Text>
                </View>
                <View style={tw`items-end`}>
                  <Text style={tw`text-[11px] text-amber-800 font-medium`}>शिल्लक मर्यादा</Text>
                  <Text style={tw`text-[13px] font-bold text-green-700`}>
                    {formatCurrency(Math.max(0, (selectedCCForTx?.sanctionLimit || 0) - (selectedCCForTx?.currentOutstanding || 0)))}
                  </Text>
                </View>
              </View>

              {/* Field 1: Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>रक्कम (₹) <Text style={styles.reqStar}>*</Text></Text>
                <TextInput
                  style={[styles.formInput, { fontSize: 18, fontWeight: 'bold', color: txType === 'withdraw' ? '#DC2626' : '#16A34A' }]}
                  value={txAmount}
                  onChangeText={setTxAmount}
                  placeholder="उदा. 50000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  autoFocus
                />
              </View>

              {/* Field 2: Date */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>तारीख <Text style={styles.reqStar}>*</Text></Text>
                <AppDatePicker label="" value={txDate} onChange={setTxDate} />
              </View>

              {/* Field 3: Payment Method */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>पेमेंट माध्यम</Text>
                <View style={tw`flex-row gap-2`}>
                  {(['bank_transfer', 'online', 'cheque', 'cash'] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setTxPaymentMethod(m)}
                      style={[
                        styles.payMethodPill,
                        txPaymentMethod === m && styles.payMethodPillActive,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.payMethodText, txPaymentMethod === m && styles.payMethodTextActive]}>
                        {m === 'bank_transfer' ? 'बँक ट्रान्सफर' : m === 'online' ? 'ऑनलाइन / UPI' : m === 'cheque' ? 'चेक' : 'रोख'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Field 4: Description / Reason */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>तपशील / कारण (Description)</Text>
                <TextInput
                  style={[styles.formInput, { minHeight: 50, textAlignVertical: 'top' }]}
                  value={txDesc}
                  onChangeText={setTxDesc}
                  placeholder={
                    txType === 'withdraw'
                      ? 'उदा. डिझेल पेमेंटसाठी उचल / साहित्य खरेदी'
                      : txType === 'deposit'
                      ? 'उदा. साईट बिलाचे पैसे जमा'
                      : 'उदा. महिन्याचे व्याज'
                  }
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.modalPrimarySaveBtn,
                  {
                    backgroundColor: txType === 'withdraw' ? '#DC2626' : txType === 'deposit' ? '#16A34A' : '#D97706',
                  },
                ]}
                onPress={handleSaveTransaction}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimarySaveBtnText}>
                  {txType === 'withdraw' ? 'उचल नोंद करा (Confirm Withdrawal)' : txType === 'deposit' ? 'जमा नोंद करा (Confirm Deposit)' : 'व्याज नोंद करा (Save Interest)'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL 3: CC PASSBOOK STATEMENT & DETAILS
      ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isDetailModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDetailModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { maxHeight: '90%' }]}>
            {/* Header */}
            <View style={styles.modalSheetHeader}>
              <View style={tw`flex-1 pr-2`}>
                <Text style={styles.modalSheetTitle} numberOfLines={1}>
                  {detailCCAccount?.bankName}
                </Text>
                <Text style={tw`text-[11px] text-gray-500 font-medium`}>
                  पासबुक व व्यवहार इतिहास (Statement)
                </Text>
              </View>
              <View style={tw`flex-row items-center gap-2`}>
                <TouchableOpacity
                  onPress={() => {
                    if (detailCCAccount) {
                      setIsDetailModalOpen(false);
                      handleOpenEditCC(detailCCAccount);
                    }
                  }}
                  style={tw`p-1.5 bg-blue-50 rounded-lg`}
                >
                  <Edit3 size={15} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (detailCCAccount) handleDeleteCCAccount(detailCCAccount.id);
                  }}
                  style={tw`p-1.5 bg-red-50 rounded-lg`}
                >
                  <Trash2 size={15} color="#DC2626" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsDetailModalOpen(false)} style={styles.modalCloseBtn}>
                  <X size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {detailCCAccount && (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={tw`p-4 gap-3.5`}>
                {/* Account Summary Banner */}
                <View style={styles.passbookHero}>
                  <View style={tw`flex-row justify-between mb-2`}>
                    <View>
                      <Text style={tw`text-[11px] text-amber-200`}>मंजूर मर्यादा (Limit)</Text>
                      <Text style={tw`text-[16px] font-extrabold text-white`}>
                        {formatCurrency(detailCCAccount.sanctionLimit)}
                      </Text>
                    </View>
                    <View style={tw`items-end`}>
                      <Text style={tw`text-[11px] text-amber-200`}>वार्षिक व्याज</Text>
                      <Text style={tw`text-[14px] font-extrabold text-amber-300`}>
                        {detailCCAccount.interestRate || 9.5}% p.a.
                      </Text>
                    </View>
                  </View>

                  <View style={tw`flex-row gap-2 pt-2 border-t border-amber-900/50`}>
                    <View style={tw`flex-1 bg-red-950/40 p-2 rounded-lg`}>
                      <Text style={tw`text-[10px] text-red-300`}>वापरलेली उचल</Text>
                      <Text style={tw`text-[13px] font-bold text-red-400`}>
                        {formatCurrency(detailCCAccount.currentOutstanding)}
                      </Text>
                    </View>
                    <View style={tw`flex-1 bg-green-950/40 p-2 rounded-lg`}>
                      <Text style={tw`text-[10px] text-green-300`}>शिल्लक मर्यादा</Text>
                      <Text style={tw`text-[13px] font-bold text-green-400`}>
                        {formatCurrency(Math.max(0, detailCCAccount.sanctionLimit - detailCCAccount.currentOutstanding))}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Quick Transaction Action Buttons in Passbook */}
                <View style={tw`flex-row gap-2`}>
                  <TouchableOpacity
                    style={tw`flex-1 flex-row items-center justify-center gap-1.5 bg-red-50 border border-red-200 py-2.5 rounded-xl`}
                    onPress={() => handleOpenTransaction(detailCCAccount, 'withdraw')}
                    activeOpacity={0.8}
                  >
                    <ArrowUpRight size={15} color="#DC2626" />
                    <Text style={tw`text-[12.5px] font-bold text-red-600`}>+ उचल नोंद</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={tw`flex-1 flex-row items-center justify-center gap-1.5 bg-green-50 border border-green-200 py-2.5 rounded-xl`}
                    onPress={() => handleOpenTransaction(detailCCAccount, 'deposit')}
                    activeOpacity={0.8}
                  >
                    <ArrowDownLeft size={15} color="#16A34A" />
                    <Text style={tw`text-[12.5px] font-bold text-green-700`}>+ जमा नोंद</Text>
                  </TouchableOpacity>
                </View>

                {/* Statement Passbook Table */}
                <View style={tw`mt-1`}>
                  <Text style={tw`text-[13.5px] font-extrabold text-gray-800 mb-2`}>
                    व्यवहार नोंदी (Statement History)
                  </Text>

                  {(!detailCCAccount.transactions || detailCCAccount.transactions.length === 0) ? (
                    <View style={tw`p-6 items-center justify-center bg-gray-50 rounded-xl border border-gray-200`}>
                      <FileText size={32} color="#9CA3AF" />
                      <Text style={tw`text-xs text-gray-500 font-semibold mt-2`}>अजून कोणतीही नोंद नाही</Text>
                    </View>
                  ) : (
                    <View style={styles.passbookTable}>
                      {detailCCAccount.transactions.map((tx, idx) => {
                        const isWithdraw = tx.type === 'withdraw';
                        const isInterest = tx.type === 'interest';
                        return (
                          <View key={tx.id || idx} style={styles.passbookRow}>
                            <View style={tw`flex-1 pr-2`}>
                              <View style={tw`flex-row items-center gap-1.5`}>
                                <View
                                  style={[
                                    styles.txTypeBadge,
                                    isWithdraw
                                      ? { backgroundColor: '#FEE2E2', borderColor: '#FECDD3' }
                                      : isInterest
                                      ? { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }
                                      : { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.txTypeBadgeText,
                                      isWithdraw
                                        ? { color: '#DC2626' }
                                        : isInterest
                                        ? { color: '#D97706' }
                                        : { color: '#16A34A' },
                                    ]}
                                  >
                                    {isWithdraw ? 'उचल' : isInterest ? 'व्याज' : 'जमा'}
                                  </Text>
                                </View>
                                <Text style={styles.txDateText}>{tx.date}</Text>
                              </View>

                              {tx.description ? (
                                <Text style={styles.txDescText} numberOfLines={1}>
                                  {tx.description}
                                </Text>
                              ) : null}
                            </View>

                            <View style={tw`items-end`}>
                              <Text
                                style={[
                                  styles.txAmountText,
                                  isWithdraw || isInterest ? { color: '#DC2626' } : { color: '#16A34A' },
                                ]}
                              >
                                {isWithdraw || isInterest ? '-' : '+'} {Number(tx.amount).toLocaleString('en-IN')}
                              </Text>
                              {tx.balanceAfter !== undefined ? (
                                <Text style={styles.txBalText}>
                                  शिल्लक उचल: ₹{Number(tx.balanceAfter).toLocaleString('en-IN')}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  /* Top Segmented Control */
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#6B121C',
  },
  segmentBtnActiveCC: {
    backgroundColor: '#78350F',
  },
  segmentText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  segmentBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  segmentBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  segmentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B5563',
  },
  segmentBadgeTextActive: {
    color: '#FFFFFF',
  },

  /* Hero Card */
  heroCard: {
    backgroundColor: '#38070D',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#541018',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  heroIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  activeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* CC Hero Card */
  ccHeroCard: {
    backgroundColor: '#451A03',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#78350F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ccHeroIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ccActiveBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ccActiveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FEF3C7',
  },

  /* Stat Boxes in Hero */
  statBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  statBoxLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 3,
  },
  statBoxAmount: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  /* Progress in Hero */
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FDE68A',
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },

  /* Reminder Banner */
  reminderBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
  },
  reminderTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#92400E',
  },
  upcomingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
  },
  upcomingLoanName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1F2937',
  },
  upcomingDueText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 1,
  },
  upcomingAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  payNowActionText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: 1,
  },

  /* Tabs */
  tabsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.white,
  },

  /* Empty State */
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  addLoanCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  addLoanCtaText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.white,
  },

  /* Loan Card */
  loanCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  loanCardName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  loanCardLender: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textTertiary,
    marginTop: 2,
  },
  loanStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  loanStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  loanFinancialsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
  },
  loanFinCol: {
    flex: 1,
    alignItems: 'center',
  },
  loanFinLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: 2,
  },
  loanFinValue: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  loanProgressTrack: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  loanProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  loanCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
    marginTop: 4,
  },
  nextEmiLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  nextEmiValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 1,
  },
  viewDetailText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.primary,
  },

  /* CC Card Specifics */
  ccCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ccCardBankName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  ccCardSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  ccMachineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ccMachineBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350F',
  },
  ccStatusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  ccStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  ccFinancialsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  ccFinCol: {
    flex: 1,
    alignItems: 'center',
  },
  ccFinLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  ccFinValue: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#1F2937',
  },
  ccActionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    marginTop: 4,
  },
  ccActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  ccWithdrawBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  ccWithdrawBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  ccDepositBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  ccDepositBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#16A34A',
  },
  ccStatementBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  ccStatementBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2563EB',
  },

  /* FAB */
  fabButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#6B121C',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    color: colors.white,
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: 380,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  modalCloseBtn: {
    padding: 4,
  },
  formGroup: {
    gap: 4,
  },
  formLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
  },
  reqStar: {
    color: '#DC2626',
  },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#1F2937',
  },
  machineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  machineChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  machineChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  machineChipTextActive: {
    color: '#78350F',
    fontWeight: '800',
  },
  modalPrimarySaveBtn: {
    backgroundColor: '#78350F',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalPrimarySaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Transaction Type Segmented */
  txTypeSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  txTypeSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  txTypeSegmentText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  txTypeWithdrawActive: {
    backgroundColor: '#DC2626',
  },
  txTypeDepositActive: {
    backgroundColor: '#16A34A',
  },
  txTypeInterestActive: {
    backgroundColor: '#D97706',
  },
  payMethodPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
  },
  payMethodPillActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  payMethodText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  payMethodTextActive: {
    color: '#78350F',
    fontWeight: '800',
  },

  /* Passbook Hero */
  passbookHero: {
    backgroundColor: '#451A03',
    borderRadius: 14,
    padding: 14,
  },
  passbookTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  passbookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  txTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  txTypeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  txDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  txDescText: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
  },
  txAmountText: {
    fontSize: 13,
    fontWeight: '800',
  },
  txBalText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 1,
  },
});

export default LoanListScreen;
