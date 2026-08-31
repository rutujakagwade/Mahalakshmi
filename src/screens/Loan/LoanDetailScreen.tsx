import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import tw from 'twrnc';
import { AppHeader } from '../../components/AppHeader';
import { AppCard } from '../../components/AppCard';
import { AppInput } from '../../components/AppInput';
import { AppDropdown } from '../../components/AppDropdown';
import { AppButton } from '../../components/AppButton';
import { AppDatePicker } from '../../components/AppDatePicker';
import { formatCurrency } from '../../utils/currency';
import { getTodayFormatted } from '../../utils/date';
import { colors } from '../../theme';
import { LoanService } from '../../utils/api';
import { Loan, LoanInstallment } from '../../types/loan';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  X,
  CreditCard,
  Pencil,
} from 'lucide-react-native';

interface LoanDetailScreenProps {
  loanId: string;
  onBack: () => void;
  onNavigateToEdit: (loanId: string) => void;
}

export const LoanDetailScreen: React.FC<LoanDetailScreenProps> = ({ loanId, onBack, onNavigateToEdit }) => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Pay Installment Modal State
  const [selectedInstallment, setSelectedInstallment] = useState<LoanInstallment | null>(null);
  const [payModalVisible, setPayModalVisible] = useState<boolean>(false);
  const [paidDate, setPaidDate] = useState<string>(getTodayFormatted());
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('online');
  const [payNotes, setPayNotes] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);

  const getIsoDate = (dStr: string) => {
    if (!dStr) return new Date().toISOString().split('T')[0];
    const parts = dStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dStr;
  };

  const loadLoan = useCallback(async () => {
    try {
      const res = await LoanService.getById(loanId);
      const loanData = res?.data || res;
      setLoan(loanData);
    } catch {
      Alert.alert('त्रुटी', 'कर्ज तपशील लोड करताना समस्या आली.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loanId]);

  useEffect(() => {
    loadLoan();
  }, [loadLoan]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLoan();
  };

  const openPayModal = (installment: LoanInstallment) => {
    setSelectedInstallment(installment);
    setPaidDate(getTodayFormatted());
    setPaidAmount(String(installment.amount));
    setPaymentMethod('online');
    setPayNotes('');
    setPayModalVisible(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedInstallment || !loan) return;
    const numPaidAmt = parseFloat(paidAmount.replace(/,/g, '')) || selectedInstallment.amount;

    setSubmittingPayment(true);
    try {
      await LoanService.payInstallment(loan.id, selectedInstallment.id, {
        paid_date: getIsoDate(paidDate),
        paid_amount: numPaidAmt,
        payment_method: paymentMethod,
        notes: payNotes.trim() || undefined,
      });

      setPayModalVisible(false);
      await loadLoan();
      Alert.alert('यशस्वी', `हप्ता #${selectedInstallment.installmentNumber} यशस्वीरित्या भरला म्हणून नोंदवला गेला!`);
    } catch (err: any) {
      Alert.alert('त्रुटी', err?.message || 'हप्ता नोंदवताना समस्या आली.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleUnpayInstallment = (installment: LoanInstallment) => {
    Alert.alert(
      'हप्ता पूर्ववत करा',
      `तुम्हाला हप्ता #${installment.installmentNumber} पुन्हा 'शिल्लक (Pending)' करायचा आहे का?`,
      [
        { text: 'रद्द करा', style: 'cancel' },
        {
          text: 'होय, पूर्ववत करा',
          style: 'destructive',
          onPress: async () => {
            if (!loan) return;
            try {
              await LoanService.unpayInstallment(loan.id, installment.id);
              await loadLoan();
            } catch {
              Alert.alert('त्रुटी', 'हप्ता पूर्ववत करताना समस्या आली.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteLoan = () => {
    Alert.alert(
      'कर्ज हटवा (Delete Loan)',
      'तुम्हाला हे कर्ज आणि सर्व हप्त्यांचे वेळापत्रक कायमचे हटवायचे आहे का?',
      [
        { text: 'रद्द करा', style: 'cancel' },
        {
          text: 'होय, हटवा',
          style: 'destructive',
          onPress: async () => {
            if (!loan) return;
            try {
              await LoanService.delete(loan.id);
              Alert.alert('यशस्वी', 'कर्ज यशस्वीरित्या हटवले गेले.', [
                { text: 'ठीक आहे', onPress: onBack },
              ]);
            } catch {
              Alert.alert('त्रुटी', 'कर्ज हटवताना समस्या आली.');
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', label: 'कर्ज पूर्ण (Completed)', icon: CheckCircle2 };
      case 'overdue':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FECDD3', label: 'थकीत हप्ता (Overdue)', icon: AlertCircle };
      case 'payment_due':
        return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', label: 'हप्ता देय (Due Soon)', icon: Clock };
      default:
        return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', label: 'चालू कर्ज (Active)', icon: CreditCard };
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={tw`flex-1 bg-[${colors.background}]`}>
        <AppHeader title="कर्ज तपशील" showBack={true} onBackPress={onBack} />
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={tw`text-xs text-[${colors.textTertiary}] mt-2 font-medium`}>
            कर्ज तपशील लोड होत आहे...
          </Text>
        </View>
      </View>
    );
  }

  if (!loan) {
    return (
      <View style={tw`flex-1 bg-[${colors.background}]`}>
        <AppHeader title="कर्ज तपशील" showBack={true} onBackPress={onBack} />
        <View style={tw`flex-1 items-center justify-center p-6`}>
          <Text style={tw`text-base font-bold text-gray-700 mb-2`}>कर्ज सापडले नाही</Text>
          <AppButton title="मागे जा" onPress={onBack} variant="primary" />
        </View>
      </View>
    );
  }

  const badge = getStatusBadge(loan.status);
  const BadgeIcon = badge.icon;
  const progress = loan.progressPercentage || 0;

  return (
    <View style={tw`flex-1 bg-[${colors.background}]`}>
      <AppHeader
        title={loan.name}
        showBack={true}
        onBackPress={onBack}
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
        {/* Loan Overview Hero Card */}
        <AppCard variant="elevated" style={styles.heroCard}>
          <View style={tw`flex flex-row justify-between items-start mb-2`}>
            <View style={tw`flex-1 pr-2`}>
              <Text style={styles.heroName}>{loan.name}</Text>
              <Text style={styles.heroLender}>
                🏦 {loan.lenderName}
                {loan.accountNumber ? ` • खा. क्र: ${loan.accountNumber}` : ''}
              </Text>
              {loan.loanType ? (
                <Text style={tw`text-[11px] text-[${colors.textTertiary}] mt-0.5`}>
                  प्रकार: {loan.loanType}
                </Text>
              ) : null}
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: badge.bg, borderColor: badge.border },
              ]}
            >
              <BadgeIcon size={12} color={badge.text} />
              <Text style={[styles.statusText, { color: badge.text }]}>
                {badge.label}
              </Text>
            </View>
          </View>

          {/* 3 Main Amount Cards */}
          <View style={styles.amountsGrid}>
            <View style={styles.amountCol}>
              <Text style={styles.amountLabel}>एकूण कर्ज</Text>
              <Text style={styles.amountValue}>
                {formatCurrency(loan.totalAmount)}
              </Text>
            </View>

            <View style={styles.amountCol}>
              <Text style={[styles.amountLabel, { color: colors.earnings }]}>भरलेली रक्कम</Text>
              <Text style={[styles.amountValue, { color: colors.earnings }]}>
                {formatCurrency(loan.paidAmount)}
              </Text>
            </View>

            <View style={styles.amountCol}>
              <Text style={[styles.amountLabel, { color: colors.expense }]}>बाकी रक्कम</Text>
              <Text style={[styles.amountValue, { color: colors.expense }]}>
                {formatCurrency(loan.remainingAmount)}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={tw`my-3`}>
            <View style={tw`flex flex-row justify-between items-center mb-1`}>
              <Text style={styles.progressSub}>
                हप्ते प्रगती: {loan.paidInstallmentsCount} / {loan.totalInstallments} भरले
              </Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: progress === 100 ? '#10B981' : colors.primary,
                  },
                ]}
              />
            </View>
          </View>

          {/* Key Facts Strip */}
          <View style={styles.factsStrip}>
            <View style={styles.factItem}>
              <Text style={styles.factLabel}>हप्ता रक्कम (EMI)</Text>
              <Text style={styles.factValue}>{formatCurrency(loan.emiAmount)}/महिना</Text>
            </View>
            {loan.interestRate ? (
              <View style={styles.factItem}>
                <Text style={styles.factLabel}>व्याजदर</Text>
                <Text style={styles.factValue}>{loan.interestRate}% वार्षिक</Text>
              </View>
            ) : null}
            <View style={styles.factItem}>
              <Text style={styles.factLabel}>सुरुवात तारीख</Text>
              <Text style={styles.factValue}>{loan.startDate || '—'}</Text>
            </View>
          </View>
        </AppCard>

        {/* Edit / Delete Action Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => onNavigateToEdit(loanId)}
            activeOpacity={0.8}
          >
            <Pencil size={15} color={colors.primary} />
            <Text style={styles.editBtnText}>कर्ज संपादन करा (Edit)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDeleteLoan}
            activeOpacity={0.8}
          >
            <Trash2 size={15} color="#DC2626" />
            <Text style={styles.deleteBtnText}>कर्ज हटवा (Delete)</Text>
          </TouchableOpacity>
        </View>

        {/* Installment Schedule Section Header */}
        <View style={tw`flex flex-row justify-between items-center px-1`}>
          <Text style={styles.sectionHeaderTitle}>हप्त्यांचे वेळापत्रक (Installment Schedule)</Text>
          <Text style={styles.sectionHeaderCount}>
            एकूण {loan.totalInstallments} हप्ते
          </Text>
        </View>

        {/* Installments Table List */}
        <View style={tw`gap-2`}>
          {!loan.installments || loan.installments.length === 0 ? (
            <View style={styles.emptyInstBox}>
              <Text style={tw`text-xs text-gray-500`}>कोणतेही हप्ते उपलब्ध नाहीत.</Text>
            </View>
          ) : (
            loan.installments.map((item) => {
              const isPaid = item.status === 'paid';
              const isOverdue = item.status === 'overdue';

              return (
                <View
                  key={item.id}
                  style={[
                    styles.instCard,
                    isPaid && styles.instCardPaid,
                    isOverdue && styles.instCardOverdue,
                  ]}
                >
                  <View style={tw`flex flex-row justify-between items-center`}>
                    {/* Left: Number & Due Date */}
                    <View style={tw`flex flex-row items-center gap-3 flex-1`}>
                      <View
                        style={[
                          styles.instNumBadge,
                          isPaid && { backgroundColor: '#DCFCE7' },
                          isOverdue && { backgroundColor: '#FEE2E2' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.instNumText,
                            isPaid && { color: '#166534' },
                            isOverdue && { color: '#991B1B' },
                          ]}
                        >
                          #{item.installmentNumber}
                        </Text>
                      </View>

                      <View style={tw`flex-1`}>
                        <Text style={styles.instDueDate}>
                          दिनांक: {item.dueDate}
                        </Text>
                        {isPaid ? (
                          <Text style={styles.instPaidInfo}>
                            ✓ भरला: {item.paidDate || 'नोंद झाली'}
                            {item.paymentMethod ? ` (${item.paymentMethod})` : ''}
                          </Text>
                        ) : isOverdue ? (
                          <Text style={styles.instOverdueText}>
                            🔴 हप्ता थकीत (Overdue)
                          </Text>
                        ) : (
                          <Text style={styles.instPendingText}>
                            ⏳ भरण्यासाठी बाकी (Pending)
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Right: Amount & Action */}
                    <View style={tw`items-end gap-1.5`}>
                      <Text style={[styles.instAmount, isPaid && { color: '#15803D' }]}>
                        {formatCurrency(item.amount)}
                      </Text>

                      {isPaid ? (
                        <TouchableOpacity
                          onPress={() => handleUnpayInstallment(item)}
                          style={styles.paidBadgeBtn}
                          activeOpacity={0.7}
                        >
                          <CheckCircle2 size={12} color="#15803D" />
                          <Text style={styles.paidBadgeBtnText}>भरला (Paid)</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() => openPayModal(item)}
                          style={styles.payActionBtn}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.payActionBtnText}>हप्ता भरा ✓</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Pay Installment Modal */}
      <Modal
        visible={payModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={tw`flex flex-row items-center gap-2`}>
                <View style={styles.modalIconBox}>
                  <CreditCard size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    हप्ता #{selectedInstallment?.installmentNumber} भरा
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    देय तारीख: {selectedInstallment?.dueDate}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setPayModalVisible(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={tw`max-h-96 gap-3`}>
              <AppInput
                label="भरलेली रक्कम (₹)"
                value={paidAmount}
                onChangeText={setPaidAmount}
                keyboardType="numeric"
                required
              />

              <AppDatePicker
                label="हप्ता भरल्याची तारीख"
                value={paidDate}
                onChange={setPaidDate}
              />

              <AppDropdown
                label="पेमेंट पद्धत"
                value={paymentMethod}
                onChangeText={setPaymentMethod}
                options={[
                  { label: 'ऑनलाइन (GPay/PhonePe/UPI)', value: 'online' },
                  { label: 'बँक ट्रान्सफर (NEFT/RTGS/Auto-Debit)', value: 'bank_transfer' },
                  { label: 'रोख (Cash)', value: 'cash' },
                  { label: 'चेक (Cheque)', value: 'cheque' },
                ]}
              />

              <AppInput
                label="टीप / व्यवहार क्रमांक (पर्यायी)"
                value={payNotes}
                onChangeText={setPayNotes}
                placeholder="उदा. UTR: 893821893 किंवा रोख पावती"
              />
            </ScrollView>

            {/* Modal Actions */}
            <View style={tw`pt-3 border-t border-gray-100 flex flex-row gap-2`}>
              <View style={tw`flex-1`}>
                <AppButton
                  title="रद्द करा"
                  variant="outline"
                  onPress={() => setPayModalVisible(false)}
                />
              </View>
              <View style={tw`flex-1`}>
                <AppButton
                  title={submittingPayment ? 'नोंद होत आहे...' : 'हप्ता भरला ✓'}
                  variant="primary"
                  onPress={handleConfirmPayment}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    padding: 16,
    borderRadius: 18,
  },
  heroName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  heroLender: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  amountsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  amountCol: {
    flex: 1,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 13.5,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  progressSub: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.primary,
  },
  progressTrack: {
    height: 7,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  factsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
    marginTop: 6,
  },
  factItem: {
    alignItems: 'center',
  },
  factLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  factValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 1,
  },

  /* Section Title */
  sectionHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionHeaderCount: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
  },

  /* Installment Cards */
  emptyInstBox: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  instCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  instCardPaid: {
    backgroundColor: '#F9FCF9',
    borderColor: '#DCFCE7',
  },
  instCardOverdue: {
    backgroundColor: '#FEFBFB',
    borderColor: '#FECDD3',
  },
  instNumBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instNumText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  instDueDate: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  instPaidInfo: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 1,
  },
  instOverdueText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 1,
  },
  instPendingText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textTertiary,
    marginTop: 1,
  },
  instAmount: {
    fontSize: 13.5,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  payActionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  payActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },
  paidBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  paidBadgeBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803D',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Edit / Delete Action Row */
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.primarySurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
});

export default LoanDetailScreen;
