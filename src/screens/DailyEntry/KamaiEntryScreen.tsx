import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import tw from 'twrnc';
import { AppDatePicker } from '../../components/AppDatePicker';
import { getTodayFormatted } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';
import { DailyLedgerService, MachineEntryService } from '../../utils/api';
import { colors } from '../../theme';
import {
  FileText,
  IndianRupee,
  Calendar as CalendarIcon,
  StickyNote,
  CheckCircle,
  ArrowLeft,
  CreditCard,
  Truck,
  TrendingUp,
  X,
  Trash2,
} from 'lucide-react-native';

interface KamaiEntryScreenProps {
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

export const KamaiEntryScreen: React.FC<KamaiEntryScreenProps> = ({ onBack }) => {
  const [date, setDate] = useState<string>(getTodayFormatted());
  const [kamaiDescription, setKamaiDescription] = useState('');
  const [kamaiAmount, setKamaiAmount] = useState('');
  const [kamaiPaymentType, setKamaiPaymentType] = useState<'cash' | 'online' | 'credit'>('cash');
  const [kamaiNotes, setKamaiNotes] = useState('');
  const [kamaiSaving, setKamaiSaving] = useState(false);
  const [kamaiSavedMsg, setKamaiSavedMsg] = useState('');

  const [summary, setSummary] = useState({ earnings: 0 });
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [showDetails, setShowDetails] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [earningsList, setEarningsList] = useState<EarningDetailItem[]>([]);

  const getIsoDate = (dStr: string) => {
    const parts = dStr.split('/');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : new Date().toISOString().split('T')[0];
  };

  const fetchDaySummary = async () => {
    setSummaryLoading(true);
    try {
      const isoDate = getIsoDate(date);
      const [machineRes, ledgerRes] = await Promise.all([
        MachineEntryService.getAll({ date: isoDate }),
        DailyLedgerService.getAll({ date: isoDate }),
      ]);

      const rawMachines = Array.isArray(machineRes) ? machineRes : Array.isArray(machineRes?.data) ? machineRes.data : [];
      const rawLedger = Array.isArray(ledgerRes) ? ledgerRes : Array.isArray(ledgerRes?.data) ? ledgerRes.data : [];

      const machineEarnings = rawMachines.reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);
      const ledgerEarnings = rawLedger
        .filter((it: any) => it.type === 'earnings' || it.type === 'income')
        .reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);

      setSummary({ earnings: machineEarnings + ledgerEarnings });
    } catch {
      setSummary({ earnings: 0 });
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

      const rawMachines = Array.isArray(machineRes) ? machineRes : Array.isArray(machineRes?.data) ? machineRes.data : [];
      const rawLedger = Array.isArray(ledgerRes) ? ledgerRes : Array.isArray(ledgerRes?.data) ? ledgerRes.data : [];

      const eItems: EarningDetailItem[] = [];
      rawMachines.forEach((m: any) => {
        const hoursVal = m.hoursOrTrips ?? m.hours_or_trips;
        const unitVal = m.hoursUnit || m.hours_unit;
        const hoursInfo = hoursVal ? `${hoursVal} ${unitVal === 'trips' ? 'फेऱ्या' : 'तास'}` : '';
        eItems.push({
          id: m.id,
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
            id: l.id,
            source: 'ledger',
            title: l.description || 'जमा नोंद',
            subtitle: l.notes,
            amount: Number(l.amount) || 0,
            paymentType: l.paymentType || l.payment_type || 'cash',
          });
        });
      setEarningsList(eItems);
    } catch {
      setEarningsList([]);
    } finally {
      setModalLoading(false);
    }
  };

  // Edit State
  const [editItemModalOpen, setEditItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EarningDetailItem | null>(null);
  const [editItemTitle, setEditItemTitle] = useState('');
  const [editItemAmount, setEditItemAmount] = useState('');
  const [editItemPayType, setEditItemPayType] = useState<'cash' | 'online' | 'credit'>('cash');
  const [editItemNotes, setEditItemNotes] = useState('');
  const [editItemSaving, setEditItemSaving] = useState(false);

  const handleOpenEditItem = (item: EarningDetailItem) => {
    setEditingItem(item);
    setEditItemTitle(item.title);
    setEditItemAmount(String(item.amount));
    setEditItemPayType((item.paymentType as any) || 'cash');
    setEditItemNotes(item.subtitle || '');
    setEditItemModalOpen(true);
  };

  const handleSaveEditItem = async () => {
    if (!editingItem) return;
    const numAmt = parseFloat(editItemAmount.replace(/,/g, '')) || 0;
    if (numAmt <= 0) {
      Alert.alert('त्रुटी', 'कृपया योग्य रक्कम टाका.');
      return;
    }
    if (!editItemTitle.trim()) {
      Alert.alert('त्रुटी', 'कृपया वर्णन टाका.');
      return;
    }

    setEditItemSaving(true);
    try {
      if (editingItem.source === 'machine') {
        await MachineEntryService.update(editingItem.id, {
          work_description: editItemTitle.trim(),
          amount: numAmt,
          payment_type: editItemPayType,
        });
      } else {
        await DailyLedgerService.update(editingItem.id, {
          description: editItemTitle.trim(),
          amount: numAmt,
          payment_type: editItemPayType,
          notes: editItemNotes.trim() || undefined,
        });
      }

      setEditItemModalOpen(false);
      setEditingItem(null);
      await loadDetailEntries();
      await fetchDaySummary();
    } catch (err: any) {
      Alert.alert('त्रुटी', err?.message || 'नोंद अपडेट करताना समस्या आली.');
    } finally {
      setEditItemSaving(false);
    }
  };

  const handleDeleteItem = (item: EarningDetailItem) => {
    Alert.alert('कमाई नोंद हटवा', 'तुम्हाला खरोखर ही कमाई नोंद हटवायची आहे का?', [
      { text: 'नाही', style: 'cancel' },
      {
        text: 'होय, हटवा',
        style: 'destructive',
        onPress: async () => {
          try {
            if (item.source === 'machine') {
              await MachineEntryService.delete(item.id);
            } else {
              await DailyLedgerService.delete(item.id);
            }
            await loadDetailEntries();
            await fetchDaySummary();
          } catch {
            Alert.alert('त्रुटी', 'नोंद हटवताना समस्या आली.');
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchDaySummary();
  }, [date]);

  const handleSaveKamai = async () => {
    const numAmount = parseFloat(kamaiAmount.replace(/,/g, '')) || 0;
    if (numAmount <= 0) {
      Alert.alert('त्रुटी', 'कृपया योग्य रक्कम टाका');
      return;
    }
    if (!kamaiDescription.trim()) {
      Alert.alert('त्रुटी', 'कृपया वर्णन किंवा कामाचे नाव टाका');
      return;
    }

    setKamaiSaving(true);
    try {
      await DailyLedgerService.create({
        entry_date: getIsoDate(date),
        type: 'earnings',
        description: kamaiDescription.trim(),
        amount: numAmount,
        payment_type: kamaiPaymentType,
        notes: kamaiNotes.trim() || undefined,
      });

      setKamaiSavedMsg('कमाई नोंद यशस्वीरित्या सेव्ह झाली!');
      setKamaiDescription('');
      setKamaiAmount('');
      setKamaiNotes('');
      setKamaiPaymentType('cash');
      await fetchDaySummary();
      setTimeout(() => setKamaiSavedMsg(''), 3000);
    } catch {
      Alert.alert('त्रुटी', 'नोंद सेव्ह करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setKamaiSaving(false);
    }
  };

  const earningsSum = earningsList.reduce((acc, it) => acc + it.amount, 0);
  const machineEarningsSum = earningsList.filter((it) => it.source === 'machine').reduce((acc, it) => acc + it.amount, 0);
  const ledgerEarningsSum = earningsList.filter((it) => it.source === 'ledger').reduce((acc, it) => acc + it.amount, 0);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>कमाई नोंद (आवक)</Text>
        <TouchableOpacity
          style={styles.saveHeaderBtn}
          onPress={handleSaveKamai}
          disabled={kamaiSaving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveHeaderBtnText}>{kamaiSaving ? '...' : 'जतन करा'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {kamaiSavedMsg ? (
          <View style={styles.successBanner}>
            <CheckCircle size={16} color="#15803D" />
            <Text style={styles.successText}>{kamaiSavedMsg}</Text>
          </View>
        ) : null}

        {/* तारीख */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <CalendarIcon size={18} color="#78350F" />
            <Text style={styles.labelText}>दिनांक <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <View style={styles.dateInputWrapper}>
            <AppDatePicker label="" value={date} onChange={setDate} />
          </View>
        </View>

        {/* वर्णन / कामाचे नाव */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <FileText size={18} color="#78350F" />
            <Text style={styles.labelText}>वर्णन / काम <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={kamaiDescription}
            onChangeText={setKamaiDescription}
            placeholder="उदा. इतर भाडे / थेट काम जमा"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* रक्कम */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <IndianRupee size={18} color="#78350F" />
            <Text style={styles.labelText}>रक्कम (₹) <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={kamaiAmount}
            onChangeText={setKamaiAmount}
            placeholder="उदा. 5000"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>

        {/* पेमेंट प्रकार */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <CreditCard size={18} color="#78350F" />
            <Text style={styles.labelText}>पेमेंट प्रकार <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioItem}
              onPress={() => setKamaiPaymentType('cash')}
              activeOpacity={0.7}
            >
              <View style={[styles.outerRadio, kamaiPaymentType === 'cash' && styles.outerRadioActive]}>
                {kamaiPaymentType === 'cash' && <View style={styles.innerRadioDot} />}
              </View>
              <Text style={styles.radioText}>रोख</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioItem}
              onPress={() => setKamaiPaymentType('online')}
              activeOpacity={0.7}
            >
              <View style={[styles.outerRadio, kamaiPaymentType === 'online' && styles.outerRadioActive]}>
                {kamaiPaymentType === 'online' && <View style={styles.innerRadioDot} />}
              </View>
              <Text style={styles.radioText}>ऑनलाइन</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioItem}
              onPress={() => setKamaiPaymentType('credit')}
              activeOpacity={0.7}
            >
              <View style={[styles.outerRadio, kamaiPaymentType === 'credit' && styles.outerRadioActive]}>
                {kamaiPaymentType === 'credit' && <View style={styles.innerRadioDot} />}
              </View>
              <Text style={styles.radioText}>उधारी</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* नोंद */}
        <View style={styles.notesRow}>
          <View style={styles.labelContainerNotes}>
            <StickyNote size={18} color="#78350F" />
            <Text style={styles.labelText}>नोंद</Text>
          </View>
          <TextInput
            style={styles.notesArea}
            value={kamaiNotes}
            onChangeText={setKamaiNotes}
            placeholder="काही नोंद असल्यास लिहा..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Bottom Save Button */}
        <View style={styles.bottomBtnWrapper}>
          <TouchableOpacity
            style={styles.bottomSaveBtn}
            onPress={handleSaveKamai}
            disabled={kamaiSaving}
            activeOpacity={0.8}
          >
            <Text style={styles.bottomSaveBtnText}>
              {kamaiSaving ? 'जतन होत आहे...' : 'कमाई नोंद जतन करा'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryTitle}>आजचा कमाई सारांश</Text>
            <Text style={styles.summaryDate}>{date}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setShowDetails(true);
              loadDetailEntries();
            }}
            style={styles.summaryCard}
          >
            <View style={tw`flex flex-row items-center justify-between`}>
              <View style={tw`flex flex-row items-center gap-3`}>
                <View style={styles.summaryIconCircle}>
                  <TrendingUp size={20} color="#15803D" />
                </View>
                <View>
                  <Text style={styles.summaryCardLabel}>एकूण कमाई (आजची)</Text>
                  <Text style={styles.summaryCardAmount}>
                    {formatCurrency(summary.earnings)}
                  </Text>
                </View>
              </View>
              <Text style={styles.summaryViewDetails}>तपशील पहा ›</Text>
            </View>
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
                  <TrendingUp size={20} color="#15803D" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>कमाई तपशील</Text>
                  <Text style={styles.modalSubtitle}>तारीख: {date}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowDetails(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {modalLoading ? (
              <View style={tw`py-14 items-center justify-center`}>
                <ActivityIndicator size="large" color="#6B121C" />
                <Text style={tw`text-xs text-gray-500 mt-2 font-medium`}>तपशील लोड होत आहे...</Text>
              </View>
            ) : (
              <>
                <View style={styles.heroBanner}>
                  <View style={tw`flex flex-row justify-between items-center`}>
                    <View>
                      <Text style={styles.heroBannerLabel}>एकूण कमाई</Text>
                      <Text style={styles.heroBannerAmount}>{formatCurrency(summary.earnings)}</Text>
                    </View>
                    <View style={tw`items-end`}>
                      <Text style={tw`text-[11px] text-green-700 font-bold`}>मशीन: {formatCurrency(machineEarningsSum)}</Text>
                      <Text style={tw`text-[11px] text-green-700 font-bold mt-0.5`}>इतर: {formatCurrency(ledgerEarningsSum)}</Text>
                    </View>
                  </View>
                </View>

                <Text style={tw`text-xs font-bold text-gray-700 px-1 pt-1`}>
                  कमाई नोंदी ({earningsList.length}):
                </Text>

                <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={true}>
                  {earningsList.length === 0 ? (
                    <View style={tw`py-10 items-center justify-center`}>
                      <Text style={tw`text-xs font-semibold text-gray-400`}>
                        आजसाठी कोणतीही कमाई नोंद उपलब्ध नाही.
                      </Text>
                    </View>
                  ) : (
                    earningsList.map((item, idx) => (
                      <View key={item.id || idx} style={styles.itemCard}>
                        <View style={tw`flex flex-row justify-between items-start`}>
                          <View style={tw`flex-1 pr-2`}>
                            <View style={tw`flex flex-row items-center gap-1.5`}>
                              {item.source === 'machine' ? (
                                <Truck size={14} color="#6B121C" />
                              ) : (
                                <TrendingUp size={14} color="#15803D" />
                              )}
                              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                            </View>
                            {item.subtitle ? (
                              <Text style={styles.itemSub} numberOfLines={1}>{item.subtitle}</Text>
                            ) : null}
                            <View style={tw`flex flex-row items-center gap-2 mt-2`}>
                              {item.hoursOrTrips ? (
                                <View style={styles.hoursBadge}>
                                  <Text style={styles.hoursBadgeText}>{item.hoursOrTrips}</Text>
                                </View>
                              ) : null}
                              <View style={styles.payBadge}>
                                <Text style={styles.payBadgeText}>
                                  {item.paymentType === 'online' ? 'Online' : item.paymentType === 'credit' ? 'उधारी' : 'रोख'}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <View style={tw`items-end gap-2`}>
                            <Text style={styles.amountGreen}>+{formatCurrency(item.amount)}</Text>
                            <View style={tw`flex flex-row items-center gap-1.5`}>
                              <TouchableOpacity
                                onPress={() => handleOpenEditItem(item)}
                                style={tw`p-1.5 rounded-lg bg-blue-50 border border-blue-200`}
                                activeOpacity={0.7}
                              >
                                <FileText size={13} color="#2563EB" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleDeleteItem(item)}
                                style={tw`p-1.5 rounded-lg bg-red-50 border border-red-200`}
                                activeOpacity={0.7}
                              >
                                <Trash2 size={13} color="#DC2626" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>

                <View style={styles.tallyFooter}>
                  <Text style={tw`text-xs font-bold text-gray-700`}>एकूण कमाई बेरीज:</Text>
                  <Text style={tw`text-sm font-extrabold text-green-700`}>{formatCurrency(earningsSum)}</Text>
                </View>
              </>
            )}

            <TouchableOpacity
              onPress={() => setShowDetails(false)}
              style={styles.modalCloseButton}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseButtonText}>बंद करा (Close)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Single Earning Item Modal */}
      <Modal
        visible={editItemModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditItemModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={tw`flex flex-row items-center justify-between pb-3 border-b border-gray-100`}>
              <Text style={tw`text-base font-extrabold text-gray-900`}>कमाई नोंद संपादन</Text>
              <TouchableOpacity onPress={() => setEditItemModalOpen(false)} style={tw`p-1`}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={tw`py-3 gap-3`} showsVerticalScrollIndicator={false}>
              <View style={tw`gap-1`}>
                <Text style={tw`text-xs font-bold text-gray-700`}>कमाईचे नाव / वर्णन *</Text>
                <TextInput
                  style={styles.textInputBox}
                  value={editItemTitle}
                  onChangeText={setEditItemTitle}
                  placeholder="उदा. पोकलेन काम / थेट कमाई"
                />
              </View>

              <View style={tw`gap-1`}>
                <Text style={tw`text-xs font-bold text-gray-700`}>रक्कम (₹) *</Text>
                <TextInput
                  style={styles.textInputBox}
                  value={editItemAmount}
                  onChangeText={setEditItemAmount}
                  placeholder="उदा. 5000"
                  keyboardType="numeric"
                />
              </View>

              <View style={tw`gap-1`}>
                <Text style={tw`text-xs font-bold text-gray-700`}>नोंद / टिप</Text>
                <TextInput
                  style={[styles.textInputBox, { minHeight: 60, textAlignVertical: 'top' }]}
                  value={editItemNotes}
                  onChangeText={setEditItemNotes}
                  placeholder="उदा. बँक खात्यात जमा..."
                  multiline
                />
              </View>

              <TouchableOpacity
                style={[styles.bottomSaveBtn, { marginTop: 6 }]}
                onPress={handleSaveEditItem}
                disabled={editItemSaving}
                activeOpacity={0.8}
              >
                <Text style={styles.bottomSaveBtnText}>
                  {editItemSaving ? 'अपडेट होत आहे...' : 'बदल जतन करा'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#6B121C',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    flex: 1,
    marginLeft: 12,
  },
  saveHeaderBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  saveHeaderBtnText: {
    color: '#1C1917',
    fontSize: 14,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  successBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '42%',
  },
  labelContainerNotes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '24%',
    marginTop: 8,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
  },
  requiredStar: {
    color: '#DC2626',
    fontWeight: '800',
  },
  textInputBox: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1F2937',
  },
  dateInputWrapper: {
    flex: 1,
  },
  radioGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  outerRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRadioActive: {
    borderColor: '#2563EB',
  },
  innerRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  radioText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1F2937',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
  },
  notesArea: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1F2937',
    minHeight: 80,
  },
  bottomBtnWrapper: {
    marginTop: 6,
  },
  bottomSaveBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  bottomSaveBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  // Summary Section
  summaryContainer: {
    marginTop: 10,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  summaryCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
  },
  summaryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  summaryCardAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#15803D',
    marginTop: 2,
  },
  summaryViewDetails: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
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
    borderBottomColor: '#F3F4F6',
  },
  modalIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  modalSubtitle: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  modalCloseBtn: { padding: 6, borderRadius: 20, backgroundColor: '#F3F4F6' },
  modalScrollBody: { maxHeight: 320 },
  heroBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
  },
  heroBannerLabel: { fontSize: 11, fontWeight: '700', color: '#15803D', marginBottom: 2 },
  heroBannerAmount: { fontSize: 22, fontWeight: '900', color: '#16A34A' },
  itemCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemTitle: { fontSize: 13, fontWeight: '800', color: '#1F2937' },
  itemSub: { fontSize: 11, fontWeight: '500', color: '#4B5563', marginTop: 2 },
  hoursBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  hoursBadgeText: { fontSize: 9, fontWeight: '700', color: '#1D4ED8' },
  payBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  payBadgeText: { fontSize: 9, fontWeight: '700', color: '#6B7280' },
  amountGreen: { fontSize: 14, fontWeight: '900', color: '#16A34A' },
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
    backgroundColor: '#6B121C',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCloseButtonText: { fontSize: 14, fontWeight: '800', color: 'white' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
});

export default KamaiEntryScreen;
