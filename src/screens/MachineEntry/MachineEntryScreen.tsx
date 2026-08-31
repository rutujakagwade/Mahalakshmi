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
  TextInput,
} from 'react-native';
import tw from 'twrnc';
import { formatCurrency } from '../../utils/currency';
import { AppDatePicker } from '../../components/AppDatePicker';
import { AppDropdown } from '../../components/AppDropdown';
import { getTodayFormatted } from '../../utils/date';
import { CustomerService, MachineEntryService, MachineService } from '../../utils/api';
import { colors } from '../../theme';
import {
  CheckCircle,
  Truck,
  ChevronRight,
  X,
  Calendar as CalendarIcon,
  MapPin,
  User,
  IndianRupee,
  Clock,
  CreditCard,
  FileText,
  ArrowLeft,
  Plus,
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
  const [paymentType, setPaymentType] = useState<'cash' | 'online' | 'credit'>('cash');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newMachineName, setNewMachineName] = useState<string>('');
  const [newMachineModel, setNewMachineModel] = useState<string>('');
  const [newMachineReg, setNewMachineReg] = useState<string>('');
  const [newMachineRate, setNewMachineRate] = useState<string>('');

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustLocation, setNewCustLocation] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');

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
      const filterParams =
        isoFromDate === isoToDate
          ? { date: isoFromDate }
          : { from_date: isoFromDate, to_date: isoToDate };
      const res = await MachineEntryService.getAll(filterParams);
      const rawEntries = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

      const summariesMap: Record<string, MachineSummaryItem> = {};

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
          to_date: isoFromDate !== isoToDate ? isoToDate : null,
          location,
          work_description: baseDescription || undefined,
          hours_or_trips: numHours || undefined,
          hours_unit: unit,
          amount: numericAmt,
          payment_type: paymentType,
        });
      }

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
      Alert.alert('त्रुटी', 'मोबाईल नंबर बरोबर नाही. कृपया १० अंकी नंबर टाका.');
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>मशीन नोंद</Text>
        <TouchableOpacity
          style={styles.saveHeaderBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveHeaderBtnText}>{saving ? '...' : 'जतन करा'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {savedMsg ? (
          <View style={styles.successBanner}>
            <CheckCircle size={16} color="#15803D" />
            <Text style={styles.successText}>{savedMsg}</Text>
          </View>
        ) : null}

        {/* तारीख Range */}
        <View style={styles.dateRangeBox}>
          <View style={styles.dateCol}>
            <Text style={styles.dateColLabel}>पासून तारीख <Text style={styles.requiredStar}>*</Text></Text>
            <AppDatePicker
              label=""
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
          <View style={styles.dateCol}>
            <Text style={styles.dateColLabel}>पर्यंत तारीख <Text style={styles.requiredStar}>*</Text></Text>
            <AppDatePicker label="" value={toDate} onChange={setToDate} />
          </View>
        </View>

        {/* मशीन निवडा */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <Truck size={18} color="#78350F" />
            <Text style={styles.labelText}>मशीन <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <View style={styles.dropdownWrapper}>
            <AppDropdown
              label=""
              value={selectedMachine}
              onChangeText={setSelectedMachine}
              placeholder="मशीन निवडा..."
              options={machinesList.map((m: any) => ({
                label: `${m.name} (${m.registrationNumber || m.registration_number || ''})`,
                value: `${m.name} (${m.registrationNumber || m.registration_number || ''})`,
              }))}
              footerActionLabel="+ नवीन मशीन जोडा"
              onFooterAction={() => setIsModalOpen(true)}
            />
          </View>
        </View>

        {/* ग्राहक निवडा */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <User size={18} color="#78350F" />
            <Text style={styles.labelText}>ग्राहक <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <View style={styles.dropdownWrapper}>
            <AppDropdown
              label=""
              value={customer}
              onChangeText={setCustomer}
              placeholder="ग्राहक निवडा..."
              options={customersList.map((c: any) => ({
                label: c.location ? `${c.name} (${c.location})` : c.name,
                value: c.name,
              }))}
              footerActionLabel="+ नवीन ग्राहक जोडा"
              onFooterAction={() => setIsCustomerModalOpen(true)}
            />
          </View>
        </View>

        {/* कामाचे ठिकाण */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <MapPin size={18} color="#78350F" />
            <Text style={styles.labelText}>कामाचे ठिकाण</Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={location}
            onChangeText={setLocation}
            placeholder="उदा. गोकुळ शिरगाव"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* कामाचे वर्णन */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <FileText size={18} color="#78350F" />
            <Text style={styles.labelText}>कामाचे वर्णन</Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={description}
            onChangeText={setDescription}
            placeholder="उदा. खाड्डा खणकाम"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* तास / फेऱ्या */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <Clock size={18} color="#78350F" />
            <Text style={styles.labelText}>तास / फेऱ्या</Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={hoursOrTrips}
            onChangeText={setHoursOrTrips}
            placeholder="उदा. 8 तास किंवा 12 फेऱ्या"
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
            value={amount}
            onChangeText={setAmount}
            placeholder="उदा. 12000"
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
              onPress={() => setPaymentType('cash')}
              activeOpacity={0.7}
            >
              <View style={[styles.outerRadio, paymentType === 'cash' && styles.outerRadioActive]}>
                {paymentType === 'cash' && <View style={styles.innerRadioDot} />}
              </View>
              <Text style={styles.radioText}>रोख</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioItem}
              onPress={() => setPaymentType('online')}
              activeOpacity={0.7}
            >
              <View style={[styles.outerRadio, paymentType === 'online' && styles.outerRadioActive]}>
                {paymentType === 'online' && <View style={styles.innerRadioDot} />}
              </View>
              <Text style={styles.radioText}>ऑनलाइन</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioItem}
              onPress={() => setPaymentType('credit')}
              activeOpacity={0.7}
            >
              <View style={[styles.outerRadio, paymentType === 'credit' && styles.outerRadioActive]}>
                {paymentType === 'credit' && <View style={styles.innerRadioDot} />}
              </View>
              <Text style={styles.radioText}>उधारी</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Multi-Day Split Indicator Banner */}
        {selectedDaysCount > 1 && (
          <View style={styles.splitCard}>
            <View style={styles.splitHeaderRow}>
              <CalendarIcon size={16} color="#854D0E" />
              <Text style={styles.splitCardTitle}>
                {selectedDaysCount} दिवस निवडले ({fromDate} ते {toDate})
              </Text>
            </View>
            <View style={styles.splitInfoRow}>
              <Text style={styles.splitInfoLabel}>दररोज विभागणी रक्कम:</Text>
              <Text style={styles.splitInfoValue}>
                {numericAmountVal > 0
                  ? `${formatCurrency(Math.round(numericAmountVal / selectedDaysCount))} / दिवस`
                  : 'रक्कम टाका'}
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
            <Text style={styles.splitNote}>
              💡 नोंद सेव्ह केल्यावर ही रक्कम आपोआप प्रत्येक दिवसाच्या हिशोबात समान विभागली जाईल.
            </Text>
          </View>
        )}

        {/* Bottom Save Button */}
        <View style={styles.bottomBtnWrapper}>
          <TouchableOpacity
            style={styles.bottomSaveBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.bottomSaveBtnText}>
              {saving
                ? 'जतन होत आहे...'
                : selectedDaysCount > 1
                ? `${selectedDaysCount} दिवसांत विभागून सेव्ह करा`
                : 'मशीन नोंद जतन करा'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Machine Summary Section */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryTitle}>मशीन सारांश</Text>
            <Text style={styles.summaryDate}>
              {fromDate === toDate ? fromDate : `${fromDate} ते ${toDate}`}
            </Text>
          </View>

          <View style={styles.summaryCardBox}>
            {summaryLoading ? (
              <View style={tw`py-6 items-center justify-center`}>
                <ActivityIndicator size="small" color="#6B121C" />
                <Text style={tw`text-xs text-gray-500 mt-2`}>मशीन सारांश लोड होत आहे...</Text>
              </View>
            ) : machineSummaries.length === 0 ? (
              <Text style={tw`py-4 text-center text-xs text-gray-400 font-semibold`}>
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
                        <Truck size={18} color="#6B121C" />
                      </View>
                      <View style={tw`flex-1`}>
                        <Text style={styles.summaryLabel} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={tw`text-[11px] text-gray-500 mt-0.5`}>
                          {workInfo || (item.entriesCount > 0 ? `${item.entriesCount} नोंदी` : 'काम नोंद नाही')}
                        </Text>
                      </View>
                    </View>

                    <View style={tw`flex flex-row items-center gap-2`}>
                      <View style={tw`items-end`}>
                        <Text
                          style={[
                            styles.summaryAmount,
                            { color: item.totalAmount > 0 ? '#15803D' : '#6B7280' },
                          ]}
                        >
                          {formatCurrency(item.totalAmount)}
                        </Text>
                        <Text style={styles.tapReportBadge}>अहवाल पहा ›</Text>
                      </View>
                      <ChevronRight size={14} color="#9CA3AF" />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
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
            <View style={styles.modalHeader}>
              <View style={tw`flex flex-row items-center gap-2.5`}>
                <View style={styles.reportIconBadge}>
                  <Truck size={20} color="#6B121C" />
                </View>
                <View>
                  <Text style={styles.reportModalTitle}>
                    {selectedMachineReport?.name || 'मशीन काम अहवाल'}
                  </Text>
                  <Text style={styles.reportModalSubtitle}>
                    {selectedMachineReport?.regNumber ? `${selectedMachineReport.regNumber} • ` : ''}
                    {fromDate === toDate ? fromDate : `${fromDate} ते ${toDate}`}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowReportModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

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
                  एकूण कामाच्या नोंदी:
                </Text>
                <Text style={tw`text-[11px] font-extrabold text-green-900`}>
                  {selectedMachineReport?.entries.length || 0} कामे
                </Text>
              </View>
            </View>

            <Text style={tw`text-xs font-bold text-gray-700 px-1 pt-1`}>कामाचा सविस्तर तपशील:</Text>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={true}>
              {!selectedMachineReport?.entries || selectedMachineReport.entries.length === 0 ? (
                <View style={tw`py-10 items-center justify-center`}>
                  <Text style={tw`text-sm font-semibold text-gray-400`}>
                    या मशीनसाठी कोणतीही नोंद उपलब्ध नाही
                  </Text>
                </View>
              ) : (
                selectedMachineReport.entries.map((entry, idx) => (
                  <View key={entry.id || idx} style={styles.entryCard}>
                    <View style={tw`flex flex-row justify-between items-start`}>
                      <View style={tw`flex-1 pr-2`}>
                        <View style={tw`flex flex-row items-center gap-1.5`}>
                          <User size={13} color="#6B121C" />
                          <Text style={styles.entryCustomerName}>{entry.customerName}</Text>
                        </View>
                        <Text style={styles.entryWorkDesc}>{entry.workDescription}</Text>
                        {entry.location ? (
                          <View style={tw`flex flex-row items-center gap-1 mt-1`}>
                            <MapPin size={11} color="#6B7280" />
                            <Text style={tw`text-xs text-gray-500`}>{entry.location}</Text>
                          </View>
                        ) : null}
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
                                : entry.paymentType === 'credit'
                                ? 'उधारी'
                                : 'रोख'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.entryAmount}>{formatCurrency(entry.amount)}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowReportModal(false)}
              style={styles.modalCloseButton}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseButtonText}>बंद करा (Close)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Machine Modal */}
      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.centerModalBox}>
            <View style={styles.centerModalHeader}>
              <Text style={styles.centerModalTitle}>नवीन मशीन जोडा</Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.closeRoundBtn}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={tw`gap-3`}>
              <View>
                <Text style={styles.modalFieldLabel}>मशीनचे नाव *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMachineName}
                  onChangeText={setNewMachineName}
                  placeholder="उदा. JCB 3DX"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View>
                <Text style={styles.modalFieldLabel}>मॉडेल</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMachineModel}
                  onChangeText={setNewMachineModel}
                  placeholder="उदा. 3DX Super"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View>
                <Text style={styles.modalFieldLabel}>नोंदणी क्रमांक (गाडी नंबर) *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMachineReg}
                  onChangeText={setNewMachineReg}
                  placeholder="उदा. MH-09-AB-1234"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                />
              </View>
              <View>
                <Text style={styles.modalFieldLabel}>प्रति तास दर (₹)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newMachineRate}
                  onChangeText={setNewMachineRate}
                  placeholder="उदा. 1200"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleAddMachine}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSubmitBtnText}>मशीन जतन करा</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        visible={isCustomerModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsCustomerModalOpen(false)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.centerModalBox}>
            <View style={styles.centerModalHeader}>
              <Text style={styles.centerModalTitle}>नवीन ग्राहक जोडा</Text>
              <TouchableOpacity onPress={() => setIsCustomerModalOpen(false)} style={styles.closeRoundBtn}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={tw`gap-3`}>
              <View>
                <Text style={styles.modalFieldLabel}>ग्राहकाचे नाव *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newCustName}
                  onChangeText={setNewCustName}
                  placeholder="उदा. संतोष पाटील"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View>
                <Text style={styles.modalFieldLabel}>गाव / ठिकाण</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newCustLocation}
                  onChangeText={setNewCustLocation}
                  placeholder="उदा. गोकुळ शिरगाव"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View>
                <Text style={styles.modalFieldLabel}>मोबाईल नंबर</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newCustPhone}
                  onChangeText={(t) => setNewCustPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleAddCustomer}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSubmitBtnText}>ग्राहक जतन करा</Text>
            </TouchableOpacity>
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
  dateRangeBox: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCol: {
    flex: 1,
  },
  dateColLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 4,
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
    width: '38%',
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
  dropdownWrapper: {
    flex: 1,
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
  splitCard: {
    backgroundColor: '#FEF9C3',
    borderWidth: 1.5,
    borderColor: '#FDE047',
    borderRadius: 14,
    padding: 14,
  },
  splitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  splitCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#854D0E',
  },
  splitInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  splitInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#713F12',
  },
  splitInfoValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#854D0E',
  },
  splitNote: {
    fontSize: 11,
    fontWeight: '500',
    color: '#854D0E',
    marginTop: 6,
    fontStyle: 'italic',
  },
  bottomBtnWrapper: {
    marginTop: 6,
  },
  bottomSaveBtn: {
    backgroundColor: '#6B121C',
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
    marginTop: 12,
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
  summaryCardBox: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 8,
  },
  summaryRowTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  machineIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: '900',
  },
  tapReportBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B121C',
    marginTop: 2,
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
  reportIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportModalTitle: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  reportModalSubtitle: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  modalCloseBtn: { padding: 6, borderRadius: 20, backgroundColor: '#F3F4F6' },
  machineHeroBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
  },
  machineHeroLabel: { fontSize: 11, fontWeight: '700', color: '#15803D', marginBottom: 2 },
  machineHeroAmount: { fontSize: 20, fontWeight: '900', color: '#16A34A' },
  machineHeroWorkTime: { fontSize: 14, fontWeight: '800', color: '#166534' },
  modalScrollBody: { maxHeight: 320 },
  entryCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  entryCustomerName: { fontSize: 13, fontWeight: '800', color: '#1F2937' },
  entryWorkDesc: { fontSize: 12, fontWeight: '600', color: '#4B5563', marginTop: 2 },
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
  entryAmount: { fontSize: 14, fontWeight: '900', color: '#16A34A' },
  modalCloseButton: {
    backgroundColor: '#6B121C',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCloseButtonText: { fontSize: 14, fontWeight: '800', color: 'white' },
  // Center Modals
  centerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  centerModalBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    gap: 14,
    elevation: 5,
  },
  centerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  centerModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  closeRoundBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#1F2937',
  },
  modalSubmitBtn: {
    backgroundColor: '#6B121C',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalSubmitBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default MachineEntryScreen;
