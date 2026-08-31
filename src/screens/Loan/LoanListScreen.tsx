import React, { useEffect, useState, useCallback } from 'react';
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
import { AppCard } from '../../components/AppCard';
import { formatCurrency } from '../../utils/currency';
import { colors } from '../../theme';
import { LoanService } from '../../utils/api';
import { Loan, LoanDashboardSummary } from '../../types/loan';
import {
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  ChevronRight,
  Sparkles,
  TrendingDown,
} from 'lucide-react-native';

interface LoanListScreenProps {
  onBack: () => void;
  onNavigateToAddLoan: () => void;
  onNavigateToLoanDetail: (loanId: string) => void;
}

type FilterTab = 'all' | 'active' | 'due' | 'completed';

export const LoanListScreen: React.FC<LoanListScreenProps> = ({
  onBack,
  onNavigateToAddLoan,
  onNavigateToLoanDetail,
}) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanDashboardSummary | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const [loansRes, summaryRes] = await Promise.all([
        LoanService.getAll(),
        LoanService.getDashboardSummary(),
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

  // Filter loans based on tab
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
        onRightActionPress={onNavigateToAddLoan}
      />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`p-4 pb-20 gap-4`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Overall Dashboard Summary Hero */}
        <View style={styles.heroCard}>
          <View style={tw`flex flex-row justify-between items-center mb-3`}>
            <View style={tw`flex flex-row items-center gap-2`}>
              <View style={styles.heroIconBox}>
                <CreditCard size={20} color={colors.gold} />
              </View>
              <Text style={styles.heroTitle}>कर्ज सारांश (Overview)</Text>
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
            <CreditCard size={42} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>कोणतेही कर्ज सापडले नाही</Text>
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

                  {/* Financial Stats Grid */}
                  <View style={styles.loanFinancialsGrid}>
                    <View style={styles.loanFinCol}>
                      <Text style={styles.loanFinLabel}>एकूण कर्ज</Text>
                      <Text style={styles.loanFinValue}>
                        {formatCurrency(loan.totalAmount)}
                      </Text>
                    </View>

                    <View style={styles.loanFinCol}>
                      <Text style={styles.loanFinLabel}>भरलेली रक्कम</Text>
                      <Text style={[styles.loanFinValue, { color: colors.earnings }]}>
                        {formatCurrency(loan.paidAmount)}
                      </Text>
                    </View>

                    <View style={styles.loanFinCol}>
                      <Text style={styles.loanFinLabel}>बाकी रक्कम</Text>
                      <Text style={[styles.loanFinValue, { color: colors.expense }]}>
                        {formatCurrency(loan.remainingAmount)}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={tw`my-2.5`}>
                    <View style={tw`flex flex-row justify-between items-center mb-1`}>
                      <Text style={tw`text-[11px] font-semibold text-[${colors.textTertiary}]`}>
                        हप्ते: {loan.paidInstallmentsCount} / {loan.totalInstallments} भरले
                      </Text>
                      <Text style={tw`text-[11px] font-extrabold text-[${colors.primary}]`}>
                        {progress}%
                      </Text>
                    </View>
                    <View style={styles.loanProgressTrack}>
                      <View
                        style={[
                          styles.loanProgressFill,
                          {
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: progress === 100 ? '#10B981' : colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Bottom Strip: Next EMI info & Detail Link */}
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
      </ScrollView>

      {/* Floating Add Loan CTA */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={onNavigateToAddLoan}
        activeOpacity={0.85}
      >
        <Plus size={20} color={colors.white} />
        <Text style={styles.fabText}>+ नवीन Loan जोडा</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 16,
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
    color: '#FEF3C7',
  },
  statBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E7E5E4',
    marginBottom: 3,
  },
  statBoxAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D6D3D1',
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.gold || '#D4AF37',
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.gold || '#D4AF37',
    borderRadius: 4,
  },

  /* Reminder Banner */
  reminderBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
  },
  reminderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  upcomingItemRow: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upcomingLoanName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  upcomingDueText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  upcomingAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#B45309',
  },
  payNowActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 1,
  },

  /* Tabs */
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: '900',
  },

  /* Empty state */
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  addLoanCta: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addLoanCtaText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },

  /* Loan Card */
  loanCard: {
    padding: 14,
    borderRadius: 16,
  },
  loanCardName: {
    fontSize: 15,
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
    fontSize: 12.5,
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
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 1,
  },
  viewDetailText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.primary,
  },

  /* FAB */
  fabButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});

export default LoanListScreen;
