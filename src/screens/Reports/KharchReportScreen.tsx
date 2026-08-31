import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import tw from 'twrnc';
import {
  ArrowLeft,
  Plus,
  Truck,
  User,
  Wallet,
  FileText,
  Calendar,
  Home,
  HardHat,
  X,
  Trash2,
  CheckCircle,
  Search,
  Wrench,
  IndianRupee,
  StickyNote,
  CreditCard,
  ChevronDown,
} from 'lucide-react-native';
import { DailyLedgerService, MachineService } from '../../utils/api';
import { formatCurrency } from '../../utils/currency';
import { AppDatePicker } from '../../components/AppDatePicker';
import { getTodayFormatted } from '../../utils/date';

type KharchSection = 'all' | 'machine' | 'personal';
type KharchType = 'machine' | 'personal';

interface MachineItem {
  id: string | number;
  name: string;
  model_number?: string;
}

interface KharchReportScreenProps {
  onBack: () => void;
  onNavigateToAddKharch?: () => void;
}

interface ExpenseRowItem {
  id: string | number;
  category: string;
  displayDate: string;
  rawDate: string;
  amount: number;
  iconType: 'diesel' | 'food' | 'material' | 'machine' | 'labour' | 'other';
  notes?: string;
}

type FilterPeriod = 'all' | 'today' | 'weekly' | 'monthly' | 'custom';

// Initial demo data matching the user's reference design
const DEFAULT_EXPENSE_ITEMS: ExpenseRowItem[] = [
  {
    id: 'demo_1',
    category: 'डिझेल',
    displayDate: '20/05/2024',
    rawDate: '2024-05-20',
    amount: 2500,
    iconType: 'diesel',
  },
  {
    id: 'demo_2',
    category: 'जेवण',
    displayDate: '20/05/2024',
    rawDate: '2024-05-20',
    amount: 1250,
    iconType: 'food',
  },
  {
    id: 'demo_3',
    category: 'साहित्य',
    displayDate: '20/05/2024',
    rawDate: '2024-05-20',
    amount: 4800,
    iconType: 'material',
  },
  {
    id: 'demo_4',
    category: 'मशीन / JCB',
    displayDate: '19/05/2024',
    rawDate: '2024-05-19',
    amount: 5000,
    iconType: 'machine',
  },
  {
    id: 'demo_5',
    category: 'मजुरी',
    displayDate: '20/05/2024',
    rawDate: '2024-05-20',
    amount: 11000,
    iconType: 'labour',
  },
  {
    id: 'demo_6',
    category: 'इतर खर्च',
    displayDate: '20/05/2024',
    rawDate: '2024-05-20',
    amount: 750,
    iconType: 'other',
  },
];

export const KharchReportScreen: React.FC<KharchReportScreenProps> = ({
  onBack,
  onNavigateToAddKharch,
}) => {
  const [expenses, setExpenses] = useState<ExpenseRowItem[]>(DEFAULT_EXPENSE_ITEMS);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Section tab (machine / personal / all)
  const [activeSection, setActiveSection] = useState<KharchSection>('all');

  // Filters State
  const [selectedFilter, setSelectedFilter] = useState<FilterPeriod>('all');
  const [customFromDate, setCustomFromDate] = useState<string>(getTodayFormatted());
  const [customToDate, setCustomToDate] = useState<string>(getTodayFormatted());
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Edit / Delete Form State
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRowItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editDesc, setEditDesc] = useState<string>('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editPayType, setEditPayType] = useState<'cash' | 'online' | 'credit'>('cash');
  const [editKharchType, setEditKharchType] = useState<KharchType>('personal');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  // Machine state for edit form
  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [machinesLoading, setMachinesLoading] = useState(false);
  const [editSelectedMachine, setEditSelectedMachine] = useState<MachineItem | null>(null);
  const [showEditMachinePicker, setShowEditMachinePicker] = useState(false);

  // Helper: detect machine kharch from notes field - defined early so useMemo callbacks can use it
  const isMachineKharch = (item: ExpenseRowItem): boolean => {
    return !!(
      (item.notes && /\[machine:/i.test(item.notes)) ||
      item.iconType === 'machine'
    );
  };

  // Load machines once
  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const getCategoryAndIcon = (desc: string): { category: string; iconType: ExpenseRowItem['iconType'] } => {
    const d = (desc || '').toLowerCase();
    if (d.includes('डिझेल') || d.includes('diesel') || d.includes('इंधन') || d.includes('fuel') || d.includes('पेट्रोल')) {
      return { category: 'डिझेल', iconType: 'diesel' };
    }
    if (d.includes('जेवण') || d.includes('food') || d.includes('चहा') || d.includes('नाश्ता') || d.includes('हॉटेल')) {
      return { category: 'जेवण', iconType: 'food' };
    }
    if (d.includes('साहित्य') || d.includes('material') || d.includes('पार्ट') || d.includes('ऑइल') || d.includes('सामग्री') || d.includes('दुरुस्ती')) {
      return { category: 'साहित्य', iconType: 'material' };
    }
    if (d.includes('मशीन') || d.includes('jcb') || d.includes('पोकलेन') || d.includes('ट्रॅक्टर') || d.includes('भाडे')) {
      return { category: 'मशीन / JCB', iconType: 'machine' };
    }
    if (d.includes('मजुरी') || d.includes('पगार') || d.includes('salary') || d.includes('labour') || d.includes('ड्रायव्हर')) {
      return { category: 'मजुरी', iconType: 'labour' };
    }
    return { category: desc || 'इतर खर्च', iconType: 'other' };
  };

  const formatToDisplayDate = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  };

  const formatToIsoDate = (dStr: string) => {
    if (!dStr) return new Date().toISOString().split('T')[0];
    const parts = dStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dStr;
  };

  const fetchExpenses = async () => {
    try {
      const res = await DailyLedgerService.getAll({ type: 'expense' });
      const rawList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      const expenseEntries = rawList.filter((it: any) => it.type === 'expense');

      if (expenseEntries.length > 0) {
        const parsed: ExpenseRowItem[] = expenseEntries.map((it: any) => {
          const { category, iconType } = getCategoryAndIcon(it.description);
          return {
            id: it.id || Math.random().toString(),
            category: category,
            displayDate: formatToDisplayDate(it.entry_date),
            rawDate: it.entry_date || '',
            amount: Number(it.amount) || 0,
            iconType: iconType,
            notes: it.notes,
          };
        });
        setExpenses(parsed);
      } else {
        setExpenses(DEFAULT_EXPENSE_ITEMS);
      }
    } catch {
      setExpenses(DEFAULT_EXPENSE_ITEMS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExpenses();
  }, []);

  // Filter Calculation Logic
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);

    // Week calculation (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const weekIso = sevenDaysAgo.toISOString().slice(0, 10);

    // Month calculation (YYYY-MM)
    const currentMonthPrefix = todayIso.slice(0, 7);

    // Custom range
    const fromIso = formatToIsoDate(customFromDate);
    const toIso = formatToIsoDate(customToDate);

    return expenses.filter((item) => {
      const itemDate = item.rawDate || formatToIsoDate(item.displayDate);

      // Period Filter
      let matchesPeriod = true;
      if (selectedFilter === 'today') {
        matchesPeriod = itemDate === todayIso;
      } else if (selectedFilter === 'weekly') {
        matchesPeriod = itemDate >= weekIso && itemDate <= todayIso;
      } else if (selectedFilter === 'monthly') {
        matchesPeriod = itemDate.startsWith(currentMonthPrefix);
      } else if (selectedFilter === 'custom') {
        matchesPeriod = itemDate >= fromIso && itemDate <= toIso;
      }

      // Search Query Filter
      const q = searchQuery.trim().toLowerCase();
      let matchesSearch = true;
      if (q) {
        matchesSearch =
          item.category.toLowerCase().includes(q) ||
          item.displayDate.includes(q) ||
          !!(item.notes && item.notes.toLowerCase().includes(q));
      }

      return matchesPeriod && matchesSearch;
    });
  }, [expenses, selectedFilter, customFromDate, customToDate, searchQuery]);

  // Section-filtered list
  const sectionExpenses = useMemo(() => {
    if (activeSection === 'machine') return filteredExpenses.filter(isMachineKharch);
    if (activeSection === 'personal') return filteredExpenses.filter((it) => !isMachineKharch(it));
    return filteredExpenses;
  }, [filteredExpenses, activeSection]);

  // Section totals for badge
  const machineTotal = useMemo(() => filteredExpenses.filter(isMachineKharch).reduce((s, i) => s + i.amount, 0), [filteredExpenses]);
  const personalTotal = useMemo(() => filteredExpenses.filter((i) => !isMachineKharch(i)).reduce((s, i) => s + i.amount, 0), [filteredExpenses]);

  const totalExpense = sectionExpenses.reduce((sum, item) => sum + item.amount, 0);

  const getFilterSummaryTitle = () => {
    switch (selectedFilter) {
      case 'today':
        return 'आजचा एकूण खर्च';
      case 'weekly':
        return 'या आठवड्याचा एकूण खर्च';
      case 'monthly':
        return 'या महिन्याचा एकूण खर्च';
      case 'custom':
        return 'निवडलेल्या कालावधीचा खर्च';
      case 'all':
      default:
        return 'एकूण खर्च';
    }
  };

  const handleOpenEdit = (item: ExpenseRowItem) => {
    setSelectedExpense(item);
    setEditDesc(item.category);
    setEditAmount(String(item.amount));
    setEditDate(item.displayDate || formatToDisplayDate(item.rawDate));

    // Detect machine vs personal
    const machineMatch = item.notes && item.notes.match(/\[machine:\s*([^\]]+)\]/i);
    if (machineMatch || item.iconType === 'machine') {
      setEditKharchType('machine');
      // Find the machine in list if possible
      const mName = machineMatch ? machineMatch[1].trim() : '';
      const found = machines.find((m) => m.name.toLowerCase() === mName.toLowerCase()) || null;
      setEditSelectedMachine(found || (mName ? { id: 'unknown', name: mName } : null));
      // Strip machine tag from notes for display
      const cleanNotes = item.notes ? item.notes.replace(/\[machine:\s*[^\]]+\]/gi, '').trim() : '';
      setEditNotes(cleanNotes);
    } else {
      setEditKharchType('personal');
      setEditSelectedMachine(null);
      setEditNotes(item.notes || '');
    }

    setEditPayType('cash'); // default since we don't store it on ExpenseRowItem
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedExpense) return;
    const numAmt = parseFloat(editAmount.replace(/,/g, '')) || 0;
    if (numAmt <= 0) {
      Alert.alert('त्रुटी', 'कृपया योग्य रक्कम टाका.');
      return;
    }
    if (!editDesc.trim()) {
      Alert.alert('त्रुटी', 'कृपया खर्चाचे नाव / वर्णन टाका.');
      return;
    }
    if (editKharchType === 'machine' && !editSelectedMachine) {
      Alert.alert('त्रुटी', 'कृपया मशीन निवडा.');
      return;
    }

    // Build notes with machine tag
    let notesVal = editNotes.trim();
    if (editKharchType === 'machine' && editSelectedMachine) {
      const machineTag = `[machine: ${editSelectedMachine.name}]`;
      notesVal = notesVal ? `${machineTag} ${notesVal}` : machineTag;
    }

    setSavingEdit(true);
    try {
      const isoDate = formatToIsoDate(editDate);
      if (!String(selectedExpense.id).startsWith('demo_')) {
        await DailyLedgerService.update(selectedExpense.id, {
          description: editDesc.trim(),
          amount: numAmt,
          entry_date: isoDate,
          payment_type: editPayType,
          notes: notesVal || undefined,
        });
      }

      const { category, iconType } = getCategoryAndIcon(editDesc.trim());
      setExpenses((prev) =>
        prev.map((it) =>
          it.id === selectedExpense.id
            ? { ...it, category, iconType, amount: numAmt, displayDate: editDate, rawDate: isoDate, notes: notesVal }
            : it
        )
      );

      setToastMsg('खर्च नोंद यशस्वीरित्या अपडेट झाली!');
      setIsEditModalOpen(false);
      setTimeout(() => setToastMsg(''), 2500);
    } catch (err: any) {
      Alert.alert('त्रुटी', err?.message || 'नोंद अपडेट करताना समस्या आली.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;

    Alert.alert('खर्च नोंद हटवा', 'तुम्हाला खरोखर ही खर्च नोंद हटवायची आहे का?', [
      { text: 'नाही', style: 'cancel' },
      {
        text: 'होय, हटवा',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!String(selectedExpense.id).startsWith('demo_')) {
              await DailyLedgerService.delete(selectedExpense.id);
            }
            setExpenses((prev) => prev.filter((it) => it.id !== selectedExpense.id));
            setIsEditModalOpen(false);
            setToastMsg('खर्च नोंद हटवली गेली.');
            setTimeout(() => setToastMsg(''), 2500);
          } catch {
            Alert.alert('त्रुटी', 'नोंद हटवताना समस्या आली.');
          }
        },
      },
    ]);
  };

  const renderIconBadge = (iconType: ExpenseRowItem['iconType']) => {
    switch (iconType) {
      case 'diesel':
        return (
          <View style={[styles.iconBadge, { backgroundColor: '#E0E7FF' }]}>
            <Truck size={17} color="#1E3A8A" />
          </View>
        );
      case 'food':
        return (
          <View style={[styles.iconBadge, { backgroundColor: '#FEF3C7' }]}>
            <Home size={17} color="#D97706" />
          </View>
        );
      case 'material':
        return (
          <View style={[styles.iconBadge, { backgroundColor: '#F3F4F6' }]}>
            <HardHat size={17} color="#1F2937" />
          </View>
        );
      case 'machine':
        return (
          <View style={[styles.iconBadge, { backgroundColor: '#FEF3C7' }]}>
            <Truck size={17} color="#B45309" />
          </View>
        );
      case 'labour':
        return (
          <View style={[styles.iconBadge, { backgroundColor: '#FEE2E2' }]}>
            <User size={17} color="#DC2626" />
          </View>
        );
      case 'other':
      default:
        return (
          <View style={[styles.iconBadge, { backgroundColor: '#F5EBE6' }]}>
            <Wallet size={17} color="#78350F" />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#6B121C" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>खर्च अहवाल</Text>

        <TouchableOpacity
          style={styles.plusBtn}
          onPress={onNavigateToAddKharch}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Plus size={20} color="#1C1917" strokeWidth={3} />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.body}>
        {toastMsg ? (
          <View style={styles.toastBanner}>
            <CheckCircle size={16} color="#15803D" />
            <Text style={styles.toastText}>{toastMsg}</Text>
          </View>
        ) : null}

        {/* Filter Tabs Row */}
        <View style={styles.filterTabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabsContent}>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'all' && styles.filterChipTextActive]}>
                सर्व (All)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'today' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('today')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'today' && styles.filterChipTextActive]}>
                आज (Today)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'weekly' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('weekly')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'weekly' && styles.filterChipTextActive]}>
                आठवडा (Weekly)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'monthly' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('monthly')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, selectedFilter === 'monthly' && styles.filterChipTextActive]}>
                महिना (Monthly)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedFilter === 'custom' && styles.filterChipActive]}
              onPress={() => setSelectedFilter('custom')}
              activeOpacity={0.7}
            >
              <Calendar size={13} color={selectedFilter === 'custom' ? 'white' : '#6B7280'} />
              <Text style={[styles.filterChipText, selectedFilter === 'custom' && styles.filterChipTextActive]}>
                तारीख निवडा
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Custom Date Pickers (Shown only when 'तारीख निवडा' is active) */}
        {selectedFilter === 'custom' && (
          <View style={styles.customDateBox}>
            <View style={styles.datePickerCol}>
              <Text style={styles.datePickerLabel}>पासून (From)</Text>
              <AppDatePicker
                label=""
                value={customFromDate}
                onChange={setCustomFromDate}
              />
            </View>
            <View style={styles.datePickerCol}>
              <Text style={styles.datePickerLabel}>पर्यंत (To)</Text>
              <AppDatePicker
                label=""
                value={customToDate}
                onChange={setCustomToDate}
              />
            </View>
          </View>
        )}

        {/* ── Section Tabs: Machine / Personal ── */}
        <View style={styles.sectionTabsRow}>
          {/* All */}
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'all' && styles.sectionTabActiveAll]}
            onPress={() => setActiveSection('all')}
            activeOpacity={0.8}
          >
            <FileText size={14} color={activeSection === 'all' ? 'white' : '#6B7280'} />
            <Text style={[styles.sectionTabText, activeSection === 'all' && styles.sectionTabTextActive]}>
              सर्व
            </Text>
            <View style={[styles.sectionTabBadge, activeSection === 'all' && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <Text style={[styles.sectionTabBadgeText, activeSection === 'all' && { color: 'white' }]}>
                {filteredExpenses.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Machine Kharch */}
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'machine' && styles.sectionTabActiveMachine]}
            onPress={() => setActiveSection('machine')}
            activeOpacity={0.8}
          >
            <Wrench size={14} color={activeSection === 'machine' ? 'white' : '#92400E'} />
            <Text style={[styles.sectionTabText, activeSection === 'machine' && styles.sectionTabTextActive, activeSection !== 'machine' && { color: '#92400E' }]}>
              मशीन खर्च
            </Text>
            <View style={[styles.sectionTabBadge, { backgroundColor: '#FEF3C7' }, activeSection === 'machine' && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <Text style={[styles.sectionTabBadgeText, { color: '#92400E' }, activeSection === 'machine' && { color: 'white' }]}>
                ₹{Math.round(machineTotal / 1000) > 0 ? `${Math.round(machineTotal / 1000)}k` : machineTotal}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Personal Kharch */}
          <TouchableOpacity
            style={[styles.sectionTab, activeSection === 'personal' && styles.sectionTabActivePersonal]}
            onPress={() => setActiveSection('personal')}
            activeOpacity={0.8}
          >
            <Home size={14} color={activeSection === 'personal' ? 'white' : '#6D28D9'} />
            <Text style={[styles.sectionTabText, activeSection === 'personal' && styles.sectionTabTextActive, activeSection !== 'personal' && { color: '#6D28D9' }]}>
              वैयक्तिक
            </Text>
            <View style={[styles.sectionTabBadge, { backgroundColor: '#EDE9FE' }, activeSection === 'personal' && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <Text style={[styles.sectionTabBadgeText, { color: '#6D28D9' }, activeSection === 'personal' && { color: 'white' }]}>
                ₹{Math.round(personalTotal / 1000) > 0 ? `${Math.round(personalTotal / 1000)}k` : personalTotal}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="खर्च प्रकार किंवा टिप शोधा..."
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={15} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Table Column Headers */}
        <View style={styles.tableHeaderRow}>
          <Text style={styles.colHeaderCategory}>
            {activeSection === 'machine' ? '🔧 मशीन खर्च' : activeSection === 'personal' ? '🏠 वैयक्तिक खर्च' : 'खर्च प्रकार'}
          </Text>
          <Text style={styles.colHeaderDate}>दिनांक</Text>
          <Text style={styles.colHeaderAmount}>रक्कम (₹)</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6B121C" />
            <Text style={styles.loadingText}>खर्च डेटा लोड होत आहे...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing === true}
                onRefresh={onRefresh}
                colors={['#6B121C']}
                tintColor="#6B121C"
              />
            }
          >
            {/* List of expense rows */}
            {sectionExpenses.map((item, index) => {
              const isMachine = isMachineKharch(item);
              const machineNameMatch = item.notes && item.notes.match(/\[machine:\s*([^\]]+)\]/i);
              const machineName = machineNameMatch ? machineNameMatch[1].trim() : null;
              const displayNotes = item.notes
                ? item.notes.replace(/\[machine:\s*[^\]]+\]/gi, '').trim()
                : '';
              return (
                <TouchableOpacity
                  key={item.id || index}
                  style={[
                    styles.expenseRow,
                    isMachine && styles.expenseRowMachine,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleOpenEdit(item)}
                >
                  {/* Category + Icon */}
                  <View style={styles.categoryCol}>
                    {renderIconBadge(item.iconType)}
                    <View style={tw`flex-1`}>
                      <Text style={styles.categoryText} numberOfLines={1}>
                        {item.category}
                      </Text>
                      {machineName ? (
                        <View style={styles.machineLabelRow}>
                          <Truck size={9} color="#92400E" />
                          <Text style={styles.machineLabelText} numberOfLines={1}>{machineName}</Text>
                        </View>
                      ) : null}
                      {displayNotes ? (
                        <Text style={styles.notesSubText} numberOfLines={1}>
                          {displayNotes}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Date */}
                  <Text style={styles.dateText}>{item.displayDate}</Text>

                  {/* Amount + Action */}
                  <View style={styles.amountCol}>
                    <Text style={styles.amountText}>
                      {Number(item.amount).toLocaleString('en-IN')}
                    </Text>
                    <View style={styles.rowEditBadge}>
                      <FileText size={11} color="#2563EB" />
                      <Text style={styles.rowEditText}>बदल</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {sectionExpenses.length === 0 && (
              <View style={styles.emptyContainer}>
                <FileText size={44} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>
                  {activeSection === 'machine'
                    ? 'या कालावधीत मशीन खर्च सापडला नाही'
                    : activeSection === 'personal'
                    ? 'या कालावधीत वैयक्तिक खर्च सापडला नाही'
                    : 'या कालावधीत कोणताही खर्च सापडला नाही'}
                </Text>
                <Text style={styles.emptySubtitle}>दुसरा फिल्टर निवडा किंवा नवीन खर्च जोडा</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Bottom Total Summary Card */}
        <View style={[
          styles.bottomCard,
          activeSection === 'machine' && { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' },
          activeSection === 'personal' && { backgroundColor: '#EDE9FE', borderColor: '#C4B5FD' },
        ]}>
          <View>
            <Text style={[
              styles.bottomCardLabel,
              activeSection === 'machine' && { color: '#92400E' },
              activeSection === 'personal' && { color: '#5B21B6' },
            ]}>
              {activeSection === 'machine'
                ? '🔧 मशीन खर्च एकूण'
                : activeSection === 'personal'
                ? '🏠 वैयक्तिक खर्च एकूण'
                : getFilterSummaryTitle()}
            </Text>
            <Text style={styles.bottomCardSub}>{sectionExpenses.length} नोंदी (Entries)</Text>
          </View>
          <Text style={[
            styles.bottomCardAmount,
            activeSection === 'machine' && { color: '#92400E' },
            activeSection === 'personal' && { color: '#5B21B6' },
          ]}>
            ₹ {totalExpense.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* ════════════════════════════════════
          FULL KHARCH ENTRY EDIT FORM (Bottom Sheet)
      ════════════════════════════════════ */}
      <Modal
        visible={isEditModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.editSheetOverlay}>
          <TouchableOpacity
            style={styles.backdropDismiss}
            activeOpacity={1}
            onPress={() => setIsEditModalOpen(false)}
          />
          <View style={styles.editSheetContainer}>

            {/* Sheet Header */}
            <View style={styles.editSheetHeader}>
              <View style={tw`flex-row items-center gap-3`}>
                <View style={styles.editSheetIconBadge}>
                  <FileText size={18} color="#DC2626" />
                </View>
                <View>
                  <Text style={styles.editSheetTitle}>खर्च नोंद संपादन</Text>
                  <Text style={styles.editSheetSub}>{selectedExpense?.displayDate}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={styles.editSheetCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.editScrollView}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.editSheetBody}
            >

              {/* ── खर्च प्रकार Tabs ── */}
              <View style={styles.editSectionLabel}>
                <Text style={styles.editSectionLabelText}>खर्च प्रकार</Text>
              </View>
              <View style={styles.editTypeTabsRow}>
                <TouchableOpacity
                  style={[styles.editTypeTab, editKharchType === 'machine' && styles.editTypeTabMachine]}
                  onPress={() => setEditKharchType('machine')}
                  activeOpacity={0.8}
                >
                  <Wrench size={16} color={editKharchType === 'machine' ? 'white' : '#92400E'} />
                  <Text style={[styles.editTypeTabText, editKharchType === 'machine' && styles.editTypeTabTextActive]}>
                    मशीन खर्च
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editTypeTab, editKharchType === 'personal' && styles.editTypeTabPersonal]}
                  onPress={() => { setEditKharchType('personal'); setEditSelectedMachine(null); }}
                  activeOpacity={0.8}
                >
                  <Home size={16} color={editKharchType === 'personal' ? 'white' : '#6D28D9'} />
                  <Text style={[styles.editTypeTabText, editKharchType === 'personal' && styles.editTypeTabTextActive]}>
                    वैयक्तिक खर्च
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Machine Picker (only for machine type) ── */}
              {editKharchType === 'machine' && (
                <View style={styles.editMachineCard}>
                  <View style={tw`flex-row items-center gap-2 mb-2`}>
                    <Truck size={14} color="#92400E" />
                    <Text style={styles.editFieldLabel}>मशीन निवडा <Text style={{ color: '#DC2626' }}>*</Text></Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editMachinePickerBtn}
                    onPress={() => setShowEditMachinePicker(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={editSelectedMachine ? styles.editMachinePickerValue : styles.editMachinePickerPlaceholder}>
                      {editSelectedMachine ? editSelectedMachine.name : '-- मशीन निवडा --'}
                    </Text>
                    <ChevronDown size={16} color="#92400E" />
                  </TouchableOpacity>
                </View>
              )}

              {/* ── दिनांक ── */}
              <View style={styles.editFieldGroup}>
                <View style={tw`flex-row items-center gap-2 mb-2`}>
                  <Calendar size={14} color="#78350F" />
                  <Text style={styles.editFieldLabel}>दिनांक <Text style={{ color: '#DC2626' }}>*</Text></Text>
                </View>
                <AppDatePicker label="" value={editDate} onChange={setEditDate} />
              </View>

              {/* ── वर्णन ── */}
              <View style={styles.editFieldGroup}>
                <View style={tw`flex-row items-center gap-2 mb-2`}>
                  <FileText size={14} color="#78350F" />
                  <Text style={styles.editFieldLabel}>
                    {editKharchType === 'machine' ? 'खर्चाचे कारण' : 'वर्णन / खर्च'}{' '}
                    <Text style={{ color: '#DC2626' }}>*</Text>
                  </Text>
                </View>
                <TextInput
                  style={styles.editTextInput}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  placeholder={editKharchType === 'machine' ? 'उदा. डिझेल / ऑइल / दुरुस्ती' : 'उदा. जेवण / प्रवास'}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* ── रक्कम ── */}
              <View style={styles.editFieldGroup}>
                <View style={tw`flex-row items-center gap-2 mb-2`}>
                  <IndianRupee size={14} color="#78350F" />
                  <Text style={styles.editFieldLabel}>रक्कम (₹) <Text style={{ color: '#DC2626' }}>*</Text></Text>
                </View>
                <TextInput
                  style={styles.editTextInput}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  placeholder="उदा. 2500"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* ── पेमेंट प्रकार ── */}
              <View style={styles.editFieldGroup}>
                <View style={tw`flex-row items-center gap-2 mb-2`}>
                  <CreditCard size={14} color="#78350F" />
                  <Text style={styles.editFieldLabel}>पेमेंट प्रकार</Text>
                </View>
                <View style={styles.editRadioRow}>
                  {(['cash', 'online', 'credit'] as const).map((pt) => (
                    <TouchableOpacity
                      key={pt}
                      style={styles.editRadioItem}
                      onPress={() => setEditPayType(pt)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.editOuterRadio, editPayType === pt && styles.editOuterRadioActive]}>
                        {editPayType === pt && <View style={styles.editInnerDot} />}
                      </View>
                      <Text style={styles.editRadioText}>
                        {pt === 'cash' ? 'रोख' : pt === 'online' ? 'ऑनलाइन' : 'उधारी'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ── नोंद ── */}
              <View style={styles.editFieldGroup}>
                <View style={tw`flex-row items-center gap-2 mb-2`}>
                  <StickyNote size={14} color="#78350F" />
                  <Text style={styles.editFieldLabel}>नोंद / टिप</Text>
                </View>
                <TextInput
                  style={[styles.editTextInput, { minHeight: 70, textAlignVertical: 'top' }]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="काही नोंद असल्यास..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              {/* ── Save Button ── */}
              <TouchableOpacity
                style={[
                  styles.editSaveBtn,
                  editKharchType === 'personal' && { backgroundColor: '#7C3AED' },
                ]}
                onPress={handleSaveEdit}
                disabled={savingEdit}
                activeOpacity={0.8}
              >
                <Text style={styles.editSaveBtnText}>
                  {savingEdit ? 'जतन होत आहे...' : editKharchType === 'machine' ? '🔧 बदल जतन करा' : '🏠 बदल जतन करा'}
                </Text>
              </TouchableOpacity>

              {/* ── Delete Button ── */}
              <TouchableOpacity
                style={styles.editDeleteBtn}
                onPress={handleDeleteExpense}
                activeOpacity={0.7}
              >
                <Trash2 size={15} color="#DC2626" />
                <Text style={styles.editDeleteBtnText}>खर्च नोंद हटवा</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ════════════════════════════════════
          MACHINE PICKER MODAL (for edit)
      ════════════════════════════════════ */}
      <Modal
        visible={showEditMachinePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditMachinePicker(false)}
      >
        <View style={styles.editSheetOverlay}>
          <View style={styles.pickerSheetContainer}>
            <View style={styles.editSheetHeader}>
              <View style={tw`flex-row items-center gap-3`}>
                <View style={[styles.editSheetIconBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Truck size={18} color="#D97706" />
                </View>
                <Text style={styles.editSheetTitle}>मशीन निवडा</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditMachinePicker(false)} style={styles.editSheetCloseBtn}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              {machinesLoading ? (
                <View style={tw`py-12 items-center`}>
                  <ActivityIndicator size="large" color="#D97706" />
                </View>
              ) : machines.length === 0 ? (
                <View style={tw`py-12 items-center`}>
                  <Text style={tw`text-sm text-gray-400 font-semibold`}>कोणतीही मशीन उपलब्ध नाही.</Text>
                </View>
              ) : (
                machines.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.editMachineItem,
                      editSelectedMachine?.id === m.id && styles.editMachineItemActive,
                    ]}
                    onPress={() => { setEditSelectedMachine(m); setShowEditMachinePicker(false); }}
                    activeOpacity={0.7}
                  >
                    <Truck size={15} color={editSelectedMachine?.id === m.id ? '#D97706' : '#9CA3AF'} />
                    <View style={tw`flex-1`}>
                      <Text style={[
                        styles.editMachineItemName,
                        editSelectedMachine?.id === m.id && { color: '#92400E' },
                      ]}>
                        {m.name}
                      </Text>
                      {m.model_number ? <Text style={styles.editMachineItemModel}>{m.model_number}</Text> : null}
                    </View>
                    {editSelectedMachine?.id === m.id && <CheckCircle size={16} color="#D97706" />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowEditMachinePicker(false)}
              style={[styles.editSaveBtn, { backgroundColor: '#92400E', marginHorizontal: 0, marginTop: 8 }]}
              activeOpacity={0.8}
            >
              <Text style={styles.editSaveBtnText}>बंद करा</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#6B121C',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    flex: 1,
    marginLeft: 14,
    letterSpacing: 0.3,
  },
  plusBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  body: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  toastBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toastText: {
    color: '#15803D',
    fontSize: 13,
    fontWeight: '700',
  },
  filterTabsContainer: {
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 10,
  },
  filterTabsContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  filterChipActive: {
    backgroundColor: '#6B121C',
    borderColor: '#6B121C',
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  customDateBox: {
    flexDirection: 'row',
    backgroundColor: '#FDF7EE',
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8D8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 12,
  },
  datePickerCol: {
    flex: 1,
    gap: 2,
  },
  datePickerLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#78350F',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 14,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 7,
    fontSize: 13,
    color: '#1F2937',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF7EE',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8D8',
  },
  colHeaderCategory: {
    flex: 1.5,
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
  },
  colHeaderDate: {
    flex: 1.2,
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
    textAlign: 'center',
  },
  colHeaderAmount: {
    flex: 1.2,
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1917',
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  expenseRowMachine: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 3,
    borderLeftColor: '#D97706',
  },
  // Section tabs
  sectionTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  sectionTabActiveAll: {
    backgroundColor: '#6B121C',
    borderColor: '#6B121C',
  },
  sectionTabActiveMachine: {
    backgroundColor: '#D97706',
    borderColor: '#B45309',
  },
  sectionTabActivePersonal: {
    backgroundColor: '#7C3AED',
    borderColor: '#6D28D9',
  },
  sectionTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  sectionTabTextActive: {
    color: 'white',
  },
  sectionTabBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    minWidth: 24,
    alignItems: 'center',
  },
  sectionTabBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7280',
  },
  // Machine label badge in list
  machineLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  machineLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  categoryCol: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  notesSubText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  dateText: {
    flex: 1.2,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  amountCol: {
    flex: 1.3,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
  },
  amountText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'right',
  },
  rowEditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rowEditText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  bottomCard: {
    backgroundColor: '#FDF5EC',
    borderWidth: 1,
    borderColor: '#F5E6D3',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'android' ? 16 : 24,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  bottomCardLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
  },
  bottomCardSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#78350F',
    marginTop: 2,
  },
  bottomCardAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1C1917',
  },
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1917',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    flexGrow: 0,
  },
  modalInputGroup: {
    marginBottom: 12,
    gap: 4,
  },
  modalInputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#374151',
  },
  modalTextInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1F2937',
  },
  modalPrimaryBtn: {
    backgroundColor: '#6B121C',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalPrimaryBtnText: {
    color: 'white',
    fontSize: 14.5,
    fontWeight: '800',
  },
  deleteExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 10,
  },
  deleteExpenseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  // ── Edit Bottom Sheet ──
  editSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  editSheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    paddingBottom: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  editScrollView: {
    flex: 1,
  },
  pickerSheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  editSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  editSheetIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  editSheetSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 1,
  },
  editSheetCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  editSheetBody: {
    padding: 16,
    gap: 14,
    paddingBottom: 8,
  },
  // Section label
  editSectionLabel: {
    marginBottom: 2,
  },
  editSectionLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Type tabs
  editTypeTabsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editTypeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  editTypeTabMachine: {
    backgroundColor: '#D97706',
    borderColor: '#B45309',
  },
  editTypeTabPersonal: {
    backgroundColor: '#7C3AED',
    borderColor: '#6D28D9',
  },
  editTypeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  editTypeTabTextActive: {
    color: 'white',
  },
  // Machine picker
  editMachineCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
  },
  editMachinePickerBtn: {
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
  editMachinePickerValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    flex: 1,
  },
  editMachinePickerPlaceholder: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    flex: 1,
  },
  editMachineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editMachineItemActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  editMachineItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  editMachineItemModel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
  },
  // Field group
  editFieldGroup: {
    gap: 2,
  },
  editFieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
  },
  editTextInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1F2937',
  },
  // Radio buttons
  editRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 4,
  },
  editRadioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editOuterRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editOuterRadioActive: {
    borderColor: '#DC2626',
  },
  editInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  editRadioText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Buttons
  editSaveBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 0,
    elevation: 2,
    marginTop: 4,
  },
  editSaveBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  editDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
  },
  editDeleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});

export default KharchReportScreen;
