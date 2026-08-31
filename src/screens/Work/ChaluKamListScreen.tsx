import React, { useEffect, useState, useCallback } from 'react';
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
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import tw from 'twrnc';
import {
  ArrowLeft,
  Plus,
  Truck,
  User,
  Home,
  FileText,
  Calendar,
  IndianRupee,
  CheckCircle,
  Clock,
  Trash2,
  X,
  Search,
  Check,
} from 'lucide-react-native';
import { MachineEntryService, CustomerService, MachineService } from '../../utils/api';
import { formatCurrency } from '../../utils/currency';

interface ChaluKamListScreenProps {
  onBack: () => void;
  onNavigateToNavinKam: () => void;
}

export interface ChaluWorkItem {
  id: string | number;
  workName: string;
  customerName: string;
  customerPhone?: string;
  machineName: string;
  village?: string;
  workType: 'foot' | 'hours' | 'theka';
  rate?: number;
  quantity?: number;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  paymentType: string;
  startDate: string;
  status: 'ongoing' | 'completed';
  notes?: string;
}

const INITIAL_CHALU_WORKS: ChaluWorkItem[] = [
  {
    id: 'w_101',
    workName: 'विहीर खोदकाम',
    customerName: 'सुरेश पाटील',
    customerPhone: '9876543210',
    machineName: 'JCB 3DX',
    village: 'पाटोदा, बीड',
    workType: 'foot',
    rate: 80,
    quantity: 350,
    totalAmount: 28000,
    advanceAmount: 5000,
    balanceAmount: 23000,
    paymentType: 'cash',
    startDate: '28/05/2024',
    status: 'ongoing',
    notes: 'काम चालू आहे, ४० फूट बाकी',
  },
  {
    id: 'w_102',
    workName: 'शेत समतलीकरण',
    customerName: 'रमेश देशमुख',
    customerPhone: '9822334455',
    machineName: 'पोकलेन 210',
    village: 'आष्टी',
    workType: 'hours',
    rate: 1800,
    quantity: 15,
    totalAmount: 27000,
    advanceAmount: 10000,
    balanceAmount: 17000,
    paymentType: 'online',
    startDate: '29/05/2024',
    status: 'ongoing',
    notes: 'दररोज ४ तास काम',
  },
  {
    id: 'w_103',
    workName: 'रस्ता बांधकाम ठेका',
    customerName: 'विकास काळे',
    customerPhone: '9766554433',
    machineName: 'JCB 3DX',
    village: 'गेवराई',
    workType: 'theka',
    totalAmount: 45000,
    advanceAmount: 15000,
    balanceAmount: 30000,
    paymentType: 'credit',
    startDate: '25/05/2024',
    status: 'ongoing',
    notes: 'ठेका पूर्ण झाल्यावर उर्वरित रक्कम',
  },
  {
    id: 'w_104',
    workName: 'पाया खोदकाम',
    customerName: 'आनंद शिंदे',
    customerPhone: '9988776655',
    machineName: 'JCB 3DX',
    village: 'बीड शहर',
    workType: 'hours',
    rate: 1200,
    quantity: 10,
    totalAmount: 12000,
    advanceAmount: 12000,
    balanceAmount: 0,
    paymentType: 'cash',
    startDate: '20/05/2024',
    status: 'completed',
    notes: 'काम पूर्ण व पूर्ण पेमेंट मिळाले',
  },
];

export const ChaluKamListScreen: React.FC<ChaluKamListScreenProps> = ({
  onBack,
  onNavigateToNavinKam,
}) => {
  const [works, setWorks] = useState<ChaluWorkItem[]>(INITIAL_CHALU_WORKS);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'ongoing' | 'completed' | 'all'>('ongoing');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Edit Modal State
  const [selectedWork, setSelectedWork] = useState<ChaluWorkItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editWorkName, setEditWorkName] = useState<string>('');
  const [editVillage, setEditVillage] = useState<string>('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editAdvance, setEditAdvance] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editSaving, setEditSaving] = useState<boolean>(false);

  const [toastMsg, setToastMsg] = useState<string>('');

  const fetchWorks = async () => {
    try {
      const res = await MachineEntryService.getAll();
      const rawList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

      if (rawList.length > 0) {
        const parsed: ChaluWorkItem[] = rawList.map((it: any) => {
          const tot = Number(it.amount) || 0;
          return {
            id: it.id || Math.random().toString(),
            workName: it.workDescription || it.work_description || 'मशीन काम',
            customerName: it.customerName || it.customer?.name || 'थेट ग्राहक',
            customerPhone: it.customer?.phone || '',
            machineName: it.machineName || it.machine?.name || 'JCB 3DX',
            village: it.location || '',
            workType: it.hoursUnit === 'trips' ? 'foot' : 'hours',
            quantity: Number(it.hoursOrTrips || it.hours_or_trips) || 0,
            totalAmount: tot,
            advanceAmount: 0,
            balanceAmount: tot,
            paymentType: it.paymentType || it.payment_type || 'cash',
            startDate: it.entryDate || it.entry_date || 'चालू',
            status: 'ongoing',
            notes: it.notes,
          };
        });

        // Merge with initial demo items
        setWorks([...parsed, ...INITIAL_CHALU_WORKS]);
      } else {
        setWorks(INITIAL_CHALU_WORKS);
      }
    } catch {
      setWorks(INITIAL_CHALU_WORKS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorks();
  }, []);

  const filteredWorks = works.filter((w) => {
    const matchesStatus =
      statusFilter === 'all' ? true : w.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesStatus;

    const matchesQuery =
      w.workName.toLowerCase().includes(q) ||
      w.customerName.toLowerCase().includes(q) ||
      w.machineName.toLowerCase().includes(q) ||
      (w.village && w.village.toLowerCase().includes(q));

    return matchesStatus && matchesQuery;
  });

  const ongoingCount = works.filter((w) => w.status === 'ongoing').length;
  const completedCount = works.filter((w) => w.status === 'completed').length;
  const totalOngoingBalance = works
    .filter((w) => w.status === 'ongoing')
    .reduce((sum, w) => sum + (w.balanceAmount || 0), 0);

  const handleOpenEdit = (item: ChaluWorkItem) => {
    setSelectedWork(item);
    setEditWorkName(item.workName);
    setEditVillage(item.village || '');
    setEditAmount(String(item.totalAmount));
    setEditAdvance(String(item.advanceAmount));
    setEditNotes(item.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedWork) return;
    const tot = parseFloat(editAmount.replace(/,/g, '')) || 0;
    const adv = parseFloat(editAdvance.replace(/,/g, '')) || 0;
    const bal = Math.max(0, tot - adv);

    setEditSaving(true);
    try {
      if (typeof selectedWork.id === 'number') {
        await MachineEntryService.update(selectedWork.id, {
          work_description: editWorkName.trim(),
          location: editVillage.trim(),
          amount: tot,
        });
      }

      setWorks((prev) =>
        prev.map((w) =>
          w.id === selectedWork.id
            ? {
                ...w,
                workName: editWorkName.trim(),
                village: editVillage.trim(),
                totalAmount: tot,
                advanceAmount: adv,
                balanceAmount: bal,
                notes: editNotes.trim(),
              }
            : w
        )
      );

      setIsEditModalOpen(false);
      setToastMsg('काम तपशील अपडेट झाले!');
      setTimeout(() => setToastMsg(''), 2500);
    } catch {
      Alert.alert('त्रुटी', 'काम अपडेट करताना त्रुटी आली.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleStatus = (item: ChaluWorkItem) => {
    const newStatus = item.status === 'ongoing' ? 'completed' : 'ongoing';
    setWorks((prev) =>
      prev.map((w) => (w.id === item.id ? { ...w, status: newStatus } : w))
    );
    setToastMsg(
      newStatus === 'completed'
        ? 'काम पूर्ण म्हणून चिन्हांकित झाले! ✅'
        : 'काम पुन्हा चालू यादीत जोडले गेले.'
    );
    setTimeout(() => setToastMsg(''), 2500);
  };

  const handleDeleteWork = (item: ChaluWorkItem) => {
    Alert.alert('काम हटवा', 'तुम्हाला खरोखर हे काम यादीतून हटवायचे आहे का?', [
      { text: 'नाही', style: 'cancel' },
      {
        text: 'होय, हटवा',
        style: 'destructive',
        onPress: async () => {
          try {
            if (typeof item.id === 'number') {
              await MachineEntryService.delete(item.id);
            }
            setWorks((prev) => prev.filter((w) => w.id !== item.id));
            setToastMsg('काम यशस्वीरित्या हटवले गेले.');
            setTimeout(() => setToastMsg(''), 2500);
          } catch {
            Alert.alert('त्रुटी', 'काम हटवताना त्रुटी आली.');
          }
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

        <Text style={styles.headerTitle}>चालू काम यादी</Text>

        <TouchableOpacity
          style={styles.plusBtn}
          onPress={onNavigateToNavinKam}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Plus size={20} color="#1C1917" strokeWidth={3} />
        </TouchableOpacity>
      </View>

      {/* Main Body */}
      <View style={styles.body}>
        {toastMsg ? (
          <View style={styles.toastBanner}>
            <CheckCircle size={16} color="#15803D" />
            <Text style={styles.toastText}>{toastMsg}</Text>
          </View>
        ) : null}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ग्राहक, मशीन किंवा गावाचे नाव शोधा..."
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Filter Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, statusFilter === 'ongoing' && styles.tabBtnActive]}
            onPress={() => setStatusFilter('ongoing')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabBtnText,
                statusFilter === 'ongoing' && styles.tabBtnTextActive,
              ]}
            >
              चालू कामे ({ongoingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, statusFilter === 'completed' && styles.tabBtnActive]}
            onPress={() => setStatusFilter('completed')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabBtnText,
                statusFilter === 'completed' && styles.tabBtnTextActive,
              ]}
            >
              पूर्ण कामे ({completedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, statusFilter === 'all' && styles.tabBtnActive]}
            onPress={() => setStatusFilter('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabBtnText,
                statusFilter === 'all' && styles.tabBtnTextActive,
              ]}
            >
              सर्व ({works.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Work Cards List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#6B121C" />
            <Text style={styles.loadingText}>कामे लोड होत आहेत...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#6B121C']}
                tintColor="#6B121C"
              />
            }
          >
            {filteredWorks.map((work) => (
              <View key={work.id} style={styles.workCard}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.machineBadge}>
                    <Truck size={14} color="#6B121C" />
                    <Text style={styles.machineBadgeText}>{work.machineName}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      work.status === 'completed'
                        ? styles.statusCompleted
                        : styles.statusOngoing,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        work.status === 'completed'
                          ? styles.statusTextCompleted
                          : styles.statusTextOngoing,
                      ]}
                    >
                      {work.status === 'completed' ? 'काम पूर्ण ✅' : 'काम चालू ⏳'}
                    </Text>
                  </View>
                </View>

                {/* Work Title */}
                <Text style={styles.workTitle}>{work.workName}</Text>

                {/* Customer & Location Details */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailRow}>
                    <User size={14} color="#78350F" />
                    <Text style={styles.detailText}>
                      {work.customerName}
                      {work.customerPhone ? ` (${work.customerPhone})` : ''}
                    </Text>
                  </View>

                  {work.village ? (
                    <View style={styles.detailRow}>
                      <Home size={14} color="#78350F" />
                      <Text style={styles.detailText}>{work.village}</Text>
                    </View>
                  ) : null}

                  <View style={styles.detailRow}>
                    <Calendar size={14} color="#78350F" />
                    <Text style={styles.detailText}>सुरुवात: {work.startDate}</Text>
                  </View>
                </View>

                {/* Financial Summary Strip */}
                <View style={styles.financialStrip}>
                  <View style={styles.financeCol}>
                    <Text style={styles.financeLabel}>एकूण बिल</Text>
                    <Text style={styles.financeValDark}>
                      {formatCurrency(work.totalAmount)}
                    </Text>
                  </View>

                  <View style={styles.financeDivider} />

                  <View style={styles.financeCol}>
                    <Text style={styles.financeLabel}>आगाऊ (जमा)</Text>
                    <Text style={styles.financeValGreen}>
                      {formatCurrency(work.advanceAmount)}
                    </Text>
                  </View>

                  <View style={styles.financeDivider} />

                  <View style={styles.financeCol}>
                    <Text style={styles.financeLabel}>उर्वरित बाकी</Text>
                    <Text
                      style={[
                        styles.financeValDark,
                        work.balanceAmount > 0 && styles.financeValRed,
                      ]}
                    >
                      {formatCurrency(work.balanceAmount)}
                    </Text>
                  </View>
                </View>

                {/* Card Action Buttons */}
                <View style={styles.cardActionsRow}>
                  {/* Mark Completed Toggle */}
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      work.status === 'completed'
                        ? styles.actionReopenBtn
                        : styles.actionCompleteBtn,
                    ]}
                    onPress={() => handleToggleStatus(work)}
                    activeOpacity={0.7}
                  >
                    <Check size={14} color={work.status === 'completed' ? '#4B5563' : '#15803D'} />
                    <Text
                      style={[
                        styles.actionBtnText,
                        work.status === 'completed'
                          ? styles.actionReopenText
                          : styles.actionCompleteText,
                      ]}
                    >
                      {work.status === 'completed' ? 'चालू करा' : 'काम पूर्ण'}
                    </Text>
                  </TouchableOpacity>

                  {/* Edit Button */}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionEditBtn]}
                    onPress={() => handleOpenEdit(work)}
                    activeOpacity={0.7}
                  >
                    <FileText size={14} color="#2563EB" />
                    <Text style={[styles.actionBtnText, styles.actionEditText]}>
                      बदल करा
                    </Text>
                  </TouchableOpacity>

                  {/* Delete Button */}
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionDeleteBtn]}
                    onPress={() => handleDeleteWork(work)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={14} color="#DC2626" />
                    <Text style={[styles.actionBtnText, styles.actionDeleteText]}>
                      हटवा
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {filteredWorks.length === 0 && (
              <View style={styles.emptyContainer}>
                <FileText size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>कोणतेही काम सापडले नाही</Text>
                <Text style={styles.emptySubtitle}>
                  नवीन काम नोंदवण्यासाठी वरील + बटण दाबा
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Bottom Summary Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarCol}>
            <Text style={styles.bottomBarLabel}>चालू कामे संख्या</Text>
            <Text style={styles.bottomBarValue}>{ongoingCount}</Text>
          </View>

          <View style={styles.bottomBarColRight}>
            <Text style={styles.bottomBarLabel}>चालू कामांची एकूण बाकी</Text>
            <Text style={styles.bottomBarValueRed}>
              {formatCurrency(totalOngoingBalance)}
            </Text>
          </View>
        </View>
      </View>

      {/* Edit Work Modal */}
      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>काम तपशील संपादन</Text>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>कामाचे नाव / स्वरूप *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={editWorkName}
                  onChangeText={setEditWorkName}
                  placeholder="उदा. विहीर खोदकाम"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>गाव / ठिकाण</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={editVillage}
                  onChangeText={setEditVillage}
                  placeholder="उदा. पाटोदा"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>एकूण बिल रक्कम (₹) *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  placeholder="उदा. 28000"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>आगाऊ रक्कम (₹)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={editAdvance}
                  onChangeText={setEditAdvance}
                  placeholder="उदा. 5000"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>नोंद / शेरा</Text>
                <TextInput
                  style={[styles.modalTextInput, { minHeight: 60, textAlignVertical: 'top' }]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="उदा. उर्वरित रक्कम काम संपल्यावर..."
                  multiline
                />
              </View>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={handleSaveEdit}
                disabled={editSaving}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimaryBtnText}>
                  {editSaving ? 'जतन होत आहे...' : 'बदल जतन करा'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 14,
    marginTop: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#1F2937',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginTop: 10,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#6B121C',
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  tabBtnTextActive: {
    color: 'white',
    fontWeight: '800',
  },
  loadingBox: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    gap: 12,
  },
  workCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  machineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F2',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  machineBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B121C',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusOngoing: {
    backgroundColor: '#FEF3C7',
  },
  statusCompleted: {
    backgroundColor: '#DCFCE7',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextOngoing: {
    color: '#92400E',
  },
  statusTextCompleted: {
    color: '#166534',
  },
  workTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  detailsGrid: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  financialStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  financeCol: {
    flex: 1,
    alignItems: 'center',
  },
  financeDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E5E7EB',
  },
  financeLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 2,
  },
  financeValDark: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1F2937',
  },
  financeValGreen: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#15803D',
  },
  financeValRed: {
    color: '#DC2626',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
  },
  actionCompleteBtn: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  actionReopenBtn: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  actionEditBtn: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  actionDeleteBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECDD3',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionCompleteText: {
    color: '#15803D',
  },
  actionReopenText: {
    color: '#4B5563',
  },
  actionEditText: {
    color: '#2563EB',
  },
  actionDeleteText: {
    color: '#DC2626',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  bottomBarCol: {
    gap: 2,
  },
  bottomBarColRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  bottomBarLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  bottomBarValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1C1917',
  },
  bottomBarValueRed: {
    fontSize: 16,
    fontWeight: '900',
    color: '#DC2626',
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
});

export default ChaluKamListScreen;
