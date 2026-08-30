import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import tw from 'twrnc';
import { AppHeader } from '../../components/AppHeader';
import { AppInput } from '../../components/AppInput';
import { AppDropdown } from '../../components/AppDropdown';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppModal } from '../../components/AppModal';
import { formatCurrency } from '../../utils/currency';
import { AppDatePicker } from '../../components/AppDatePicker';
import { getTodayFormatted } from '../../utils/date';
import { CustomerService, MachineEntryService, MachineService } from '../../utils/api';
import { colors, radii } from '../../theme';
import {
  CheckCircle,
  Truck,
  ChevronRight,
  X,
  Calendar,
  MapPin,
  User,
} from 'lucide-react-native';

interface MachineEntryScreenProps {
  onBack: () => void;
}

interface MachineSummaryItem {
  machineId: string;
  name: string;
  regNumber?: string;
  totalAmount: number;
  totalHours: number;
  totalTrips: number;
  entriesCount: number;
  entries: any[];
}

export const MachineEntryScreen: React.FC<MachineEntryScreenProps> = ({ onBack }) => {
  const [fromDate, setFromDate] = useState<string>(getTodayFormatted());
  const [toDate, setToDate] = useState<string>(getTodayFormatted());
  const [machinesList, setMachinesList] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [customer, setCustomer] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [hoursOrTrips, setHoursOrTrips] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('रोख');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newMachineName, setNewMachineName] = useState<string>('');
  const [newMachineModel, setNewMachineModel] = useState<string>('');
  const [newMachineReg, setNewMachineReg] = useState<string>('');
  const [newMachineRate, setNewMachineRate] = useState<string>('');

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustLocation, setNewCustLocation] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');

  const handleNewCustPhoneChange = (text: string) => {
    // Allow only digits, max 10
    const digits = text.replace(/[^0-9]/g, '').slice(0, 10);
    setNewCustPhone(digits);
  };

  // Machine Summary & Detail Report State
  const [machineSummaries, setMachineSummaries] = useState<MachineSummaryItem[]>([]);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [selectedMachineReport, setSelectedMachineReport] = useState<MachineSummaryItem | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  const [savedMsg, setSavedMsg] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const getIsoDate = (dStr: string) => {
    if (!dStr) return new Date().toISOString().split('T')[0];
    const parts = dStr.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
    return dStr;
  };

  const loadMachineSummaries = async (currentFromDateStr: string, currentMachines: any[], currentToDateStr?: string) => {
    const isoFromDate = getIsoDate(currentFromDateStr);
    const isoToDate = currentToDateStr ? getIsoDate(currentToDateStr) : isoFromDate;
    setSummaryLoading(true);

    try {
      // Use date-range query if from != to, else single-date
      const filterParams = isoFromDate === isoToDate
        ? { date: isoFromDate }
        : { from_date: isoFromDate, to_date: isoToDate };
      const res = await MachineEntryService.getAll(filterParams);
      const rawEntries = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

      const summariesMap: Record<string, MachineSummaryItem> = {};

      // Initialize list with known machines
      currentMachines.forEach((m: any) => {
        const mId = String(m.id);
        const mName = m.name || 'मशीन';
        const mReg = m.registrationNumber || m.registration_number || '';
        summariesMap[mId] = {
          machineId: mId,
          name: mName,
          regNumber: mReg,
          totalAmount: 0,
          totalHours: 0,
          totalTrips: 0,
          entriesCount: 0,
          entries: [],
        };
      });

      // Aggregate today's entries
      rawEntries.forEach((entry: any) => {
        const mId = String(entry.machineId || entry.machine_id || entry.machine?.id || 'unknown');
        const entryAmt = Number(entry.amount) || 0;
        const entryHoursOrTrips = Number(entry.hoursOrTrips ?? entry.hours_or_trips) || 0;
        const entryUnit = entry.hoursUnit || entry.hours_unit || 'hours';

        if (!summariesMap[mId]) {
          const mName = entry.machineName || entry.machine?.name || 'मशीन';
          summariesMap[mId] = {
            machineId: mId,
            name: mName,
            regNumber: '',
            totalAmount: 0,
            totalHours: 0,
            totalTrips: 0,
            entriesCount: 0,
            entries: [],
          };
        }

        summariesMap[mId].totalAmount += entryAmt;
        summariesMap[mId].entriesCount += 1;
        if (entryUnit === 'trips') {
          summariesMap[mId].totalTrips += entryHoursOrTrips;
        } else {
          summariesMap[mId].totalHours += entryHoursOrTrips;
        }

        summariesMap[mId].entries.push({
          id: entry.id,
          date: entry.date || entry.entry_date || isoFromDate,
          toDate: entry.toDate || null,
          customerName: entry.customerName || entry.customer?.name || 'थेट ग्राहक',
          location: entry.location || '',
          workDescription: entry.workDescription || entry.work_description || 'मशीन काम',
          hoursOrTrips: entryHoursOrTrips,
          hoursUnit: entryUnit,
          amount: entryAmt,
          paymentType: entry.paymentType || entry.payment_type || 'cash',
        });
      });

      const list = Object.values(summariesMap);
      // Sort machines with active work on top
      list.sort((a, b) => b.totalAmount - a.totalAmount);
      setMachineSummaries(list);
    } catch {
      setMachineSummaries([]);
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        MachineService.getAll(),
        CustomerService.getAll(),
      ]);

      const machines = Array.isArray(mRes) ? mRes : Array.isArray(mRes?.data) ? mRes.data : [];
      const customers = Array.isArray(cRes) ? cRes : Array.isArray(cRes?.data) ? cRes.data : [];

      if (machines.length > 0) {
        setMachinesList(machines);
        setSelectedMachine((prev) =>
          prev ? prev : `${machines[0].name} (${machines[0].registrationNumber || machines[0].registration_number || ''})`
        );
      }

      if (customers.length > 0) {
        setCustomersList(customers);
        setCustomer((prev) => (prev ? prev : customers[0].name));
      }

      await loadMachineSummaries(fromDate, machines, toDate);
    } catch {
      setMachinesList([]);
      setCustomersList([]);
      setMachineSummaries([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (machinesList.length > 0) {
      loadMachineSummaries(fromDate, machinesList, toDate);
    }
  }, [fromDate, toDate]);

  const parseDateToObj = (dStr: string) => {
    const parts = dStr.split('/');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    return new Date();
  };

  const startObj = parseDateToObj(fromDate);
  const endObj = parseDateToObj(toDate);
  const diffTime = endObj.getTime() - startObj.getTime();
  const selectedDaysCount = diffTime >= 0 ? Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1 : 1;
  const numericAmountVal = parseFloat(amount.replace(/,/g, '')) || 0;
  const numHoursVal = parseFloat(hoursOrTrips.replace(/[^0-9.]/g, '')) || 0;

  const handleSave = async () => {
    const numericAmt = parseFloat(amount.replace(/,/g, '')) || 0;
    if (numericAmt <= 0) {
      Alert.alert('त्रुटी', 'कृपया योग्य रक्कम टाका.');
      return;
    }

    const isoFromDate = getIsoDate(fromDate);
    const isoToDate = getIsoDate(toDate);

    const matchedMachine = machinesList.find(
      (m: any) =>
        `${m.name} (${m.registrationNumber || m.registration_number || ''})` === selectedMachine ||
        m.name === selectedMachine
    );
    const matchedCustomer = customersList.find((c: any) => c.name === customer);

    const payTypeMap: Record<string, 'cash' | 'online' | 'credit'> = {
      'रोख': 'cash',
      'ऑनलाइन': 'online',
      'उधारी': 'credit',
    };

    const numHours = parseFloat(hoursOrTrips.replace(/[^0-9.]/g, '')) || 0;
    const unit = hoursOrTrips.includes('फेऱ्या') ? 'trips' : 'hours';

    const baseDescription = description.trim();

    setSaving(true);
    try {
      if (matchedMachine?.id) {
        await MachineEntryService.create({
          machine_id: matchedMachine.id,
          customer_id: matchedCustomer?.id || null,
          entry_date: isoFromDate,
          to_date: isoFromDate !== isoToDate ? isoToDate : null, // Backend splits across all days
          location,
          work_description: baseDescription || undefined,
          hours_or_trips: numHours || undefined,
          hours_unit: unit,
          amount: numericAmt,
          payment_type: payTypeMap[paymentType] || 'cash',
        });
      }

      // Reset Form fields
      setLocation('');
      setDescription('');
      setHoursOrTrips('');
      setAmount('');

      if (selectedDaysCount > 1) {
        const perDayStr = formatCurrency(Math.round(numericAmt / selectedDaysCount));
        setSavedMsg(`मशीन नोंद ${selectedDaysCount} दिवसांमध्ये यशस्वीरित्या विभागून सेव्ह झाली (${perDayStr}/दिवस)!`);
      } else {
        setSavedMsg('मशीन नोंद यशस्वीरित्या सेव्ह झाली!');
      }

      setTimeout(() => setSavedMsg(''), 4000);

      // Reload machine summaries
      await loadMachineSummaries(fromDate, machinesList, toDate);
    } catch {
      Alert.alert('त्रुटी', 'नोंद सेव्ह करताना त्रुटी आली.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMachine = async () => {
    if (!newMachineName.trim() || !newMachineReg.trim()) {
      Alert.alert('त्रुटी', 'कृपया मशीनचे नाव व नंबर टाका');
      return;
    }

    try {
      const saved = await MachineService.create({
        name: newMachineName.trim(),
        model_number: newMachineModel.trim() || undefined,
        registration_number: newMachineReg.trim(),
        hourly_rate: parseFloat(newMachineRate) || undefined,
      });

      const newMachine = saved?.id
        ? saved
        : {
            id: `m_${Date.now()}`,
            name: newMachineName.trim(),
            model_number: newMachineModel.trim() || '',
            registrationNumber: newMachineReg.trim(),
            hourly_rate: parseFloat(newMachineRate) || 0,
          };

      const label = `${newMachine.name} (${newMachine.registrationNumber || newMachine.registration_number || ''})`;
      setMachinesList((prev: any[]) => [...prev, newMachine]);
      setSelectedMachine(label);

      setNewMachineName('');
      setNewMachineModel('');
      setNewMachineReg('');
      setNewMachineRate('');
      setIsModalOpen(false);

      await loadMachineSummaries(fromDate, [...machinesList, newMachine], toDate);
    } catch {
      Alert.alert('त्रुटी', 'मशीन जोडताना समस्या आली.');
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustName.trim()) {
      Alert.alert('त्रुटी', 'कृपया ग्राहकाचे नाव टाका');
      return;
    }
    if (newCustPhone && newCustPhone.length !== 10) {
      Alert.alert('त्रुटी', 'मोबाईल नंबर बरोबर नाही. कृपया 10 अंकी नंबर टाका.');
      return;
    }

    try {
      const saved = await CustomerService.create({
        name: newCustName.trim(),
        location: newCustLocation.trim() || undefined,
        phone: newCustPhone.trim() || undefined,
      });

      const newCust = saved?.id
        ? saved
        : {
            id: `c_${Date.now()}`,
            name: newCustName.trim(),
            location: newCustLocation.trim() || undefined,
            phone: newCustPhone.trim() || undefined,
          };

      setCustomersList((prev: any[]) => [...prev, newCust]);
      setCustomer(newCust.name);

      setNewCustName('');
      setNewCustLocation('');
      setNewCustPhone('');
      setIsCustomerModalOpen(false);
    } catch {
      Alert.alert('त्रुटी', 'ग्राहक जोडताना समस्या आली.');
    }
  };

  const openMachineReport = (item: MachineSummaryItem) => {
    setSelectedMachineReport(item);
    setShowReportModal(true);
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        title="मशीन नोंद"
        showBack={true}
        onBackPress={onBack}
        rightActionIcon="plus"
        onRightActionPress={() => setIsModalOpen(true)}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {savedMsg ? (
          <View style={styles.successBanner}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={styles.successBannerText}>{savedMsg}</Text>
          </View>
        ) : null}

        {/* Form */}
        <AppCard style={styles.formCard}>
          <View style={tw`flex flex-row gap-3`}>
            <View style={tw`flex-1`}>
              <AppDatePicker
                label="पासून तारीख"
                value={fromDate}
                onChange={(newFrom) => {
                  setFromDate(newFrom);
                  const fromIso = getIsoDate(newFrom);
                  const toIso = getIsoDate(toDate);
                  if (toIso < fromIso) {
                    setToDate(newFrom);
                  }
                }}
              />
            </View>
            <View style={tw`flex-1`}>
              <AppDatePicker
                label="पर्यंत तारीख"
                value={toDate}
                onChange={setToDate}
              />
            </View>
          </View>

          <AppDropdown
            label="मशीन निवडा"
            value={selectedMachine}
            onChangeText={setSelectedMachine}
            placeholder="मशीन निवडा..."
            options={machinesList.map((m: any) => ({
              label: `${m.name} (${m.registrationNumber || m.registration_number || ''})`,
              value: `${m.name} (${m.registrationNumber || m.registration_number || ''})`,
            }))}
            footerActionLabel="+ नवीन मशीन नोंदवा"
            onFooterAction={() => setIsModalOpen(true)}
          />

          <AppDropdown
            label="ग्राहक"
            value={customer}
            onChangeText={setCustomer}
            placeholder="ग्राहक निवडा..."
            options={customersList.map((c: any) => ({
              label: c.location ? `${c.name} (${c.location})` : c.name,
              value: c.name,
            }))}
            footerActionLabel="+ नवीन ग्राहक नोंदवा"
            onFooterAction={() => setIsCustomerModalOpen(true)}
          />

          <AppInput
            label="कामाचे ठिकाण"
            value={location}
            onChangeText={setLocation}
            placeholder="उदा. गोकुळ शिरगाव"
          />
          <AppInput
            label="कामाचे वर्णन"
            value={description}
            onChangeText={setDescription}
            placeholder="उदा. खाड्डा खणकाम"
          />
          <AppInput
            label="तास / फेऱ्या"
            value={hoursOrTrips}
            onChangeText={setHoursOrTrips}
            placeholder="उदा. 8 तास किंवा 12 फेऱ्या"
          />
          <AppInput
            label="रक्कम (₹)"
            value={amount}
            onChangeText={setAmount}
            placeholder="उदा. 12000"
            keyboardType="numeric"
          />

          <AppDropdown
            label="पेमेंट प्रकार"
            value={paymentType}
            onChangeText={setPaymentType}
            options={[
              { label: 'रोख (Cash)', value: 'रोख' },
              { label: 'ऑनलाइन (GPay/PhonePe)', value: 'ऑनलाइन' },
              { label: 'उधारी (Credit)', value: 'उधारी' },
            ]}
          />

          {/* Multi-Day Split Indicator Banner */}
          {selectedDaysCount > 1 && (
            <View style={styles.splitInfoBanner}>
              <View style={tw`flex flex-row items-center gap-2 mb-2`}>
                <Calendar size={16} color={colors.primary} />
                <Text style={styles.splitInfoTitle}>
                  {selectedDaysCount} दिवस निवडले ({fromDate} ते {toDate})
                </Text>
              </View>

              <View style={styles.splitInfoRow}>
                <Text style={styles.splitInfoLabel}>दररोज विभागणी रक्कम:</Text>
                <Text style={styles.splitInfoValue}>
                  {numericAmountVal > 0
                    ? `${formatCurrency(Math.round(numericAmountVal / selectedDaysCount))} / दिवस`
                    : 'रक्कम प्रविष्ट करा'}
                </Text>
              </View>

              {numHoursVal > 0 ? (
                <View style={styles.splitInfoRow}>
                  <Text style={styles.splitInfoLabel}>
                    दररोज {hoursOrTrips.includes('फेऱ्या') ? 'फेऱ्या' : 'तास'}:
                  </Text>
                  <Text style={styles.splitInfoValue}>
                    {(numHoursVal / selectedDaysCount).toFixed(1)}{' '}
                    {hoursOrTrips.includes('फेऱ्या') ? 'फेऱ्या/दिवस' : 'तास/दिवस'}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.splitInfoNote}>
                💡 नोंद सेव्ह केल्यावर ही रक्कम आपोआप प्रत्येक दिवसाच्या हिशोबात समान विभागली जाईल.
              </Text>
            </View>
          )}

          <View style={styles.btnWrapper}>
            <AppButton
              title={
                saving
                  ? 'सेव्ह होत आहे...'
                  : selectedDaysCount > 1
                  ? `${selectedDaysCount} दिवसांत विभागून सेव्ह करा`
                  : 'सेव्ह करा'
              }
              onPress={handleSave}
              variant="primary"
            />
          </View>
        </AppCard>

        {/* Machine Summary Section (CLICKABLE FOR DETAILED REPORT MODAL) */}
        <View style={styles.summaryContainer}>
          <View style={tw`flex flex-row items-center justify-between px-1`}>
            <Text style={styles.summaryTitle}>मशीन सारांश</Text>
            <Text style={tw`text-[11px] font-semibold text-[${colors.textTertiary}]`}>
              {fromDate === toDate ? fromDate : `${fromDate} ते ${toDate}`}
            </Text>
          </View>

          <AppCard variant="elevated" style={styles.summaryCard}>
            {summaryLoading ? (
              <View style={tw`py-6 items-center justify-center`}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={tw`text-xs text-[${colors.textTertiary}] mt-2`}>मशीन सारांश लोड होत आहे...</Text>
              </View>
            ) : machineSummaries.length === 0 ? (
              <Text style={tw`py-4 text-center text-xs text-[${colors.textMuted}] font-semibold`}>
                आजसाठी कोणतीही मशीन नोंद उपलब्ध नाही
              </Text>
            ) : (
              machineSummaries.map((item, index) => {
                const hoursText = item.totalHours > 0 ? `${item.totalHours} तास` : '';
                const tripsText = item.totalTrips > 0 ? `${item.totalTrips} फेऱ्या` : '';
                const workInfo = [hoursText, tripsText].filter(Boolean).join(' • ');

                return (
                  <TouchableOpacity
                    key={item.machineId || index}
                    activeOpacity={0.7}
                    onPress={() => openMachineReport(item)}
                    style={[
                      styles.summaryRowTouchable,
                      index < machineSummaries.length - 1 && styles.summaryRowBorder,
                    ]}
                  >
                    <View style={tw`flex flex-row items-center gap-3 flex-1`}>
                      <View style={styles.machineIconBox}>
                        <Truck size={18} color={colors.primary} />
                      </View>
                      <View style={tw`flex-1`}>
                        <Text style={styles.summaryLabel} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={tw`text-[11px] text-[${colors.textTertiary}] mt-0.5`}>
                          {workInfo || (item.entriesCount > 0 ? `${item.entriesCount} नोंदी` : 'काम नोंद नाही')}
                        </Text>
                      </View>
                    </View>

                    <View style={tw`flex flex-row items-center gap-2`}>
                      <View style={tw`items-end`}>
                        <Text style={[styles.summaryAmount, { color: item.totalAmount > 0 ? colors.earnings : colors.textTertiary }]}>
                          {formatCurrency(item.totalAmount)}
                        </Text>
                        <Text style={styles.tapReportBadge}>
                          अहवाल पहा ›
                        </Text>
                      </View>
                      <ChevronRight size={14} color={colors.textTertiary} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </AppCard>
        </View>
      </ScrollView>

      {/* DETAILED MACHINE REPORT MODAL */}
      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={tw`flex flex-row items-center gap-2.5`}>
                <View style={styles.reportIconBadge}>
                  <Truck size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.reportModalTitle}>
                    {selectedMachineReport?.name || 'मशीन काम अहवाल'}
                  </Text>
                  <Text style={styles.reportModalSubtitle}>
                    {selectedMachineReport?.regNumber ? `${selectedMachineReport.regNumber} • ` : ''}{fromDate === toDate ? fromDate : `${fromDate} ते ${toDate}`}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowReportModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Machine Summary Banner */}
            <View style={styles.machineHeroBanner}>
              <View style={tw`flex flex-row justify-between items-center w-full`}>
                <View>
                  <Text style={styles.machineHeroLabel}>आजची एकूण कमाई</Text>
                  <Text style={styles.machineHeroAmount}>
                    {formatCurrency(selectedMachineReport?.totalAmount || 0)}
                  </Text>
                </View>
                <View style={tw`items-end`}>
                  <Text style={styles.machineHeroLabel}>एकूण काम वेळ</Text>
                  <Text style={styles.machineHeroWorkTime}>
                    {selectedMachineReport?.totalHours ? `${selectedMachineReport.totalHours} तास` : ''}
                    {selectedMachineReport?.totalHours && selectedMachineReport?.totalTrips ? ' • ' : ''}
                    {selectedMachineReport?.totalTrips ? `${selectedMachineReport.totalTrips} फेऱ्या` : ''}
                    {!selectedMachineReport?.totalHours && !selectedMachineReport?.totalTrips ? '0 तास' : ''}
                  </Text>
                </View>
              </View>
              <View style={tw`w-full pt-2 mt-2 border-t border-green-200 flex flex-row justify-between items-center`}>
                <Text style={tw`text-[11px] font-bold text-green-800`}>
                  एकूण कामाच्या नोंदी (Entries):
                </Text>
                <Text style={tw`text-[11px] font-extrabold text-green-900`}>
                  {selectedMachineReport?.entries.length || 0} कामे
                </Text>
              </View>
            </View>

            {/* Itemized Entries List */}
            <Text style={tw`text-xs font-bold text-gray-700 px-1 pt-1`}>कामाचा सविस्तर तपशील:</Text>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={true}>
              {!selectedMachineReport?.entries || selectedMachineReport.entries.length === 0 ? (
                <View style={tw`py-10 items-center justify-center`}>
                  <Text style={tw`text-sm font-semibold text-[${colors.textMuted}]`}>
                    या मशीनसाठी आज कोणतीही नोंद उपलब्ध नाही
                  </Text>
                </View>
              ) : (
                selectedMachineReport.entries.map((entry, idx) => (
                  <View key={entry.id || idx} style={styles.entryCard}>
                    <View style={tw`flex flex-row justify-between items-start`}>
                      <View style={tw`flex-1 pr-2`}>
                        {/* Customer */}
                        <View style={tw`flex flex-row items-center gap-1.5`}>
                          <User size={13} color={colors.primary} />
                          <Text style={styles.entryCustomerName}>
                            {entry.customerName}
                          </Text>
                        </View>

                        {/* Work description & Location */}
                        <Text style={styles.entryWorkDesc}>
                          {entry.workDescription}
                        </Text>

                        {/* Date Range (if multi-day) */}
                        {entry.toDate && entry.toDate !== entry.date ? (
                          <View style={tw`flex flex-row items-center gap-1 mt-1`}>
                            <Calendar size={11} color={colors.primary} />
                            <Text style={tw`text-xs font-semibold text-[${colors.primary}]`}>
                              {entry.date} ते {entry.toDate}
                            </Text>
                          </View>
                        ) : null}

                        {entry.location ? (
                          <View style={tw`flex flex-row items-center gap-1 mt-1`}>
                            <MapPin size={11} color={colors.textTertiary} />
                            <Text style={tw`text-xs text-[${colors.textTertiary}]`}>
                              {entry.location}
                            </Text>
                          </View>
                        ) : null}

                        {/* Hours / Trips Badge */}
                        <View style={tw`flex flex-row items-center gap-2 mt-2`}>
                          <View style={styles.hoursBadge}>
                            <Text style={styles.hoursBadgeText}>
                              {entry.hoursOrTrips} {entry.hoursUnit === 'trips' ? 'फेऱ्या' : 'तास'}
                            </Text>
                          </View>
                          <View style={styles.payBadge}>
                            <Text style={styles.payBadgeText}>
                              {entry.paymentType === 'online'
                                ? 'Online'
                                : entry.paymentType === 'credit' || entry.paymentType === 'उधारी'
                                ? 'उधारी (Credit)'
                                : 'रोख (Cash)'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Amount */}
                      <View style={tw`items-end`}>
                        <Text style={styles.entryAmount}>
                          {formatCurrency(entry.amount)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Modal Tally Verification Footer */}
            <View style={styles.modalFooter}>
              <View style={tw`flex flex-row justify-between items-center bg-gray-50 p-3 rounded-xl mb-2 border border-gray-200`}>
                <Text style={tw`text-xs font-bold text-gray-700`}>मशीन एकूण बेरीज (Tally):</Text>
                <Text style={tw`text-sm font-extrabold text-green-700`}>
                  {formatCurrency(selectedMachineReport?.totalAmount || 0)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowReportModal(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseButtonText}>बंद करा (Close)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Machine Modal */}
      <AppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="नवीन मशीन जोडा">
        <View style={styles.modalContent}>
          <AppInput
            label="मशीनचे नाव"
            value={newMachineName}
            onChangeText={setNewMachineName}
            placeholder="उदा. JCB 3DX"
            required
          />
          <AppInput
            label="मॉडेल"
            value={newMachineModel}
            onChangeText={setNewMachineModel}
            placeholder="उदा. 3DX Super"
          />
          <AppInput
            label="नोंदणी क्रमांक"
            value={newMachineReg}
            onChangeText={setNewMachineReg}
            placeholder="उदा. MH 09 AB 1234"
            required
          />
          <AppInput
            label="तास दर (₹/तास)"
            value={newMachineRate}
            onChangeText={setNewMachineRate}
            placeholder="उदा. 1500"
            keyboardType="numeric"
          />
          <View style={styles.modalBtn}>
            <AppButton title="सेव्ह करा" onPress={handleAddMachine} variant="primary" />
          </View>
        </View>
      </AppModal>

      {/* Add Customer Modal */}
      <AppModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="नवीन ग्राहक जोडा">
        <View style={styles.modalContent}>
          <AppInput
            label="ग्राहकाचे नाव"
            value={newCustName}
            onChangeText={setNewCustName}
            placeholder="उदा. सचिन पाटील"
            required
          />
          <AppInput
            label="गाव / ठिकाण"
            value={newCustLocation}
            onChangeText={setNewCustLocation}
            placeholder="उदा. इचलकरंजी"
          />
          <AppInput
            label={`फोन नंबर${newCustPhone.length > 0 ? ` (${newCustPhone.length}/10)` : ''}`}
            value={newCustPhone}
            onChangeText={handleNewCustPhoneChange}
            placeholder="उदा. 9876543210"
            keyboardType="phone-pad"
            maxLength={10}
          />
          <View style={styles.modalBtn}>
            <AppButton title="सेव्ह करा" onPress={handleAddCustomer} variant="primary" />
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
  successBanner: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successBannerText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    padding: 16,
    gap: 14,
  },
  btnWrapper: {
    paddingTop: 4,
  },
  summaryContainer: {
    gap: 8,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryCard: {
    padding: 8,
    gap: 4,
  },
  summaryRowTouchable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  machineIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  tapReportBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  modalContent: {
    gap: 14,
  },
  modalBtn: {
    paddingTop: 4,
  },

  /* Report Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
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
    borderBottomColor: colors.borderLight,
  },
  reportIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  reportModalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
  },
  machineHeroBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
  },
  machineHeroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 2,
  },
  machineHeroAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#16A34A',
  },
  machineHeroWorkTime: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalScrollBody: {
    maxHeight: 340,
  },
  entryCard: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  entryCustomerName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  entryWorkDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  hoursBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  hoursBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  payBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  payBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  entryAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.earnings,
  },
  modalFooter: {
    paddingTop: 8,
  },
  modalCloseButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  splitInfoBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  splitInfoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  splitInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  splitInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78350F',
  },
  splitInfoValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  splitInfoNote: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#B45309',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

export default MachineEntryScreen;
