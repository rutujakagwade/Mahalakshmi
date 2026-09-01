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
  const [filterType, setFilterType] = useState<'all' | 'machine' | 'ledger'>('all');

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
    loadDetailEntries();
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
      await loadDetailEntries();
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

        {/* ─── आजचा कमाई सारांश ─────────────────────────────── */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeaderRow}>
            <View style={tw`flex flex-row items-center gap-2`}>
              <TrendingUp size={15} color="#15803D" />
              <Text style={styles.summaryTitle}>आजचा कमाई सारांश</Text>
            </View>
            <Text style={styles.summaryDate}>{date}</Text>
          </View>

          {/* Summary Stats Row - Interactive Filter Pills */}
          <View style={tw`flex flex-row gap-2 mb-3`}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFilterType('all')}
              style={[
                styles.statPill,
                { backgroundColor: '#F0FDF4', borderColor: filterType === 'all' ? '#16A34A' : '#BBF7D0', borderWidth: filterType === 'all' ? 2 : 1 },
              ]}
            >
              <Text style={[styles.statPillLabel, { color: '#15803D', fontWeight: filterType === 'all' ? '900' : '700' }]}>
                {filterType === 'all' ? '● एकूण कमाई' : 'एकूण कमाई'}
              </Text>
              <Text style={[styles.statPillValue, { color: '#16A34A' }]}>{formatCurrency(summary.earnings)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFilterType('machine')}
              style={[
                styles.statPill,
                { backgroundColor: '#EFF6FF', borderColor: filterType === 'machine' ? '#2563EB' : '#BFDBFE', borderWidth: filterType === 'machine' ? 2 : 1 },
              ]}
            >
              <Text style={[styles.statPillLabel, { color: '#1D4ED8', fontWeight: filterType === 'machine' ? '900' : '700' }]}>
                {filterType === 'machine' ? '● मशीन' : 'मशीन'}
              </Text>
              <Text style={[styles.statPillValue, { color: '#1D4ED8' }]}>{formatCurrency(machineEarningsSum)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFilterType('ledger')}
              style={[
                styles.statPill,
                { backgroundColor: '#FFF7ED', borderColor: filterType === 'ledger' ? '#EA580C' : '#FED7AA', borderWidth: filterType === 'ledger' ? 2 : 1 },
              ]}
            >
              <Text style={[styles.statPillLabel, { color: '#C2410C', fontWeight: filterType === 'ledger' ? '900' : '700' }]}>
                {filterType === 'ledger' ? '● इतर' : 'इतर'}
              </Text>
              <Text style={[styles.statPillValue, { color: '#C2410C' }]}>{formatCurrency(ledgerEarningsSum)}</Text>
            </TouchableOpacity>
          </View>

          {/* Filtered Entries Table */}
          {(() => {
            const filteredEarnings = earningsList.filter((item) => {
              if (filterType === 'machine') return item.source === 'machine';
              if (filterType === 'ledger') return item.source === 'ledger';
              return true;
            });
            const filteredSum = filteredEarnings.reduce((acc, it) => acc + it.amount, 0);
            const activeLabel = filterType === 'machine' ? 'मशीन कमाई' : filterType === 'ledger' ? 'इतर कमाई' : 'एकूण कमाई';

            if (summaryLoading) {
              return (
                <View style={tw`py-6 items-center justify-center`}>
                  <ActivityIndicator size="small" color="#16A34A" />
                  <Text style={tw`text-xs text-gray-400 mt-1.5 font-medium`}>नोंदी लोड होत आहेत...</Text>
                </View>
              );
            }

            if (filteredEarnings.length === 0) {
              return (
                <View style={tw`py-8 items-center justify-center bg-white rounded-xl border border-gray-100`}>
                  <TrendingUp size={28} color="#D1D5DB" />
                  <Text style={tw`text-xs font-semibold text-gray-400 mt-2`}>
                    {date} साठी {activeLabel} नोंद नाही
                  </Text>
                </View>
              );
            }

            return (
              <View style={styles.tableCard}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { flex: 0.3, textAlign: 'center' }]}>#</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>वर्णन / काम</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'center' }]}>प्रकार</Text>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={[styles.tableHeaderCell, { textAlign: 'right', paddingRight: 15 }]}>रक्कम</Text>
                  </View>
                  <Text style={[styles.tableHeaderCell, { flex: 0.7, textAlign: 'center' }]}>क्रिया</Text>
                </View>

                {/* Table Rows */}
                {filteredEarnings.map((item, idx) => (
                  <View
                    key={`${item.source}-${item.id ?? idx}`}
                    style={[
                      styles.tableRow,
                      idx % 2 === 0 ? { backgroundColor: '#F9FAFB' } : { backgroundColor: 'white' },
                    ]}
                  >
                    {/* Sr No */}
                    <Text style={[styles.tableCellSr, { flex: 0.3 }]}>{idx + 1}</Text>

                    {/* Description */}
                    <View style={{ flex: 1.8 }}>
                      <View style={tw`flex flex-row items-center gap-1`}>
                        {item.source === 'machine' ? (
                          <Truck size={10} color="#6B121C" />
                        ) : (
                          <TrendingUp size={10} color="#15803D" />
                        )}
                        <Text style={styles.tableCellMain} numberOfLines={1}>{item.title}</Text>
                      </View>
                      {item.subtitle ? (
                        <Text style={styles.tableCellSub} numberOfLines={1}>{item.subtitle}</Text>
                      ) : null}
                      {item.hoursOrTrips ? (
                        <Text style={styles.tableCellSub}>{item.hoursOrTrips}</Text>
                      ) : null}
                    </View>

                    {/* Payment Type */}
                    <View style={{ flex: 0.8, alignItems: 'center' }}>
                      <View style={[
                        styles.payChip,
                        item.paymentType === 'online'
                          ? { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }
                          : item.paymentType === 'credit'
                            ? { backgroundColor: '#FEF2F2', borderColor: '#FECDD3' }
                            : { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
                      ]}>
                        <Text style={[
                          styles.payChipText,
                          item.paymentType === 'online'
                            ? { color: '#1D4ED8' }
                            : item.paymentType === 'credit'
                              ? { color: '#DC2626' }
                              : { color: '#15803D' },
                        ]}>
                          {item.paymentType === 'online' ? 'Online' : item.paymentType === 'credit' ? 'उधार' : 'रोख'}
                        </Text>
                      </View>
                    </View>

                    {/* Amount */}
                    <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: 15 }}>
                      <Text style={styles.tableCellAmount}>
                        +{formatCurrency(item.amount)}
                      </Text>
                    </View>

                    {/* Actions */}
                    <View style={{ flex: 0.7, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                      <TouchableOpacity
                        onPress={() => handleOpenEditItem(item)}
                        style={styles.actionBtn}
                        activeOpacity={0.7}
                      >
                        <FileText size={12} color="#2563EB" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteItem(item)}
                        style={[styles.actionBtn, { backgroundColor: '#FEF2F2', borderColor: '#FECDD3' }]}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={12} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Table Footer - Total */}
                <View style={styles.tableFooter}>
                  <Text style={[styles.tableFooterLabel, { flex: 2.8 }]}>
                    {activeLabel} ({filteredEarnings.length} नोंदी)
                  </Text>
                  <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: 4 }}>
                    <Text style={styles.tableFooterAmount}>
                      +{formatCurrency(filteredSum)}
                    </Text>
                  </View>
                  <View style={{ flex: 0.7 }} />
                </View>
              </View>
            );
          })()}
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

      {/* ══════════════════════════════════════
          EDIT SINGLE EARNING ITEM MODAL
      ══════════════════════════════════════ */}
      <Modal
        visible={editItemModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditItemModalOpen(false)}
      >
        <View style={styles.editModalBackdrop}>
          <View style={styles.editModalCard}>
            {/* Modal Header */}
            <View style={styles.editModalHeader}>
              <View style={tw`flex flex-row items-center gap-2.5`}>
                <View style={styles.editModalIconBadge}>
                  <FileText size={18} color="#16A34A" />
                </View>
                <View>
                  <Text style={styles.editModalTitle}>कमाई नोंद संपादन</Text>
                  <Text style={styles.editModalSubtitle}>
                    {editingItem?.source === 'machine' ? 'मशीन कामाची नोंद' : 'इतर जमा नोंद'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setEditItemModalOpen(false)}
                style={styles.editModalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalBody} showsVerticalScrollIndicator={false}>
              {/* Field 1: वर्णन / काम */}
              <View style={styles.editFieldGroup}>
                <View style={styles.editFieldLabelRow}>
                  <FileText size={14} color="#78350F" />
                  <Text style={styles.editFieldLabel}>
                    वर्णन / कामाचे नाव <Text style={styles.requiredStar}>*</Text>
                  </Text>
                </View>
                <TextInput
                  style={styles.editTextInput}
                  value={editItemTitle}
                  onChangeText={setEditItemTitle}
                  placeholder="उदा. पोकलेन काम / थेट कमाई"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Field 2: रक्कम */}
              <View style={styles.editFieldGroup}>
                <View style={styles.editFieldLabelRow}>
                  <IndianRupee size={14} color="#78350F" />
                  <Text style={styles.editFieldLabel}>
                    रक्कम (₹) <Text style={styles.requiredStar}>*</Text>
                  </Text>
                </View>
                <TextInput
                  style={[styles.editTextInput, styles.editAmountInput]}
                  value={editItemAmount}
                  onChangeText={setEditItemAmount}
                  placeholder="उदा. 5000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* Field 3: पेमेंट प्रकार */}
              <View style={styles.editFieldGroup}>
                <View style={styles.editFieldLabelRow}>
                  <CreditCard size={14} color="#78350F" />
                  <Text style={styles.editFieldLabel}>पेमेंट प्रकार</Text>
                </View>
                <View style={styles.editPayTypeRow}>
                  <TouchableOpacity
                    style={[
                      styles.editPayTypePill,
                      editItemPayType === 'cash' && styles.editPayTypePillActiveCash,
                    ]}
                    onPress={() => setEditItemPayType('cash')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.editPayTypeText,
                        editItemPayType === 'cash' && styles.editPayTypeTextActiveCash,
                      ]}
                    >
                      {editItemPayType === 'cash' ? '● रोख (Cash)' : 'रोख (Cash)'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.editPayTypePill,
                      editItemPayType === 'online' && styles.editPayTypePillActiveOnline,
                    ]}
                    onPress={() => setEditItemPayType('online')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.editPayTypeText,
                        editItemPayType === 'online' && styles.editPayTypeTextActiveOnline,
                      ]}
                    >
                      {editItemPayType === 'online' ? '● ऑनलाइन' : 'ऑनलाइन'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.editPayTypePill,
                      editItemPayType === 'credit' && styles.editPayTypePillActiveCredit,
                    ]}
                    onPress={() => setEditItemPayType('credit')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.editPayTypeText,
                        editItemPayType === 'credit' && styles.editPayTypeTextActiveCredit,
                      ]}
                    >
                      {editItemPayType === 'credit' ? '● उधारी' : 'उधारी'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Field 4: नोंद / टिप */}
              <View style={styles.editFieldGroup}>
                <View style={styles.editFieldLabelRow}>
                  <StickyNote size={14} color="#78350F" />
                  <Text style={styles.editFieldLabel}>नोंद / टिप</Text>
                </View>
                <TextInput
                  style={[styles.editTextInput, styles.editNotesInput]}
                  value={editItemNotes}
                  onChangeText={setEditItemNotes}
                  placeholder="काही नोंद असल्यास लिहा..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.editActionRow}>
                <TouchableOpacity
                  style={styles.editCancelBtn}
                  onPress={() => setEditItemModalOpen(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editCancelBtnText}>रद्द करा</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.editSaveBtn}
                  onPress={handleSaveEditItem}
                  disabled={editItemSaving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.editSaveBtnText}>
                    {editItemSaving ? 'अपडेट होत आहे...' : 'बदल जतन करा'}
                  </Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#15803D',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCloseButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Summary Stats Pills
  statPill: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2,
  },
  statPillValue: {
    fontSize: 12,
    fontWeight: '900',
  },
  // Table Styles
  tableCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: '800',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCellSr: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  tableCellMain: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  tableCellSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 1,
  },
  tableCellAmount: {
    fontSize: 12,
    fontWeight: '900',
    color: '#16A34A',
    textAlign: 'right',
  },
  payChip: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
  },
  payChipText: {
    fontSize: 8,
    fontWeight: '800',
  },
  actionBtn: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1.5,
    borderTopColor: '#BBF7D0',
  },
  tableFooterLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  tableFooterAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#16A34A',
  },

  // ── Edit Modal Styles ──
  editModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  editModalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  editModalIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  editModalSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 1,
  },
  editModalCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  editModalBody: {
    paddingVertical: 12,
  },
  editFieldGroup: {
    marginBottom: 12,
    gap: 5,
  },
  editFieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  editTextInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#111827',
  },
  editAmountInput: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803D',
  },
  editNotesInput: {
    minHeight: 54,
    fontSize: 12.5,
  },
  editPayTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  editPayTypePill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPayTypePillActiveCash: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  editPayTypePillActiveOnline: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  editPayTypePillActiveCredit: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECDD3',
  },
  editPayTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  editPayTypeTextActiveCash: {
    color: '#15803D',
    fontWeight: '800',
  },
  editPayTypeTextActiveOnline: {
    color: '#1D4ED8',
    fontWeight: '800',
  },
  editPayTypeTextActiveCredit: {
    color: '#DC2626',
    fontWeight: '800',
  },
  editActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    paddingTop: 8,
  },
  editCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  editSaveBtn: {
    flex: 1.6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  editSaveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default KamaiEntryScreen;
