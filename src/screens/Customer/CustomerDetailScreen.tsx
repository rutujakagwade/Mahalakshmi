import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { AppModal } from '../../components/AppModal';
import { AppInput } from '../../components/AppInput';
import { AppDatePicker } from '../../components/AppDatePicker';
import { AppButton } from '../../components/AppButton';
import { Customer, CustomerLedgerData, CustomerPaymentItem, CustomerWorkHistoryItem } from '../../types/customer';
import { CustomerService } from '../../utils/api';
import { colors, radii, shadows } from '../../theme';
import {
  MapPin,
  Phone,
  PlusCircle,
  Briefcase,
  CreditCard,
  Trash2,
  Calendar,
  Clock,
  DollarSign,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Share2,
} from 'lucide-react-native';
import { sendCustomerUdharOnWhatsApp, sendWorkBalanceOnWhatsApp } from '../../utils/whatsapp';

interface CustomerDetailScreenProps {
  customer: Customer;
  onBack: () => void;
}

export const CustomerDetailScreen: React.FC<CustomerDetailScreenProps> = ({ customer, onBack }) => {
  const [activeTab, setActiveTab] = useState<'work' | 'payments'>('work');
  const [ledgerData, setLedgerData] = useState<CustomerLedgerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState<'cash' | 'online'>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);

  // Expected Payment Date Modal State
  const [isExpectedDateModalOpen, setIsExpectedDateModalOpen] = useState<boolean>(false);
  const [expectedDateInput, setExpectedDateInput] = useState<string>('');
  const [submittingExpectedDate, setSubmittingExpectedDate] = useState<boolean>(false);


  // ── Date format helpers ──────────────────────────────────────────────────
  // API / state uses YYYY-MM-DD; AppDatePicker uses DD/MM/YYYY
  const isoToDisplay = (iso: string): string => {
    if (!iso || !iso.includes('-')) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };
  const displayToIso = (display: string): string => {
    if (!display || !display.includes('/')) return '';
    const [d, m, y] = display.split('/');
    return `${y}-${m}-${d}`;
  };
  // ─────────────────────────────────────────────────────────────────────────

  const fetchLedger = useCallback(async () => {
    try {
      setLoading(true);
      const res = await CustomerService.getLedger(customer.id);
      if (res) {
        setLedgerData(res);
      }
    } catch (err: any) {
      console.warn('Failed to fetch customer ledger:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [customer.id]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleCall = () => {
    if (customer.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    } else {
      Alert.alert('माहिती', 'मोबाईल नंबर उपलब्ध नाही');
    }
  };

  const handleOpenPaymentModal = () => {
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentType('cash');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async () => {
    const numAmount = parseFloat(paymentAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('त्रुटी', 'कृपया वैध रक्कम टाका');
      return;
    }

    try {
      setSubmittingPayment(true);
      await CustomerService.addPayment(customer.id, {
        payment_date: paymentDate,
        amount: numAmount,
        payment_type: paymentType,
        notes: paymentNotes,
      });

      Alert.alert('यशस्वी', 'रक्कम जमा करण्यात आली आहे');
      setIsPaymentModalOpen(false);
      fetchLedger();
    } catch (err: any) {
      Alert.alert('त्रुटी', err?.message || 'रक्कम जमा करताना त्रुटी आली');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDeletePayment = (paymentId: string) => {
    Alert.alert(
      'नोंद हटवा',
      'तुम्हाला नक्की ही जमा केलेली रक्कम हटवायची आहे का?',
      [
        { text: 'नाही', style: 'cancel' },
        {
          text: 'होय, हटवा',
          style: 'destructive',
          onPress: async () => {
            try {
              await CustomerService.deletePayment(paymentId);
              fetchLedger();
            } catch (err: any) {
              Alert.alert('त्रुटी', err?.message || 'हटवताना त्रुटी आली');
            }
          },
        },
      ]
    );
  };

  const currentCustomer = ledgerData?.customer || customer;

  const handleOpenExpectedDateModal = () => {
    setExpectedDateInput(currentCustomer.expectedPaymentDate || new Date().toISOString().split('T')[0]);
    setIsExpectedDateModalOpen(true);
  };

  const handleSaveExpectedDate = async (clear: boolean = false) => {
    const targetDate = clear ? null : expectedDateInput;
    try {
      setSubmittingExpectedDate(true);
      await CustomerService.updateExpectedPaymentDate(customer.id, targetDate);
      Alert.alert('यशस्वी', clear ? 'देय तारीख हटवण्यात आली' : 'देय तारीख अद्ययावत करण्यात आली');
      setIsExpectedDateModalOpen(false);
      fetchLedger();
    } catch (err: any) {
      Alert.alert('त्रुटी', err?.message || 'तारीख अपडेट करताना त्रुटी आली');
    } finally {
      setSubmittingExpectedDate(false);
    }
  };

  const workHistory = ledgerData?.workHistory || [];
  const paymentHistory = ledgerData?.paymentHistory || [];

  const totalWork = currentCustomer.totalWork ?? 0;
  const totalPaid = currentCustomer.totalPaid ?? 0;
  const udhariBalance = currentCustomer.udhariBalance ?? Math.max(0, totalWork - totalPaid);

  return (
    <View style={styles.screen}>
      <AppHeader
        title={customer.name}
        showBack={true}
        onBackPress={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Customer Header Info */}
        <View style={styles.customerHeaderCard}>
          <View style={styles.customerInfoRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {customer.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{customer.name}</Text>
              {customer.location ? (
                <View style={styles.infoSubRow}>
                  <MapPin size={13} color={colors.textMuted} />
                  <Text style={styles.infoSubText}>{customer.location}</Text>
                </View>
              ) : null}
              {customer.phone ? (
                <TouchableOpacity style={styles.infoSubRow} onPress={handleCall}>
                  <Phone size={13} color={colors.primary} />
                  <Text style={[styles.infoSubText, { color: colors.primary, fontWeight: '600' }]}>
                    {customer.phone}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Action Buttons: Add Payment & WhatsApp */}
          <View style={styles.headerActionRow}>
            <TouchableOpacity
              style={styles.addPaymentBtn}
              onPress={handleOpenPaymentModal}
              activeOpacity={0.8}
            >
              <PlusCircle size={17} color={colors.white} />
              <Text style={styles.addPaymentBtnText}>रक्कम जमा (+)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsAppHeaderBtn}
              onPress={() => sendCustomerUdharOnWhatsApp({
                customerName: currentCustomer.name,
                phone: currentCustomer.phone,
                location: currentCustomer.location,
                totalWork,
                totalPaid,
                udhariBalance,
                expectedPaymentDate: currentCustomer.expectedPaymentDate,
              })}
              activeOpacity={0.8}
            >
              <Share2 size={16} color={colors.white} />
              <Text style={styles.whatsAppHeaderBtnText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Udhar Financial Overview Cards */}
        <View style={styles.summaryGrid}>
          {/* Total Work */}
          <View style={[styles.summaryCard, { borderLeftColor: colors.primary }]}>
            <Text style={styles.summaryLabel}>एकूण काम</Text>
            <Text style={styles.summaryValue}>₹{totalWork.toLocaleString('en-IN')}</Text>
          </View>

          {/* Total Received */}
          <View style={[styles.summaryCard, { borderLeftColor: '#059669' }]}>
            <Text style={styles.summaryLabel}>जमा रक्कम</Text>
            <Text style={[styles.summaryValue, { color: '#059669' }]}>
              ₹{totalPaid.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Remaining Udhar */}
          <View style={[styles.summaryCard, { borderLeftColor: udhariBalance > 0 ? '#DC2626' : '#059669' }]}>
            <Text style={styles.summaryLabel}>बाकी उधारी</Text>
            <Text style={[styles.summaryValue, { color: udhariBalance > 0 ? '#DC2626' : '#059669' }]}>
              ₹{udhariBalance.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Promised Payment Date Banner (Only visible when Udhar balance > 0) */}
        {udhariBalance > 0 ? (
          <>
            <View style={styles.promisedDateCard}>
              <View style={styles.promisedDateLeft}>
                <Calendar size={18} color={colors.primary} />
                <View style={styles.promisedDateInfo}>
                  <Text style={styles.promisedDateLabel}>पेमेंट देण्याची आपक्षित तारीख (Promised Date):</Text>
                  <Text style={styles.promisedDateValue}>
                    {currentCustomer.expectedPaymentDate
                      ? currentCustomer.expectedPaymentDate
                      : 'तारीख ठरलेली नाही'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.setPromisedDateBtn}
                onPress={handleOpenExpectedDateModal}
                activeOpacity={0.8}
              >
                <Text style={styles.setPromisedDateBtnText}>
                  {currentCustomer.expectedPaymentDate ? 'तारीख बदला' : '+ तारीख ठेवा'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Prominent WhatsApp Reminder Banner */}
            <TouchableOpacity
              style={styles.whatsAppReminderBanner}
              onPress={() => sendCustomerUdharOnWhatsApp({
                customerName: currentCustomer.name,
                phone: currentCustomer.phone,
                location: currentCustomer.location,
                totalWork,
                totalPaid,
                udhariBalance,
                expectedPaymentDate: currentCustomer.expectedPaymentDate,
              })}
              activeOpacity={0.85}
            >
              <View style={styles.whatsAppIconCircle}>
                <Share2 size={16} color="#16A34A" />
              </View>
              <View style={styles.whatsAppBannerTextCol}>
                <Text style={styles.whatsAppBannerTitle}>WhatsApp वर उधारी हिशोब पाठवा</Text>
                <Text style={styles.whatsAppBannerSub}>ग्राहकाला थेट WhatsApp वर एकूण काम, जमा व बाकी रकमेचा मेसेज पाठवा</Text>
              </View>
            </TouchableOpacity>
          </>
        ) : null}



        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'work' && styles.tabBtnActive]}
            onPress={() => setActiveTab('work')}
          >
            <Briefcase size={16} color={activeTab === 'work' ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabBtnText, activeTab === 'work' && styles.tabBtnTextActive]}>
              कामाचा इतिहास ({workHistory.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'payments' && styles.tabBtnActive]}
            onPress={() => setActiveTab('payments')}
          >
            <CreditCard size={16} color={activeTab === 'payments' ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabBtnText, activeTab === 'payments' && styles.tabBtnTextActive]}>
              जमा रक्कम ({paymentHistory.length})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>माहिती लोड होत आहे...</Text>
          </View>
        ) : activeTab === 'work' ? (
          /* WORK HISTORY TAB */
          <View style={styles.listContainer}>
            {workHistory.length > 0 ? (
              workHistory.map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.machineTag}>
                      <Text style={styles.machineName}>{item.machineName}</Text>
                    </View>
                    <Text style={styles.amountText}>₹{item.amount.toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.rowItem}>
                      <Calendar size={13} color={colors.textMuted} />
                      <Text style={styles.rowText}>
                        {item.toDate ? `${item.entryDate} ते ${item.toDate}` : item.entryDate}
                      </Text>
                    </View>

                    <View style={styles.rowItem}>
                      <Clock size={13} color={colors.textMuted} />
                      <Text style={styles.rowText}>
                        {item.hoursOrTrips} {item.hoursUnit === 'hours' ? 'तास' : 'फेऱ्या'}
                      </Text>
                    </View>

                    {item.workDescription ? (
                      <Text style={styles.descText}>काम: {item.workDescription}</Text>
                    ) : null}

                    {item.location ? (
                      <View style={styles.rowItem}>
                        <MapPin size={13} color={colors.textMuted} />
                        <Text style={styles.rowText}>{item.location}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.cardFooter}>
                    <View
                      style={[
                        styles.paymentTypeBadge,
                        item.paymentType === 'credit'
                          ? styles.badgeCredit
                          : item.paymentType === 'cash'
                          ? styles.badgeCash
                          : styles.badgeOnline,
                      ]}
                    >
                      <Text style={styles.paymentTypeText}>
                        {item.paymentType === 'credit'
                          ? 'उधारी (Credit)'
                          : item.paymentType === 'cash'
                          ? 'रोख (Cash)'
                          : 'ऑनलाईन'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Briefcase size={36} color={colors.textMuted} />
                <Text style={styles.emptyText}>कोणतीही काम नोंद उपलब्ध नाही</Text>
              </View>
            )}
          </View>
        ) : (
          /* PAYMENT HISTORY TAB */
          <View style={styles.listContainer}>
            {paymentHistory.length > 0 ? (
              paymentHistory.map((p) => (
                <View key={p.id} style={styles.historyCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.rowItem}>
                      <Calendar size={14} color={colors.primary} />
                      <Text style={[styles.rowText, { fontWeight: '700', color: colors.textPrimary }]}>
                        {p.paymentDate}
                      </Text>
                    </View>
                    <Text style={[styles.amountText, { color: '#059669' }]}>
                      + ₹{p.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.cardFooter}>
                      <View
                        style={[
                          styles.paymentTypeBadge,
                          p.paymentType === 'cash' ? styles.badgeCash : styles.badgeOnline,
                        ]}
                      >
                        <Text style={styles.paymentTypeText}>
                          {p.paymentType === 'cash' ? '💵 रोख जमा (Cash)' : '💳 ऑनलाईन जमा'}
                        </Text>
                      </View>

                      {!p.isMachineEntry ? (
                        <TouchableOpacity
                          onPress={() => handleDeletePayment(p.id)}
                          style={styles.deleteBtn}
                        >
                          <Trash2 size={14} color={colors.error} />
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {p.notes ? (
                      <Text style={styles.descText}>{p.notes}</Text>
                    ) : null}

                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <CreditCard size={36} color={colors.textMuted} />
                <Text style={styles.emptyText}>कोणतीही जमा नोंद उपलब्ध नाही</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Record Payment Modal */}
      <AppModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="रक्कम जमा करा"
      >
        <View style={styles.modalContent}>
          <AppDatePicker
            label="जमा तारीख (Payment Date)"
            value={isoToDisplay(paymentDate)}
            onChange={(display) => setPaymentDate(displayToIso(display))}
          />

          <AppInput
            label="रक्कम (₹)"
            value={paymentAmount}
            onChangeText={setPaymentAmount}
            placeholder="उदा. 5000"
            keyboardType="numeric"
            required
          />

          <View style={styles.typeSelectorGroup}>
            <Text style={styles.fieldLabel}>जमा प्रकार (Payment Type)</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeOptionBtn, paymentType === 'cash' && styles.typeOptionBtnActive]}
                onPress={() => setPaymentType('cash')}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    paymentType === 'cash' && styles.typeOptionTextActive,
                  ]}
                >
                  💵 रोख (Cash)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeOptionBtn, paymentType === 'online' && styles.typeOptionBtnActive]}
                onPress={() => setPaymentType('online')}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    paymentType === 'online' && styles.typeOptionTextActive,
                  ]}
                >
                  💳 ऑनलाईन (Online)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <AppInput
            label="टीप / तपशील (Optional)"
            value={paymentNotes}
            onChangeText={setPaymentNotes}
            placeholder="उदा. Google Pay द्वारे किंवा रोख प्राप्त"
          />

          <View style={styles.modalBtn}>
            <AppButton
              title={submittingPayment ? 'जमा होत आहे...' : 'जमा करा'}
              onPress={handleSavePayment}
              disabled={submittingPayment}
              variant="primary"
            />
          </View>
        </View>
      </AppModal>

      {/* Set Promised Payment Date Modal */}
      <AppModal
        isOpen={isExpectedDateModalOpen}
        onClose={() => setIsExpectedDateModalOpen(false)}
        title="देय तारीख नक्की करा"
      >
        <View style={styles.modalContent}>
          <AppDatePicker
            label="पेमेंट देण्याची आपक्षित तारीख (Expected Date)"
            value={isoToDisplay(expectedDateInput)}
            onChange={(display) => setExpectedDateInput(displayToIso(display))}
          />

          <View style={styles.modalBtnRow}>
            <AppButton
              title={submittingExpectedDate ? 'सेव्ह होत आहे...' : 'सेव्ह करा'}
              onPress={() => handleSaveExpectedDate(false)}
              disabled={submittingExpectedDate}
              variant="primary"
            />

            {currentCustomer.expectedPaymentDate ? (
              <TouchableOpacity
                style={styles.clearDateBtn}
                onPress={() => handleSaveExpectedDate(true)}
                disabled={submittingExpectedDate}
              >
                <Text style={styles.clearDateBtnText}>तारीख हटवा</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </AppModal>
    </View>
  );
};


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  customerHeaderCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
    ...shadows.sm,
  },
  customerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  customerDetails: {
    flex: 1,
    gap: 3,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoSubText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addPaymentBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addPaymentBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  whatsAppHeaderBtn: {
    backgroundColor: '#16A34A',
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  whatsAppHeaderBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  whatsAppReminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: radii.lg,
    padding: 12,
    gap: 12,
    ...shadows.xs,
  },
  whatsAppIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsAppBannerTextCol: {
    flex: 1,
  },
  whatsAppBannerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#15803D',
  },
  whatsAppBannerSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#166534',
    marginTop: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    ...shadows.xs,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radii.lg,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radii.md,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: colors.white,
    ...shadows.xs,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  listContainer: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    ...shadows.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  machineTag: {
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  machineName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  cardBody: {
    gap: 6,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  descText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  paymentTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  badgeCredit: {
    backgroundColor: '#FEE2E2',
  },
  badgeCash: {
    backgroundColor: '#D1FAE5',
  },
  badgeOnline: {
    backgroundColor: '#DBEAFE',
  },
  paymentTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: radii.sm,
    backgroundColor: colors.errorBg,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  modalContent: {
    gap: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  typeSelectorGroup: {
    gap: 4,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surfaceTertiary,
  },
  typeOptionBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  typeOptionText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  typeOptionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalBtn: {
    paddingTop: 8,
  },
  promisedDateCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    ...shadows.xs,
  },
  promisedDateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  promisedDateInfo: {
    flex: 1,
    gap: 2,
  },
  promisedDateLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  promisedDateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  setPromisedDateBtn: {
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  setPromisedDateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  modalBtnRow: {
    gap: 10,
    paddingTop: 8,
  },
  clearDateBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.errorBg,
  },
  clearDateBtnText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 13,
  },
});


export default CustomerDetailScreen;
