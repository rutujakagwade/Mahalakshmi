import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import tw from 'twrnc';
import {
  ArrowLeft,
  Plus,
  User,
  X,
  Phone,
  IndianRupee,
  Calendar as CalendarIcon,
  CheckCircle,
  HardHat,
  Trash2,
  FileText,
  Search,
  CreditCard,
} from 'lucide-react-native';
import { formatCurrency } from '../../utils/currency';
import { AppDatePicker } from '../../components/AppDatePicker';
import { getTodayFormatted } from '../../utils/date';
import { SafeStorage } from '../../utils/storage';

// ─── Interfaces ─────────────────────────────────────────────────────────────
export interface WorkerPayment {
  id: string;
  date: string; // 'DD/MM/YYYY'
  amount: number;
  paymentType: 'cash' | 'online' | 'bank';
  notes?: string;
}

export interface LabourWorker {
  id: string;
  name: string;
  role?: string;
  phone?: string;
  dailyRate: number; // दिवसाची मजुरी (दर)
  attendanceDays: number; // हजेरी (एकूण दिवस)
  startDate?: string; // कामाची सुरुवात तारीख
  payments: WorkerPayment[]; // तारखेनुसार पेमेंट नोंदी
}

interface MajurYadiScreenProps {
  onBack: () => void;
}

const STORAGE_KEY = '@mahalaxmi_labour_workers_v2';

// ─── Initial Demo Data ───────────────────────────────────────────────────────
const INITIAL_WORKERS: LabourWorker[] = [
  {
    id: 'w_1',
    name: 'गणेश शिंदे',
    role: 'JCB ऑपरेटर',
    phone: '9822114455',
    dailyRate: 600,
    attendanceDays: 22,
    startDate: '01/05/2024',
    payments: [
      { id: 'p_1_1', date: '10/05/2024', amount: 5000, paymentType: 'cash', notes: 'पहिले पेमेंट' },
      { id: 'p_1_2', date: '20/05/2024', amount: 6000, paymentType: 'online', notes: 'दुसरे पेमेंट' },
    ],
  },
  {
    id: 'w_2',
    name: 'संजय पवार',
    role: 'पोकलेन ऑपरेटर',
    phone: '9822336677',
    dailyRate: 600,
    attendanceDays: 21,
    startDate: '01/05/2024',
    payments: [
      { id: 'p_2_1', date: '12/05/2024', amount: 5500, paymentType: 'online', notes: 'GPay द्वारे' },
      { id: 'p_2_2', date: '22/05/2024', amount: 5000, paymentType: 'cash', notes: 'रोख उचल' },
    ],
  },
  {
    id: 'w_3',
    name: 'विक्रम जाधव',
    role: 'ट्रॅक्टर ड्रायव्हर',
    phone: '9855443322',
    dailyRate: 550,
    attendanceDays: 20,
    startDate: '03/05/2024',
    payments: [
      { id: 'p_3_1', date: '15/05/2024', amount: 5000, paymentType: 'cash', notes: 'उचल' },
      { id: 'p_3_2', date: '24/05/2024', amount: 4000, paymentType: 'cash', notes: 'पेमेंट' },
    ],
  },
  {
    id: 'w_4',
    name: 'रमेश मोरे',
    role: 'मजूर / हेल्पर',
    phone: '9766554433',
    dailyRate: 600,
    attendanceDays: 22,
    startDate: '01/05/2024',
    payments: [
      { id: 'p_4_1', date: '10/05/2024', amount: 6000, paymentType: 'cash', notes: 'उचल' },
      { id: 'p_4_2', date: '20/05/2024', amount: 5000, paymentType: 'online', notes: 'PhonePe' },
    ],
  },
  {
    id: 'w_5',
    name: 'बालू कांबळे',
    role: 'मजूर',
    phone: '9988776655',
    dailyRate: 550,
    attendanceDays: 18,
    startDate: '05/05/2024',
    payments: [
      { id: 'p_5_1', date: '16/05/2024', amount: 4000, paymentType: 'cash', notes: 'रोख' },
      { id: 'p_5_2', date: '25/05/2024', amount: 3500, paymentType: 'cash', notes: 'हिशोब' },
    ],
  },
];

// Helper to calculate total paid for a worker
export const getWorkerTotalPaid = (w: LabourWorker): number => {
  if (Array.isArray(w.payments) && w.payments.length > 0) {
    return w.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }
  return 0;
};

// Helper to calculate balance for a worker
export const getWorkerBalance = (w: LabourWorker): number => {
  const earned = (w.dailyRate || 0) * (w.attendanceDays || 0);
  const paid = getWorkerTotalPaid(w);
  return earned - paid;
};

export const MajurYadiScreen: React.FC<MajurYadiScreenProps> = ({ onBack }) => {
  const [workers, setWorkers] = useState<LabourWorker[]>(INITIAL_WORKERS);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ── Load from Storage ──
  useEffect(() => {
    (async () => {
      try {
        const stored = await SafeStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWorkers(parsed);
          }
        }
      } catch {}
    })();
  }, []);

  // ── Save to Storage ──
  const saveWorkers = async (updated: LabourWorker[]) => {
    setWorkers(updated);
    try {
      await SafeStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // ── Modal States ──
  // 1. Worker Detail & Payments History Modal
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const selectedWorker = useMemo(
    () => workers.find((w) => w.id === selectedWorkerId) || null,
    [workers, selectedWorkerId]
  );

  // 2. Add / Edit Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [payDate, setPayDate] = useState<string>(getTodayFormatted());
  const [payAmount, setPayAmount] = useState<string>('');
  const [payType, setPayType] = useState<'cash' | 'online' | 'bank'>('cash');
  const [payNotes, setPayNotes] = useState<string>('');

  // 3. Add New Worker Modal
  const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newDailyRate, setNewDailyRate] = useState<string>('');
  const [newAttendance, setNewAttendance] = useState<string>('');
  const [newStartDate, setNewStartDate] = useState<string>(getTodayFormatted());
  const [newInitialPaid, setNewInitialPaid] = useState<string>('');

  // 4. Edit Worker Info & Attendance Modal
  const [isEditWorkerModalOpen, setIsEditWorkerModalOpen] = useState<boolean>(false);
  const [editWorkerName, setEditWorkerName] = useState<string>('');
  const [editWorkerRole, setEditWorkerRole] = useState<string>('');
  const [editWorkerPhone, setEditWorkerPhone] = useState<string>('');
  const [editWorkerDailyRate, setEditWorkerDailyRate] = useState<string>('');
  const [editWorkerAttendance, setEditWorkerAttendance] = useState<string>('');
  const [editWorkerStartDate, setEditWorkerStartDate] = useState<string>('');

  // ── Search Filtering ──
  const filteredWorkers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return workers;
    return workers.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.role && w.role.toLowerCase().includes(q)) ||
        (w.phone && w.phone.includes(q))
    );
  }, [workers, searchQuery]);

  // ── Totals ──
  const totalAttendance = workers.reduce((sum, w) => sum + (w.attendanceDays || 0), 0);
  const totalPaid = workers.reduce((sum, w) => sum + getWorkerTotalPaid(w), 0);
  const totalEarned = workers.reduce((sum, w) => sum + (w.dailyRate * (w.attendanceDays || 0)), 0);
  const totalBalance = totalEarned - totalPaid;

  // ── Handlers: Add Worker ──
  const handleAddWorker = () => {
    if (!newName.trim()) {
      Alert.alert('त्रुटी', 'कृपया मजुराचे / ऑपरेटरचे नाव टाका.');
      return;
    }
    const rate = parseFloat(newDailyRate.replace(/,/g, '')) || 0;
    if (rate <= 0) {
      Alert.alert('त्रुटी', 'कृपया योग्य दिवसाची मजुरी (दर) टाका.');
      return;
    }

    const attendance = parseFloat(newAttendance.replace(/,/g, '')) || 0;
    const initialPaid = parseFloat(newInitialPaid.replace(/,/g, '')) || 0;

    const paymentsList: WorkerPayment[] = [];
    if (initialPaid > 0) {
      paymentsList.push({
        id: `p_${Date.now()}`,
        date: newStartDate || getTodayFormatted(),
        amount: initialPaid,
        paymentType: 'cash',
        notes: 'सुरुवातीची उचल / पेमेंट',
      });
    }

    const newWorker: LabourWorker = {
      id: `w_${Date.now()}`,
      name: newName.trim(),
      role: newRole.trim() || undefined,
      phone: newPhone.trim() || undefined,
      dailyRate: rate,
      attendanceDays: attendance,
      startDate: newStartDate || getTodayFormatted(),
      payments: paymentsList,
    };

    saveWorkers([...workers, newWorker]);
    setIsAddWorkerModalOpen(false);

    // Reset fields
    setNewName('');
    setNewRole('');
    setNewPhone('');
    setNewDailyRate('');
    setNewAttendance('');
    setNewStartDate(getTodayFormatted());
    setNewInitialPaid('');
  };

  // ── Handlers: Edit Worker Profile ──
  const handleOpenEditWorker = (worker: LabourWorker) => {
    setEditWorkerName(worker.name);
    setEditWorkerRole(worker.role || '');
    setEditWorkerPhone(worker.phone || '');
    setEditWorkerDailyRate(String(worker.dailyRate));
    setEditWorkerAttendance(String(worker.attendanceDays || 0));
    setEditWorkerStartDate(worker.startDate || getTodayFormatted());
    setIsEditWorkerModalOpen(true);
  };

  const handleSaveWorkerProfile = () => {
    if (!selectedWorker) return;
    if (!editWorkerName.trim()) {
      Alert.alert('त्रुटी', 'नाव आवश्यक आहे.');
      return;
    }
    const rate = parseFloat(editWorkerDailyRate.replace(/,/g, '')) || 0;
    if (rate <= 0) {
      Alert.alert('त्रुटी', 'योग्य मजुरी दर टाका.');
      return;
    }
    const att = parseFloat(editWorkerAttendance.replace(/,/g, '')) || 0;

    const updated = workers.map((w) =>
      w.id === selectedWorker.id
        ? {
            ...w,
            name: editWorkerName.trim(),
            role: editWorkerRole.trim() || undefined,
            phone: editWorkerPhone.trim() || undefined,
            dailyRate: rate,
            attendanceDays: att,
            startDate: editWorkerStartDate,
          }
        : w
    );

    saveWorkers(updated);
    setIsEditWorkerModalOpen(false);
  };

  // ── Handlers: Delete Worker ──
  const handleDeleteWorker = (workerId: string) => {
    Alert.alert('मजूर हटवा', 'तुम्हाला खरोखर हा मजूर व त्याचे सर्व पेमेंट रेकॉर्ड हटवायचे आहेत का?', [
      { text: 'नाही', style: 'cancel' },
      {
        text: 'होय, हटवा',
        style: 'destructive',
        onPress: () => {
          const updated = workers.filter((w) => w.id !== workerId);
          saveWorkers(updated);
          setSelectedWorkerId(null);
        },
      },
    ]);
  };

  // ── Handlers: Date-Wise Payment ──
  const handleOpenAddPayment = () => {
    setEditingPaymentId(null);
    setPayDate(getTodayFormatted());
    setPayAmount('');
    setPayType('cash');
    setPayNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleOpenEditPayment = (payment: WorkerPayment) => {
    setEditingPaymentId(payment.id);
    setPayDate(payment.date || getTodayFormatted());
    setPayAmount(String(payment.amount));
    setPayType(payment.paymentType || 'cash');
    setPayNotes(payment.notes || '');
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = () => {
    if (!selectedWorker) return;
    const amt = parseFloat(payAmount.replace(/,/g, '')) || 0;
    if (amt <= 0) {
      Alert.alert('त्रुटी', 'कृपया योग्य पेमेंट रक्कम टाका.');
      return;
    }
    if (!payDate.trim()) {
      Alert.alert('त्रुटी', 'कृपया पेमेंट तारीख निवडा.');
      return;
    }

    let updatedPayments: WorkerPayment[] = [...(selectedWorker.payments || [])];

    if (editingPaymentId) {
      // Edit existing
      updatedPayments = updatedPayments.map((p) =>
        p.id === editingPaymentId
          ? {
              ...p,
              date: payDate,
              amount: amt,
              paymentType: payType,
              notes: payNotes.trim() || undefined,
            }
          : p
      );
    } else {
      // Add new
      const newPay: WorkerPayment = {
        id: `p_${Date.now()}`,
        date: payDate,
        amount: amt,
        paymentType: payType,
        notes: payNotes.trim() || undefined,
      };
      updatedPayments = [newPay, ...updatedPayments];
    }

    const updatedWorkers = workers.map((w) =>
      w.id === selectedWorker.id ? { ...w, payments: updatedPayments } : w
    );

    saveWorkers(updatedWorkers);
    setIsPaymentModalOpen(false);
    setEditingPaymentId(null);
  };

  const handleDeletePayment = (paymentId: string) => {
    if (!selectedWorker) return;
    Alert.alert('पेमेंट नोंद हटवा', 'तुम्हाला ही पेमेंट नोंद हटवायची आहे का?', [
      { text: 'नाही', style: 'cancel' },
      {
        text: 'होय, हटवा',
        style: 'destructive',
        onPress: () => {
          const updatedPayments = (selectedWorker.payments || []).filter((p) => p.id !== paymentId);
          const updatedWorkers = workers.map((w) =>
            w.id === selectedWorker.id ? { ...w, payments: updatedPayments } : w
          );
          saveWorkers(updatedWorkers);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#6B121C" />

      {/* Maroon Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>मजूर यादी</Text>

        <TouchableOpacity
          style={styles.plusBtn}
          onPress={() => setIsAddWorkerModalOpen(true)}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Plus size={20} color="#1C1917" strokeWidth={3} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.body}>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="मजुराचे नाव किंवा फोन शोधा..."
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
          <Text style={styles.colHeaderName}>नाव</Text>
          <Text style={styles.colHeaderRate}>दर (₹)</Text>
          <Text style={styles.colHeaderAttendance}>हजेरी</Text>
          <Text style={styles.colHeaderPaid}>दिलेली</Text>
          <Text style={styles.colHeaderBalance}>बाकी</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Worker Rows */}
          {filteredWorkers.map((worker) => {
            const workerPaid = getWorkerTotalPaid(worker);
            const balanceWorker = getWorkerBalance(worker);

            return (
              <TouchableOpacity
                key={worker.id}
                style={styles.workerRow}
                activeOpacity={0.7}
                onPress={() => setSelectedWorkerId(worker.id)}
              >
                {/* Avatar + Name */}
                <View style={styles.nameCol}>
                  <View style={styles.avatarWrap}>
                    <User size={18} color="#1E3A8A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nameText} numberOfLines={1}>
                      {worker.name}
                    </Text>
                    {worker.role ? (
                      <Text style={styles.roleSubText} numberOfLines={1}>
                        {worker.role}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Daily Rate */}
                <Text style={styles.rateText}>
                  {worker.dailyRate.toLocaleString('en-IN')}
                </Text>

                {/* Attendance */}
                <Text style={styles.attendanceText}>{worker.attendanceDays || 0} दि.</Text>

                {/* Paid Amount */}
                <Text style={styles.paidText}>
                  {workerPaid.toLocaleString('en-IN')}
                </Text>

                {/* Balance Amount */}
                <Text style={[styles.balanceText, balanceWorker > 0 && styles.balanceTextRed]}>
                  {balanceWorker.toLocaleString('en-IN')}
                </Text>
              </TouchableOpacity>
            );
          })}

          {filteredWorkers.length === 0 && (
            <View style={styles.emptyContainer}>
              <HardHat size={44} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>कोणताही मजूर सापडला नाही</Text>
              <Text style={styles.emptySubtitle}>नवीन मजूर जोडण्यासाठी वरील + बटण दाबा</Text>
            </View>
          )}

          {/* Table Summary Row */}
          {filteredWorkers.length > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>एकूण</Text>
              <Text style={styles.totalAttendance}>{totalAttendance} दि.</Text>
              <Text style={styles.totalPaid}>
                {totalPaid.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.totalBalance}>
                {totalBalance.toLocaleString('en-IN')}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* 3 Summary Cards at Bottom */}
        <View style={styles.bottomSummaryCards}>
          {/* Card 1: एकूण मजूर */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardLabelGreen}>एकूण मजूर</Text>
            <Text style={styles.cardValueDark}>{workers.length}</Text>
          </View>

          {/* Card 2: एकूण दिलेले */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardLabelGreen}>एकूण दिलेले</Text>
            <Text style={styles.cardValueDark}>
              ₹{totalPaid.toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Card 3: एकूण बाकी */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardLabelRed}>एकूण बाकी</Text>
            <Text style={styles.cardValueRed}>
              ₹{totalBalance.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {/* ═════════════════════════════════════════════════════════════════════
          1. WORKER DETAIL & DATE-WISE PAYMENT SHEET
      ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={!!selectedWorker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedWorkerId(null)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.backdropDismiss}
            activeOpacity={1}
            onPress={() => setSelectedWorkerId(null)}
          />
          {selectedWorker && (
            <View style={styles.sheetContainer}>
              {/* Sheet Header */}
              <View style={styles.sheetHeader}>
                <View style={tw`flex-row items-center gap-3`}>
                  <View style={styles.sheetAvatar}>
                    <HardHat size={20} color="#7C3AED" />
                  </View>
                  <View>
                    <Text style={styles.sheetTitle}>{selectedWorker.name}</Text>
                    <Text style={styles.sheetSub}>
                      {selectedWorker.role || 'मजूर'} • {selectedWorker.phone || 'फोन नंबर नाही'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedWorkerId(null)}
                  style={styles.sheetCloseBtn}
                  activeOpacity={0.7}
                >
                  <X size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, gap: 14 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
              >
                {/* Financial Snapshot Card */}
                <View style={styles.workerStatsCard}>
                  <View style={styles.statsRow}>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>दैनिक दर</Text>
                      <Text style={styles.statValue}>₹{selectedWorker.dailyRate}</Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>एकूण हजेरी</Text>
                      <Text style={styles.statValue}>{selectedWorker.attendanceDays || 0} दिवस</Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabel}>एकूण कमाई</Text>
                      <Text style={styles.statValue}>
                        ₹{(selectedWorker.dailyRate * (selectedWorker.attendanceDays || 0)).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statsDivider} />

                  <View style={styles.statsRow}>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabelGreen}>एकूण दिलेले</Text>
                      <Text style={styles.statValueGreen}>
                        ₹{getWorkerTotalPaid(selectedWorker).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.statCol}>
                      <Text style={styles.statLabelRed}>शिल्लक बाकी</Text>
                      <Text style={[styles.statValueRed, getWorkerBalance(selectedWorker) <= 0 && { color: '#15803D' }]}>
                        ₹{getWorkerBalance(selectedWorker).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Quick Action Buttons */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.addPaymentBtn}
                    onPress={handleOpenAddPayment}
                    activeOpacity={0.8}
                  >
                    <Plus size={16} color="white" strokeWidth={2.5} />
                    <Text style={styles.addPaymentBtnText}>+ पेमेंट जमा करा</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.editWorkerBtn}
                    onPress={() => handleOpenEditWorker(selectedWorker)}
                    activeOpacity={0.8}
                  >
                    <FileText size={15} color="#2563EB" />
                    <Text style={styles.editWorkerBtnText}>हजेरी / दर बदला</Text>
                  </TouchableOpacity>
                </View>

                {/* Section Title */}
                <View style={styles.paymentSectionHeader}>
                  <View style={tw`flex-row items-center gap-2`}>
                    <CalendarIcon size={16} color="#7C3AED" />
                    <Text style={styles.paymentSectionTitle}>तारखेनुसार पेमेंट हिशोब</Text>
                  </View>
                  <View style={styles.paymentCountBadge}>
                    <Text style={styles.paymentCountText}>
                      {(selectedWorker.payments || []).length} नोंदी
                    </Text>
                  </View>
                </View>

                {/* Date-wise Payments List */}
                {(!selectedWorker.payments || selectedWorker.payments.length === 0) ? (
                  <View style={styles.emptyPaymentsBox}>
                    <CreditCard size={32} color="#D1D5DB" />
                    <Text style={styles.emptyPaymentsText}>कोणतीही पेमेंट नोंद नाही.</Text>
                    <TouchableOpacity
                      style={styles.emptyAddBtn}
                      onPress={handleOpenAddPayment}
                    >
                      <Text style={styles.emptyAddBtnText}>+ पहिले पेमेंट जोडा</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  selectedWorker.payments.map((p) => (
                    <View key={p.id} style={styles.paymentCard}>
                      <View style={tw`flex-row justify-between items-start`}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={tw`flex-row items-center gap-2`}>
                            <CalendarIcon size={13} color="#78350F" />
                            <Text style={styles.paymentDateText}>{p.date}</Text>
                            <View style={styles.payTypeBadge}>
                              <Text style={styles.payTypeBadgeText}>
                                {p.paymentType === 'online'
                                  ? 'ऑनलाइन'
                                  : p.paymentType === 'bank'
                                  ? 'बँक'
                                  : 'रोख'}
                              </Text>
                            </View>
                          </View>
                          {p.notes ? (
                            <Text style={styles.paymentNotesText} numberOfLines={2}>
                              📝 {p.notes}
                            </Text>
                          ) : null}
                        </View>

                        <View style={tw`items-end gap-2`}>
                          <Text style={styles.paymentAmountText}>
                            -₹{Number(p.amount).toLocaleString('en-IN')}
                          </Text>
                          <View style={tw`flex-row items-center gap-2`}>
                            <TouchableOpacity
                              style={styles.paymentActionBtnEdit}
                              onPress={() => handleOpenEditPayment(p)}
                              activeOpacity={0.7}
                            >
                              <FileText size={12} color="#2563EB" />
                              <Text style={styles.paymentActionTextEdit}>बदल</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.paymentActionBtnDelete}
                              onPress={() => handleDeletePayment(p.id)}
                              activeOpacity={0.7}
                            >
                              <Trash2 size={12} color="#DC2626" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))
                )}

                {/* Delete Worker Row */}
                <TouchableOpacity
                  style={styles.deleteWorkerRowBtn}
                  onPress={() => handleDeleteWorker(selectedWorker.id)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={15} color="#DC2626" />
                  <Text style={styles.deleteWorkerRowText}>हा मजूर यादीतून कायमचा हटवा</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════
          2. ADD / EDIT PAYMENT MODAL
      ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isPaymentModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPaymentModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={tw`flex-row items-center gap-2`}>
                <IndianRupee size={18} color="#16A34A" />
                <Text style={styles.modalTitle}>
                  {editingPaymentId ? 'पेमेंट नोंद संपादन' : 'नवीन पेमेंट जमा करा'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsPaymentModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* तारीख */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>पेमेंट दिनांक *</Text>
                <AppDatePicker label="" value={payDate} onChange={setPayDate} />
              </View>

              {/* रक्कम */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>रक्कम (₹) *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={payAmount}
                  onChangeText={setPayAmount}
                  placeholder="उदा. 2000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              {/* पेमेंट प्रकार */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>पेमेंट प्रकार</Text>
                <View style={styles.payTypeRadioRow}>
                  {(['cash', 'online', 'bank'] as const).map((pt) => (
                    <TouchableOpacity
                      key={pt}
                      style={styles.payTypeRadioItem}
                      onPress={() => setPayType(pt)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.outerRadio, payType === pt && styles.outerRadioActive]}>
                        {payType === pt && <View style={styles.innerRadioDot} />}
                      </View>
                      <Text style={styles.radioText}>
                        {pt === 'cash' ? 'रोख' : pt === 'online' ? 'ऑनलाइन' : 'बँक'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* नोंद / टिप */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>नोंद / टिप</Text>
                <TextInput
                  style={[styles.modalTextInput, { minHeight: 60, textAlignVertical: 'top' }]}
                  value={payNotes}
                  onChangeText={setPayNotes}
                  placeholder="उदा. उचल / आठवडा पगार..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { backgroundColor: '#16A34A' }]}
                onPress={handleSavePayment}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimaryBtnText}>
                  {editingPaymentId ? 'पेमेंट अपडेट करा' : 'पेमेंट जमा करा'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════
          3. ADD NEW WORKER MODAL
      ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isAddWorkerModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAddWorkerModalOpen(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.backdropDismiss}
            activeOpacity={1}
            onPress={() => setIsAddWorkerModalOpen(false)}
          />
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <View style={tw`flex-row items-center gap-3`}>
                <View style={[styles.sheetAvatar, { backgroundColor: '#FEF3C7' }]}>
                  <HardHat size={20} color="#D97706" />
                </View>
                <Text style={styles.sheetTitle}>नवीन मजूर / ऑपरेटर जोडा</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddWorkerModalOpen(false)}
                style={styles.sheetCloseBtn}
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, gap: 14 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>मजुराचे / ऑपरेटरचे नाव *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="उदा. राहुल जाधव"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>काम / पद</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newRole}
                  onChangeText={setNewRole}
                  placeholder="उदा. JCB ऑपरेटर / ड्रायव्हर / हेल्पर"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>मोबाईल नंबर</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newPhone}
                  onChangeText={setNewPhone}
                  placeholder="उदा. 9876543210"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>कामाची सुरुवात तारीख</Text>
                <AppDatePicker label="" value={newStartDate} onChange={setNewStartDate} />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>दिवसाची मजुरी (दर ₹) *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newDailyRate}
                  onChangeText={setNewDailyRate}
                  placeholder="उदा. 600"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>हजेरी (एकूण दिवस)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newAttendance}
                  onChangeText={setNewAttendance}
                  placeholder="उदा. 20"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>सुरुवातीची दिलेली उचल / पेमेंट (₹)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newInitialPaid}
                  onChangeText={setNewInitialPaid}
                  placeholder="उदा. 5000 (नसल्यास रिकामे ठेवा)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { backgroundColor: '#6B121C', marginTop: 8 }]}
                onPress={handleAddWorker}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimaryBtnText}>मजूर जतन करा</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═════════════════════════════════════════════════════════════════════
          4. EDIT WORKER INFO & ATTENDANCE MODAL
      ═════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isEditWorkerModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditWorkerModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={tw`flex-row items-center gap-2`}>
                <FileText size={18} color="#2563EB" />
                <Text style={styles.modalTitle}>मजूर माहिती व हजेरी बदला</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditWorkerModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>नाव *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={editWorkerName}
                  onChangeText={setEditWorkerName}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>पद / काम</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={editWorkerRole}
                  onChangeText={setEditWorkerRole}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>मोबाईल नंबर</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={editWorkerPhone}
                  onChangeText={setEditWorkerPhone}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>दिवसाची मजुरी (दर ₹) *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={editWorkerDailyRate}
                  onChangeText={setEditWorkerDailyRate}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>हजेरी (एकूण दिवस) *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={editWorkerAttendance}
                  onChangeText={setEditWorkerAttendance}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { backgroundColor: '#2563EB', marginTop: 8 }]}
                onPress={handleSaveWorkerProfile}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimaryBtnText}>बदल जतन करा</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Stylesheet ─────────────────────────────────────────────────────────────
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 14,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13.5,
    color: '#1F2937',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF7EE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8D8',
  },
  colHeaderName: {
    flex: 2.2,
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1917',
  },
  colHeaderRate: {
    flex: 1.4,
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1917',
    textAlign: 'center',
  },
  colHeaderAttendance: {
    flex: 1.1,
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1917',
    textAlign: 'center',
  },
  colHeaderPaid: {
    flex: 1.5,
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1917',
    textAlign: 'right',
  },
  colHeaderBalance: {
    flex: 1.5,
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1917',
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  nameCol: {
    flex: 2.2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  roleSubText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#7C3AED',
    marginTop: 1,
  },
  rateText: {
    flex: 1.4,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  attendanceText: {
    flex: 1.1,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  paidText: {
    flex: 1.5,
    fontSize: 13.5,
    fontWeight: '800',
    color: '#15803D',
    textAlign: 'right',
  },
  balanceText: {
    flex: 1.5,
    fontSize: 13.5,
    fontWeight: '800',
    color: '#374151',
    textAlign: 'right',
  },
  balanceTextRed: {
    color: '#DC2626',
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
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  totalLabel: {
    flex: 3.6,
    fontSize: 14.5,
    fontWeight: '900',
    color: '#1C1917',
  },
  totalAttendance: {
    flex: 1.1,
    fontSize: 14,
    fontWeight: '900',
    color: '#1C1917',
    textAlign: 'center',
  },
  totalPaid: {
    flex: 1.5,
    fontSize: 14,
    fontWeight: '900',
    color: '#15803D',
    textAlign: 'right',
  },
  totalBalance: {
    flex: 1.5,
    fontSize: 14,
    fontWeight: '900',
    color: '#DC2626',
    textAlign: 'right',
  },
  bottomSummaryCards: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardLabelGreen: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardLabelRed: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 4,
    textAlign: 'center',
  },
  cardValueDark: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#1C1917',
  },
  cardValueRed: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#DC2626',
  },

  // ── Bottom Sheet Modals ──
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '88%',
    paddingBottom: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1F2937',
  },
  sheetSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  sheetCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },

  // Worker stats card
  workerStatsCard: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1F2937',
  },
  statLabelGreen: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 2,
  },
  statValueGreen: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
  statLabelRed: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 2,
  },
  statValueRed: {
    fontSize: 16,
    fontWeight: '900',
    color: '#DC2626',
  },
  statsDivider: {
    height: 1,
    backgroundColor: '#E9D5FF',
  },

  // Action buttons
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addPaymentBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 2,
  },
  addPaymentBtnText: {
    color: 'white',
    fontSize: 13.5,
    fontWeight: '800',
  },
  editWorkerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 12,
    borderRadius: 10,
  },
  editWorkerBtnText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },

  // Payment section
  paymentSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  paymentSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  paymentCountBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  paymentCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C3AED',
  },
  emptyPaymentsBox: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyPaymentsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyAddBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  emptyAddBtnText: {
    color: 'white',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Payment card
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  paymentDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  payTypeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  payTypeBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#92400E',
  },
  paymentNotesText: {
    fontSize: 11.5,
    color: '#4B5563',
    marginTop: 4,
  },
  paymentAmountText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#15803D',
  },
  paymentActionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paymentActionTextEdit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  paymentActionBtnDelete: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    padding: 4,
    borderRadius: 6,
  },

  deleteWorkerRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 12,
  },
  deleteWorkerRowText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#DC2626',
  },

  // ── Form Modals ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#1F2937',
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
  payTypeRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 4,
  },
  payTypeRadioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    borderColor: '#16A34A',
  },
  innerRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
  },
  radioText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalPrimaryBtn: {
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalPrimaryBtnText: {
    color: 'white',
    fontSize: 14.5,
    fontWeight: '800',
  },
});

export default MajurYadiScreen;
