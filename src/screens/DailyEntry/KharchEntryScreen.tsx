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
import { DailyLedgerService, MachineService } from '../../utils/api';
import { colors } from '../../theme';
import {
  FileText,
  IndianRupee,
  Calendar as CalendarIcon,
  StickyNote,
  CheckCircle,
  ArrowLeft,
  CreditCard,
  TrendingDown,
  X,
  Trash2,
  Wrench,
  Home,
  ChevronDown,
  Truck,
} from 'lucide-react-native';

// ─── Types ──────────────────────────────────────────────────────────────────
type KharchType = 'machine' | 'personal';

interface MachineItem {
  id: string | number;
  name: string;
  model_number?: string;
}

interface ExpenseDetailItem {
  id: string | number;
  description: string;
  amount: number;
  paymentType?: string;
  category: string;
  notes?: string;
}

interface KharchEntryScreenProps {
  onBack: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const KharchEntryScreen: React.FC<KharchEntryScreenProps> = ({ onBack }) => {
  // Kharch type tabs
  const [kharchType, setKharchType] = useState<KharchType>('machine');

  // Machine list for picker
  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [machinesLoading, setMachinesLoading] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<MachineItem | null>(null);
  const [showMachinePicker, setShowMachinePicker] = useState(false);

  // Form fields
  const [date, setDate] = useState<string>(getTodayFormatted());
  const [kharchDescription, setKharchDescription] = useState('');
  const [kharchAmount, setKharchAmount] = useState('');
  const [kharchPaymentType, setKharchPaymentType] = useState<'cash' | 'online' | 'credit'>('cash');
  const [kharchNotes, setKharchNotes] = useState('');
  const [kharchSaving, setKharchSaving] = useState(false);
  const [kharchSavedMsg, setKharchSavedMsg] = useState('');

  // Summary
  const [summary, setSummary] = useState({ expense: 0 });
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Details modal
  const [showDetails, setShowDetails] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [expenseList, setExpenseList] = useState<ExpenseDetailItem[]>([]);

  // Edit modal
  const [editItemModalOpen, setEditItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExpenseDetailItem | null>(null);
  const [editItemDesc, setEditItemDesc] = useState('');
  const [editItemAmount, setEditItemAmount] = useState('');
  const [editItemPayType, setEditItemPayType] = useState<'cash' | 'online' | 'credit'>('cash');
  const [editItemNotes, setEditItemNotes] = useState('');
  const [editItemSaving, setEditItemSaving] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getIsoDate = (dStr: string) => {
    const parts = dStr.split('/');
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : new Date().toISOString().split('T')[0];
  };

  // ── Fetch machines ────────────────────────────────────────────────────────
  const loadMachines = async () => {
    setMachinesLoading(true);
    try {
      const data = await MachineService.getAll();
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setMachines(list);
    } catch {
      setMachines([]);
    } finally {
      setMachinesLoading(false);
    }
  };

  useEffect(() => {
    loadMachines();
  }, []);

  // Reset machine selection when switching to personal
  useEffect(() => {
    if (kharchType === 'personal') {
      setSelectedMachine(null);
    }
  }, [kharchType]);

  // ── Fetch summary ─────────────────────────────────────────────────────────
  const fetchDaySummary = async () => {
    setSummaryLoading(true);
    try {
      const isoDate = getIsoDate(date);
      const ledgerRes = await DailyLedgerService.getAll({ date: isoDate });
      const rawLedger = Array.isArray(ledgerRes) ? ledgerRes : Array.isArray(ledgerRes?.data) ? ledgerRes.data : [];
      const ledgerExpense = rawLedger
        .filter((it: any) => it.type === 'expense')
        .reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);
      setSummary({ expense: ledgerExpense });
    } catch {
      setSummary({ expense: 0 });
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchDaySummary();
  }, [date]);

  // ── Load detail entries ───────────────────────────────────────────────────
  const loadDetailEntries = async () => {
    setModalLoading(true);
    const isoDate = getIsoDate(date);
    try {
      const ledgerRes = await DailyLedgerService.getAll({ date: isoDate });
      const rawLedger = Array.isArray(ledgerRes) ? ledgerRes : Array.isArray(ledgerRes?.data) ? ledgerRes.data : [];

      const expItems: ExpenseDetailItem[] = [];
      rawLedger
        .filter((it: any) => it.type === 'expense')
        .forEach((l: any) => {
          // Detect machine tag in notes
          let category = 'वैयक्तिक खर्च';
          const notesStr = (l.notes || '').toLowerCase();
          const descLower = (l.description || '').toLowerCase();

          if (notesStr.includes('[machine:') || descLower.includes('[machine:')) {
            category = 'मशीन खर्च';
          } else if (descLower.includes('डिझेल') || descLower.includes('diesel') || descLower.includes('fuel')) {
            category = 'इंधन (Fuel)';
          } else if (descLower.includes('पगार') || descLower.includes('मजुरी') || descLower.includes('salary')) {
            category = 'मजुरी (Labour)';
          } else if (descLower.includes('सर्व्हिस') || descLower.includes('ऑइल') || descLower.includes('oil')) {
            category = 'सर्व्हिसिंग (Service)';
          } else if (descLower.includes('दुरुस्ती') || descLower.includes('repair') || descLower.includes('spares')) {
            category = 'दुरुस्ती (Repair)';
          }

          expItems.push({
            id: l.id,
            description: l.description || 'खर्च नोंद',
            amount: Number(l.amount) || 0,
            paymentType: l.paymentType || l.payment_type || 'cash',
            category,
            notes: l.notes,
          });
        });
      setExpenseList(expItems);
    } catch {
      setExpenseList([]);
    } finally {
      setModalLoading(false);
    }
  };

  // ── Edit handlers ─────────────────────────────────────────────────────────
  const handleOpenEditItem = (item: ExpenseDetailItem) => {
    setEditingItem(item);
    setEditItemDesc(item.description);
    setEditItemAmount(String(item.amount));
    setEditItemPayType((item.paymentType as any) || 'cash');
    setEditItemNotes(item.notes || '');
    setEditItemModalOpen(true);
  };

  const handleSaveEditItem = async () => {
    if (!editingItem) return;
    const numAmt = parseFloat(editItemAmount.replace(/,/g, '')) || 0;
    if (numAmt <= 0) { Alert.alert('त्रुटी', 'कृपया योग्य रक्कम टाका.'); return; }
    if (!editItemDesc.trim()) { Alert.alert('त्रुटी', 'कृपया वर्णन टाका.'); return; }

    setEditItemSaving(true);
    try {
      await DailyLedgerService.update(editingItem.id, {
        description: editItemDesc.trim(),
        amount: numAmt,
        payment_type: editItemPayType,
        notes: editItemNotes.trim() || undefined,
      });
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

  const handleDeleteItem = (item: ExpenseDetailItem) => {
    Alert.alert('खर्च नोंद हटवा', 'तुम्हाला खरोखर ही खर्च नोंद हटवायची आहे का?', [
      { text: 'नाही', style: 'cancel' },
      {
        text: 'होय, हटवा',
        style: 'destructive',
        onPress: async () => {
          try {
            await DailyLedgerService.delete(item.id);
            await loadDetailEntries();
            await fetchDaySummary();
          } catch {
            Alert.alert('त्रुटी', 'नोंद हटवताना समस्या आली.');
          }
        },
      },
    ]);
  };

  // ── Save expense ──────────────────────────────────────────────────────────
  const handleSaveKharch = async () => {
    const numAmount = parseFloat(kharchAmount.replace(/,/g, '')) || 0;
    if (numAmount <= 0) { Alert.alert('त्रुटी', 'कृपया योग्य रक्कम टाका'); return; }
    if (!kharchDescription.trim()) { Alert.alert('त्रुटी', 'कृपया वर्णन किंवा खर्चाचे नाव टाका'); return; }
    if (kharchType === 'machine' && !selectedMachine) {
      Alert.alert('त्रुटी', 'कृपया मशीन निवडा'); return;
    }

    // Build notes: embed machine tag for machine kharch
    let notesVal = kharchNotes.trim();
    if (kharchType === 'machine' && selectedMachine) {
      const machineTag = `[machine: ${selectedMachine.name}]`;
      notesVal = notesVal ? `${machineTag} ${notesVal}` : machineTag;
    }

    setKharchSaving(true);
    try {
      await DailyLedgerService.create({
        entry_date: getIsoDate(date),
        type: 'expense',
        description: kharchDescription.trim(),
        amount: numAmount,
        payment_type: kharchPaymentType,
        notes: notesVal || undefined,
      });

      setKharchSavedMsg('खर्च नोंद यशस्वीरित्या सेव्ह झाली!');
      setKharchDescription('');
      setKharchAmount('');
      setKharchNotes('');
      setKharchPaymentType('cash');
      if (kharchType === 'machine') setSelectedMachine(null);
      await fetchDaySummary();
      setTimeout(() => setKharchSavedMsg(''), 3000);
    } catch {
      Alert.alert('त्रुटी', 'नोंद सेव्ह करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setKharchSaving(false);
    }
  };

  const expenseSum = expenseList.reduce((acc, it) => acc + it.amount, 0);

  // ── Extract machine name from notes ───────────────────────────────────────
  const extractMachineName = (notes?: string): string | null => {
    if (!notes) return null;
    const match = notes.match(/\[machine:\s*([^\]]+)\]/i);
    return match ? match[1].trim() : null;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>खर्च नोंद (जावक)</Text>
        <TouchableOpacity
          style={styles.saveHeaderBtn}
          onPress={handleSaveKharch}
          disabled={kharchSaving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveHeaderBtnText}>{kharchSaving ? '...' : 'जतन करा'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Success Banner */}
        {kharchSavedMsg ? (
          <View style={styles.successBanner}>
            <CheckCircle size={16} color="#DC2626" />
            <Text style={styles.successText}>{kharchSavedMsg}</Text>
          </View>
        ) : null}

        {/* ── Kharch Type Tabs ── */}
        <View style={styles.typeSectionContainer}>
          <Text style={styles.typeSectionLabel}>खर्च प्रकार निवडा</Text>
          <View style={styles.typeTabsRow}>
            {/* Machine Kharch Tab */}
            <TouchableOpacity
              style={[styles.typeTab, kharchType === 'machine' && styles.typeTabActiveMachine]}
              onPress={() => setKharchType('machine')}
              activeOpacity={0.8}
            >
              <Wrench size={18} color={kharchType === 'machine' ? 'white' : '#6B7280'} />
              <Text style={[styles.typeTabText, kharchType === 'machine' && styles.typeTabTextActive]}>
                मशीन खर्च
              </Text>
            </TouchableOpacity>

            {/* Personal Kharch Tab */}
            <TouchableOpacity
              style={[styles.typeTab, kharchType === 'personal' && styles.typeTabActivePersonal]}
              onPress={() => setKharchType('personal')}
              activeOpacity={0.8}
            >
              <Home size={18} color={kharchType === 'personal' ? 'white' : '#6B7280'} />
              <Text style={[styles.typeTabText, kharchType === 'personal' && styles.typeTabTextActive]}>
                वैयक्तिक खर्च
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Machine Picker (only for Machine Kharch) ── */}
        {kharchType === 'machine' && (
          <View style={styles.machineSelectorCard}>
            <View style={styles.machineSelectorHeader}>
              <Truck size={16} color="#92400E" />
              <Text style={styles.machineSelectorTitle}>
                मशीन निवडा <Text style={styles.requiredStar}>*</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.machinePickerBtn}
              onPress={() => setShowMachinePicker(true)}
              activeOpacity={0.8}
            >
              <View style={styles.machinePickerLeft}>
                {selectedMachine ? (
                  <>
                    <View style={styles.machinePickerDot} />
                    <View>
                      <Text style={styles.machinePickerName}>{selectedMachine.name}</Text>
                      {selectedMachine.model_number ? (
                        <Text style={styles.machinePickerModel}>{selectedMachine.model_number}</Text>
                      ) : null}
                    </View>
                  </>
                ) : (
                  <Text style={styles.machinePickerPlaceholder}>
                    {machinesLoading ? 'मशीन लोड होत आहे...' : '-- मशीन निवडा --'}
                  </Text>
                )}
              </View>
              <ChevronDown size={18} color="#92400E" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── तारीख ── */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <CalendarIcon size={18} color="#78350F" />
            <Text style={styles.labelText}>दिनांक <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <View style={styles.dateInputWrapper}>
            <AppDatePicker label="" value={date} onChange={setDate} />
          </View>
        </View>

        {/* ── वर्णन ── */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <FileText size={18} color="#78350F" />
            <Text style={styles.labelText}>
              {kharchType === 'machine' ? 'खर्चाचे कारण' : 'वर्णन / खर्च'}
              {' '}<Text style={styles.requiredStar}>*</Text>
            </Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={kharchDescription}
            onChangeText={setKharchDescription}
            placeholder={
              kharchType === 'machine'
                ? 'उदा. डिझेल / ऑइल / दुरुस्ती'
                : 'उदा. जेवण / प्रवास / घरखर्च'
            }
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* ── रक्कम ── */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <IndianRupee size={18} color="#78350F" />
            <Text style={styles.labelText}>रक्कम (₹) <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={kharchAmount}
            onChangeText={setKharchAmount}
            placeholder="उदा. 2000"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>

        {/* ── पेमेंट प्रकार ── */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <CreditCard size={18} color="#78350F" />
            <Text style={styles.labelText}>पेमेंट <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <View style={styles.radioGroup}>
            {(['cash', 'online', 'credit'] as const).map((pt) => (
              <TouchableOpacity
                key={pt}
                style={styles.radioItem}
                onPress={() => setKharchPaymentType(pt)}
                activeOpacity={0.7}
              >
                <View style={[styles.outerRadio, kharchPaymentType === pt && styles.outerRadioActive]}>
                  {kharchPaymentType === pt && <View style={styles.innerRadioDot} />}
                </View>
                <Text style={styles.radioText}>
                  {pt === 'cash' ? 'रोख' : pt === 'online' ? 'ऑनलाइन' : 'उधारी'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── नोंद ── */}
        <View style={styles.notesRow}>
          <View style={styles.labelContainerNotes}>
            <StickyNote size={18} color="#78350F" />
            <Text style={styles.labelText}>नोंद</Text>
          </View>
          <TextInput
            style={styles.notesArea}
            value={kharchNotes}
            onChangeText={setKharchNotes}
            placeholder="काही नोंद असल्यास लिहा..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* ── Save Button ── */}
        <View style={styles.bottomBtnWrapper}>
          <TouchableOpacity
            style={[
              styles.bottomSaveBtn,
              kharchType === 'personal' && styles.bottomSaveBtnPersonal,
            ]}
            onPress={handleSaveKharch}
            disabled={kharchSaving}
            activeOpacity={0.8}
          >
            <Text style={styles.bottomSaveBtnText}>
              {kharchSaving
                ? 'जतन होत आहे...'
                : kharchType === 'machine'
                ? '🔧 मशीन खर्च जतन करा'
                : '🏠 वैयक्तिक खर्च जतन करा'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Summary Card ── */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryTitle}>आजचा खर्च सारांश</Text>
            <Text style={styles.summaryDate}>{date}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => { setShowDetails(true); loadDetailEntries(); }}
            style={styles.summaryCard}
          >
            <View style={tw`flex flex-row items-center justify-between`}>
              <View style={tw`flex flex-row items-center gap-3`}>
                <View style={styles.summaryIconCircle}>
                  <TrendingDown size={20} color="#DC2626" />
                </View>
                <View>
                  <Text style={styles.summaryCardLabel}>एकूण खर्च (आजचा)</Text>
                  <Text style={styles.summaryCardAmount}>{formatCurrency(summary.expense)}</Text>
                </View>
              </View>
              <Text style={styles.summaryViewDetails}>तपशील पहा ›</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ══════════════════════════════════════
          MACHINE PICKER MODAL
      ══════════════════════════════════════ */}
      <Modal
        visible={showMachinePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMachinePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContainer}>
            <View style={styles.modalHeader}>
              <View style={tw`flex flex-row items-center gap-2.5`}>
                <View style={[styles.modalIconBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Truck size={20} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>मशीन निवडा</Text>
                  <Text style={styles.modalSubtitle}>मशीन खर्चासाठी मशीन निवडा</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowMachinePicker(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={true}>
              {machinesLoading ? (
                <View style={tw`py-14 items-center justify-center`}>
                  <ActivityIndicator size="large" color="#D97706" />
                  <Text style={tw`text-xs text-gray-500 mt-2 font-medium`}>मशीन लोड होत आहे...</Text>
                </View>
              ) : machines.length === 0 ? (
                <View style={tw`py-14 items-center justify-center`}>
                  <Text style={tw`text-sm font-semibold text-gray-400`}>कोणतीही मशीन उपलब्ध नाही.</Text>
                  <Text style={tw`text-xs text-gray-400 mt-1`}>मशीन विभागात प्रथम मशीन जोडा.</Text>
                </View>
              ) : (
                machines.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.machinePickerItem,
                      selectedMachine?.id === m.id && styles.machinePickerItemActive,
                    ]}
                    onPress={() => {
                      setSelectedMachine(m);
                      setShowMachinePicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.machinePickerItemIcon}>
                      <Truck size={16} color={selectedMachine?.id === m.id ? '#D97706' : '#9CA3AF'} />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={[
                        styles.machinePickerItemName,
                        selectedMachine?.id === m.id && styles.machinePickerItemNameActive,
                      ]}>
                        {m.name}
                      </Text>
                      {m.model_number ? (
                        <Text style={styles.machinePickerItemModel}>{m.model_number}</Text>
                      ) : null}
                    </View>
                    {selectedMachine?.id === m.id && (
                      <CheckCircle size={18} color="#D97706" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowMachinePicker(false)}
              style={[styles.modalCloseButton, { backgroundColor: '#92400E' }]}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseButtonText}>बंद करा</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════
          DETAIL ENTRIES MODAL
      ══════════════════════════════════════ */}
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
                  <TrendingDown size={20} color="#DC2626" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>खर्च तपशील</Text>
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
                      <Text style={styles.heroBannerLabel}>एकूण खर्च</Text>
                      <Text style={styles.heroBannerAmount}>{formatCurrency(summary.expense)}</Text>
                    </View>
                    <View style={tw`items-end`}>
                      <Text style={tw`text-[11px] text-red-700 font-bold`}>
                        एकूण नोंदी: {expenseList.length}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={tw`text-xs font-bold text-gray-700 px-1 pt-1`}>
                  खर्च नोंदी ({expenseList.length}):
                </Text>

                <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={true}>
                  {expenseList.length === 0 ? (
                    <View style={tw`py-10 items-center justify-center`}>
                      <Text style={tw`text-xs font-semibold text-gray-400`}>
                        आजसाठी कोणतीही खर्च नोंद उपलब्ध नाही.
                      </Text>
                    </View>
                  ) : (
                    expenseList.map((item, idx) => {
                      const machineName = extractMachineName(item.notes);
                      return (
                        <View key={item.id || idx} style={styles.itemCard}>
                          <View style={tw`flex flex-row justify-between items-start`}>
                            <View style={tw`flex-1 pr-2`}>
                              <View style={tw`flex flex-row items-center gap-1.5`}>
                                <TrendingDown size={14} color="#DC2626" />
                                <Text style={styles.itemTitle} numberOfLines={1}>{item.description}</Text>
                              </View>

                              {/* Machine tag badge */}
                              {machineName && (
                                <View style={styles.machineBadgeRow}>
                                  <Truck size={10} color="#92400E" />
                                  <Text style={styles.machineBadgeText}>{machineName}</Text>
                                </View>
                              )}

                              {item.notes && !machineName && (
                                <Text style={styles.itemSub} numberOfLines={1}>{item.notes}</Text>
                              )}

                              <View style={tw`flex flex-row items-center gap-2 mt-2`}>
                                <View style={[
                                  styles.categoryBadge,
                                  machineName && { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
                                ]}>
                                  <Text style={[
                                    styles.categoryBadgeText,
                                    machineName && { color: '#92400E' },
                                  ]}>
                                    {item.category}
                                  </Text>
                                </View>
                                <View style={styles.payBadge}>
                                  <Text style={styles.payBadgeText}>
                                    {item.paymentType === 'online' ? 'Online' : item.paymentType === 'credit' ? 'उधारी' : 'रोख'}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            <View style={tw`items-end gap-2`}>
                              <Text style={styles.amountRed}>-{formatCurrency(item.amount)}</Text>
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
                      );
                    })
                  )}
                </ScrollView>

                <View style={styles.tallyFooter}>
                  <Text style={tw`text-xs font-bold text-gray-700`}>एकूण खर्च बेरीज:</Text>
                  <Text style={tw`text-sm font-extrabold text-red-600`}>{formatCurrency(expenseSum)}</Text>
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
          EDIT EXPENSE MODAL
      ══════════════════════════════════════ */}
      <Modal
        visible={editItemModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditItemModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={tw`flex flex-row items-center justify-between pb-3 border-b border-gray-100`}>
              <Text style={tw`text-base font-extrabold text-gray-900`}>खर्च नोंद संपादन</Text>
              <TouchableOpacity onPress={() => setEditItemModalOpen(false)} style={tw`p-1`}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={tw`py-3 gap-3`} showsVerticalScrollIndicator={false}>
              <View style={tw`gap-1`}>
                <Text style={tw`text-xs font-bold text-gray-700`}>खर्चाचे नाव / वर्णन *</Text>
                <TextInput
                  style={styles.textInputBox}
                  value={editItemDesc}
                  onChangeText={setEditItemDesc}
                  placeholder="उदा. डिझेल / जेवण"
                />
              </View>

              <View style={tw`gap-1`}>
                <Text style={tw`text-xs font-bold text-gray-700`}>रक्कम (₹) *</Text>
                <TextInput
                  style={styles.textInputBox}
                  value={editItemAmount}
                  onChangeText={setEditItemAmount}
                  placeholder="उदा. 1500"
                  keyboardType="numeric"
                />
              </View>

              <View style={tw`gap-1`}>
                <Text style={tw`text-xs font-bold text-gray-700`}>नोंद / टिप</Text>
                <TextInput
                  style={[styles.textInputBox, { minHeight: 60, textAlignVertical: 'top' }]}
                  value={editItemNotes}
                  onChangeText={setEditItemNotes}
                  placeholder="उदा. पाटोदा पंप..."
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: '#6B121C',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: 'white', flex: 1, marginLeft: 12 },
  saveHeaderBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
  },
  saveHeaderBtnText: { color: '#1C1917', fontSize: 14, fontWeight: '800' },

  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 14 },

  successBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: { color: '#DC2626', fontSize: 13, fontWeight: '700' },

  // ── Type Tabs ──
  typeSectionContainer: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  typeSectionLabel: { fontSize: 12, fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 },
  typeTabsRow: { flexDirection: 'row', gap: 10 },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  typeTabActiveMachine: { backgroundColor: '#D97706', borderColor: '#B45309' },
  typeTabActivePersonal: { backgroundColor: '#7C3AED', borderColor: '#6D28D9' },
  typeTabText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  typeTabTextActive: { color: 'white' },

  // ── Machine Selector ──
  machineSelectorCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    gap: 10,
  },
  machineSelectorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  machineSelectorTitle: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  machinePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  machinePickerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  machinePickerDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D97706' },
  machinePickerName: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
  machinePickerModel: { fontSize: 11, fontWeight: '500', color: '#6B7280', marginTop: 1 },
  machinePickerPlaceholder: { fontSize: 13, fontWeight: '500', color: '#9CA3AF' },

  // ── Form inputs ──
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  labelContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '42%' },
  labelContainerNotes: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '24%', marginTop: 8 },
  labelText: { fontSize: 13, fontWeight: '700', color: '#1C1917' },
  requiredStar: { color: '#DC2626', fontWeight: '800' },
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
  dateInputWrapper: { flex: 1 },
  radioGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  radioItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  outerRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center' },
  outerRadioActive: { borderColor: '#DC2626' },
  innerRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626' },
  radioText: { fontSize: 12.5, fontWeight: '600', color: '#1F2937' },
  notesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 4 },
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

  // ── Save button ──
  bottomBtnWrapper: { marginTop: 6 },
  bottomSaveBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  bottomSaveBtnPersonal: { backgroundColor: '#7C3AED' },
  bottomSaveBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },

  // ── Summary ──
  summaryContainer: { marginTop: 10 },
  summaryHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 2 },
  summaryTitle: { fontSize: 13, fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryDate: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  summaryCard: { backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECDD3', borderRadius: 14, padding: 14 },
  summaryIconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  summaryCardLabel: { fontSize: 12, fontWeight: '700', color: '#DC2626' },
  summaryCardAmount: { fontSize: 20, fontWeight: '900', color: '#DC2626', marginTop: 2 },
  summaryViewDetails: { fontSize: 12, fontWeight: '700', color: '#DC2626' },

  // ── Machine picker modal ──
  pickerModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  machinePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  machinePickerItemActive: { backgroundColor: '#FFFBEB', borderColor: '#FCD34D' },
  machinePickerItemIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  machinePickerItemName: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
  machinePickerItemNameActive: { color: '#92400E' },
  machinePickerItemModel: { fontSize: 11, fontWeight: '500', color: '#6B7280', marginTop: 2 },

  // ── Shared modal styles ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
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
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalIconBadge: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  modalSubtitle: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  modalCloseBtn: { padding: 6, borderRadius: 20, backgroundColor: '#F3F4F6' },
  modalScrollBody: { maxHeight: 320 },
  heroBanner: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECDD3', borderRadius: 14, padding: 14 },
  heroBannerLabel: { fontSize: 11, fontWeight: '700', color: '#991B1B', marginBottom: 2 },
  heroBannerAmount: { fontSize: 22, fontWeight: '900', color: '#DC2626' },
  itemCard: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 8 },
  itemTitle: { fontSize: 13, fontWeight: '800', color: '#1F2937' },
  itemSub: { fontSize: 11, fontWeight: '500', color: '#4B5563', marginTop: 2 },
  machineBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  machineBadgeText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  categoryBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#E5E7EB' },
  categoryBadgeText: { fontSize: 9, fontWeight: '600', color: '#4B5563' },
  payBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  payBadgeText: { fontSize: 9, fontWeight: '700', color: '#6B7280' },
  amountRed: { fontSize: 14, fontWeight: '900', color: '#DC2626' },
  tallyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 4 },
  modalCloseButton: { backgroundColor: '#6B121C', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  modalCloseButtonText: { fontSize: 14, fontWeight: '800', color: 'white' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 400, maxHeight: '90%', backgroundColor: 'white', borderRadius: 16, padding: 20, elevation: 10 },
});

export default KharchEntryScreen;
