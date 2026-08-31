import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import tw from 'twrnc';
import { AppDatePicker } from '../../components/AppDatePicker';
import { AppDropdown } from '../../components/AppDropdown';
import { getTodayFormatted } from '../../utils/date';
import { formatCurrency } from '../../utils/currency';
import { CustomerService, MachineService, MachineEntryService, DailyLedgerService } from '../../utils/api';
import {
  FileText,
  User,
  Home,
  Plus,
  IndianRupee,
  Calendar as CalendarIcon,
  StickyNote,
  CheckCircle,
  ArrowLeft,
  Truck,
  Clock,
  CreditCard,
  X,
} from 'lucide-react-native';

interface NavinKamFormProps {
  onBack: () => void;
  onNavigateToChaluKam?: () => void;
}

export const NavinKamForm: React.FC<NavinKamFormProps> = ({
  onBack,
  onNavigateToChaluKam,
}) => {
  // Lists for dropdowns
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [machinesList, setMachinesList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Form Fields
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [workName, setWorkName] = useState<string>('');
  const [village, setVillage] = useState<string>('');
  const [workType, setWorkType] = useState<'foot' | 'hours' | 'theka'>('foot');
  const [rateInput, setRateInput] = useState<string>('');
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [thekaAmount, setThekaAmount] = useState<string>('');
  const [advanceAmount, setAdvanceAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'cash' | 'online' | 'credit'>('cash');
  const [startDate, setStartDate] = useState<string>(getTodayFormatted());
  const [notes, setNotes] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [savedMsg, setSavedMsg] = useState<string>('');

  // Quick Add Customer Modal
  const [isCustModalOpen, setIsCustModalOpen] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustLocation, setNewCustLocation] = useState<string>('');
  const [savingCust, setSavingCust] = useState<boolean>(false);

  // Quick Add Machine Modal
  const [isMachModalOpen, setIsMachModalOpen] = useState<boolean>(false);
  const [newMachName, setNewMachName] = useState<string>('');
  const [newMachModel, setNewMachModel] = useState<string>('');
  const [newMachReg, setNewMachReg] = useState<string>('');
  const [newMachRate, setNewMachRate] = useState<string>('');
  const [savingMach, setSavingMach] = useState<boolean>(false);

  const loadDropdownData = async () => {
    try {
      const [custRes, machRes] = await Promise.all([
        CustomerService.getAll().catch(() => []),
        MachineService.getAll().catch(() => []),
      ]);

      const rawCust = Array.isArray(custRes) ? custRes : Array.isArray(custRes?.data) ? custRes.data : [];
      const rawMach = Array.isArray(machRes) ? machRes : Array.isArray(machRes?.data) ? machRes.data : [];

      setCustomersList(rawCust);
      setMachinesList(rawMach);

      if (rawMach.length > 0 && !selectedMachine) {
        setSelectedMachine(String(rawMach[0].id || rawMach[0].name));
      }
      if (rawCust.length > 0 && !selectedCustomer) {
        setSelectedCustomer(String(rawCust[0].id || rawCust[0].name));
      }
    } catch {
      // fallback
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadDropdownData();
  }, []);

  // When customer changes, auto-fill location if customer has location
  const handleCustomerChange = (val: string) => {
    setSelectedCustomer(val);
    const found = customersList.find((c: any) => String(c.id) === val || c.name === val);
    if (found && found.location && !village) {
      setVillage(found.location);
    }
  };

  // Calculation calculations
  const numRate = parseFloat(rateInput.replace(/,/g, '')) || 0;
  const numQuantity = parseFloat(quantityInput.replace(/,/g, '')) || 0;
  const numTheka = parseFloat(thekaAmount.replace(/,/g, '')) || 0;
  const numAdvance = parseFloat(advanceAmount.replace(/,/g, '')) || 0;

  const totalAmount = workType === 'theka' ? numTheka : numRate * numQuantity;
  const remainingBalance = Math.max(0, totalAmount - numAdvance);

  const getIsoDate = (dStr: string) => {
    if (!dStr) return new Date().toISOString().split('T')[0];
    const parts = dStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dStr;
  };

  const handleSave = async () => {
    if (!selectedCustomer) {
      Alert.alert('त्रुटी', 'कृपया ग्राहक निवडा.');
      return;
    }
    if (!selectedMachine) {
      Alert.alert('त्रुटी', 'कृपया मशीन निवडा.');
      return;
    }
    if (totalAmount <= 0) {
      Alert.alert('त्रुटी', 'कृपया योग्य रक्कम, दर किंवा फूट/तास प्रविष्ट करा.');
      return;
    }

    setSaving(true);
    try {
      const isoDate = getIsoDate(startDate);
      const custObj = customersList.find((c: any) => String(c.id) === selectedCustomer || c.name === selectedCustomer);
      const machObj = machinesList.find((m: any) => String(m.id) === selectedMachine || m.name === selectedMachine);

      const customerLabel = custObj?.name || selectedCustomer;
      const machineLabel = machObj?.name || selectedMachine;
      const desc = workName.trim() || `काम: ${customerLabel}`;

      const fullNotes = [
        `मशीन: ${machineLabel}`,
        `ग्राहक: ${customerLabel}`,
        village.trim() ? `गाव/ठिकाण: ${village.trim()}` : '',
        `प्रकार: ${workType === 'foot' ? 'प्रति फूट' : workType === 'hours' ? 'प्रति तास' : 'ठेका'}`,
        workType !== 'theka' && numRate > 0 ? `दर: ₹${numRate}` : '',
        workType !== 'theka' && numQuantity > 0 ? `प्रमाण: ${numQuantity} ${workType === 'foot' ? 'फूट' : 'तास'}` : '',
        numAdvance > 0 ? `आगाऊ रक्कम: ₹${numAdvance}` : '',
        remainingBalance > 0 ? `उर्वरित बाकी: ₹${remainingBalance}` : '',
        notes.trim(),
      ].filter(Boolean).join(' | ');

      // Save to MachineEntryService
      try {
        await MachineEntryService.create({
          machine_id: machObj?.id || selectedMachine,
          customer_id: custObj?.id || null,
          entry_date: isoDate,
          location: village.trim() || undefined,
          work_description: desc,
          hours_or_trips: workType !== 'theka' ? numQuantity : 1,
          hours_unit: workType === 'hours' ? 'hours' : 'trips',
          amount: totalAmount,
          payment_type: paymentType,
        });
      } catch {
        // Fallback to DailyLedger
        await DailyLedgerService.create({
          entry_date: isoDate,
          type: 'earnings',
          description: `${desc} (${machineLabel})`,
          amount: totalAmount,
          payment_type: paymentType,
          notes: fullNotes,
        });
      }

      setSavedMsg('नवीन काम / मशीन नोंद यशस्वीरित्या जतन झाले!');
      setTimeout(() => {
        setSavedMsg('');
        // Reset form
        setWorkName('');
        setVillage('');
        setRateInput('');
        setQuantityInput('');
        setThekaAmount('');
        setAdvanceAmount('');
        setNotes('');
      }, 2000);
    } catch (err: any) {
      Alert.alert('त्रुटी', err?.message || 'नोंद जतन करताना समस्या आली.');
    } finally {
      setSaving(false);
    }
  };

  // Quick Add Customer Handler
  const handleCreateCustomer = async () => {
    if (!newCustName.trim()) {
      Alert.alert('त्रुटी', 'कृपया ग्राहकाचे नाव टाका.');
      return;
    }
    setSavingCust(true);
    try {
      const res = await CustomerService.create({
        name: newCustName.trim(),
        phone: newCustPhone.trim() || undefined,
        location: newCustLocation.trim() || undefined,
      });
      const created = res?.data || res;
      const newId = String(created?.id || `cust_${Date.now()}`);
      const newEntry = { id: newId, name: newCustName.trim(), location: newCustLocation.trim(), phone: newCustPhone.trim() };
      setCustomersList((prev) => [newEntry, ...prev]);
      setSelectedCustomer(newId);
      if (newCustLocation.trim()) {
        setVillage(newCustLocation.trim());
      }
      setIsCustModalOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustLocation('');
    } catch {
      Alert.alert('त्रुटी', 'नवीन ग्राहक जोडताना समस्या आली.');
    } finally {
      setSavingCust(false);
    }
  };

  // Quick Add Machine Handler
  const handleCreateMachine = async () => {
    if (!newMachName.trim()) {
      Alert.alert('त्रुटी', 'कृपया मशीनचे नाव टाका.');
      return;
    }
    setSavingMach(true);
    try {
      const res = await MachineService.create({
        name: newMachName.trim(),
        model_number: newMachModel.trim() || undefined,
        registration_number: newMachReg.trim() || undefined,
        hourly_rate: parseFloat(newMachRate) || undefined,
      });
      const created = res?.data || res;
      const newId = String(created?.id || `mach_${Date.now()}`);
      const newEntry = { id: newId, name: newMachName.trim(), registration_number: newMachReg.trim() };
      setMachinesList((prev) => [newEntry, ...prev]);
      setSelectedMachine(newId);
      setIsMachModalOpen(false);
      setNewMachName('');
      setNewMachModel('');
      setNewMachReg('');
      setNewMachRate('');
    } catch {
      Alert.alert('त्रुटी', 'नवीन मशीन जोडताना समस्या आली.');
    } finally {
      setSavingMach(false);
    }
  };

  const customerOptions = customersList.map((c: any) => ({
    label: `${c.name}${c.location ? ` (${c.location})` : ''}`,
    value: String(c.id || c.name),
  }));

  const machineOptions = machinesList.map((m: any) => ({
    label: `${m.name}${m.registration_number ? ` - ${m.registration_number}` : ''}`,
    value: String(m.id || m.name),
  }));

  return (
    <View style={styles.screen}>
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
        <Text style={styles.headerTitle}>नवीन काम / मशीन नोंद</Text>
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
            <View style={tw`flex-1 flex-row items-center gap-2`}>
              <CheckCircle size={18} color="#15803D" />
              <Text style={styles.successText}>{savedMsg}</Text>
            </View>
            {onNavigateToChaluKam ? (
              <TouchableOpacity
                onPress={onNavigateToChaluKam}
                style={tw`bg-[#15803D] px-3 py-1.5 rounded-lg ml-2`}
                activeOpacity={0.8}
              >
                <Text style={tw`text-xs font-bold text-white`}>चालू कामे पहा ›</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* ग्राहक नाव (Customer Dropdown) */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <User size={18} color="#78350F" />
            <Text style={styles.labelText}>ग्राहक नाव <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <View style={styles.dropdownWithAdd}>
            <View style={styles.dropdownFlex}>
              <AppDropdown
                label=""
                value={selectedCustomer}
                onChangeText={handleCustomerChange}
                options={
                  customerOptions.length > 0
                    ? customerOptions
                    : [{ label: 'ग्राहक उपलब्ध नाही', value: '' }]
                }
              />
            </View>
            <TouchableOpacity
              onPress={() => setIsCustModalOpen(true)}
              style={styles.quickAddBtn}
              activeOpacity={0.7}
              accessibilityLabel="नवीन ग्राहक जोडा"
            >
              <Plus size={18} color="#78350F" />
            </TouchableOpacity>
          </View>
        </View>

        {/* मशीन नाव (Machine Dropdown) */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <Truck size={18} color="#78350F" />
            <Text style={styles.labelText}>मशीन नाव <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <View style={styles.dropdownWithAdd}>
            <View style={styles.dropdownFlex}>
              <AppDropdown
                label=""
                value={selectedMachine}
                onChangeText={setSelectedMachine}
                options={
                  machineOptions.length > 0
                    ? machineOptions
                    : [{ label: 'मशीन उपलब्ध नाही', value: '' }]
                }
              />
            </View>
            <TouchableOpacity
              onPress={() => setIsMachModalOpen(true)}
              style={styles.quickAddBtn}
              activeOpacity={0.7}
              accessibilityLabel="नवीन मशीन जोडा"
            >
              <Plus size={18} color="#78350F" />
            </TouchableOpacity>
          </View>
        </View>

        {/* गाव / ठिकाण */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <Home size={18} color="#78350F" />
            <Text style={styles.labelText}>गाव / ठिकाण</Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={village}
            onChangeText={setVillage}
            placeholder="उदा. पाटोदा, बीड"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* कामाचे स्वरूप */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <FileText size={18} color="#78350F" />
            <Text style={styles.labelText}>कामाचे स्वरूप</Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={workName}
            onChangeText={setWorkName}
            placeholder="उदा. विहीर खोदकाम / शेत काम"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* काम प्रकार Radio Buttons */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <Clock size={18} color="#78350F" />
            <Text style={styles.labelText}>काम प्रकार <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setWorkType('foot')}
              activeOpacity={0.7}
            >
              <View style={[styles.radioCircle, workType === 'foot' && styles.radioCircleActive]}>
                {workType === 'foot' && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.radioLabel, workType === 'foot' && styles.radioLabelActive]}>
                प्रति फूट
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setWorkType('hours')}
              activeOpacity={0.7}
            >
              <View style={[styles.radioCircle, workType === 'hours' && styles.radioCircleActive]}>
                {workType === 'hours' && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.radioLabel, workType === 'hours' && styles.radioLabelActive]}>
                तास
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setWorkType('theka')}
              activeOpacity={0.7}
            >
              <View style={[styles.radioCircle, workType === 'theka' && styles.radioCircleActive]}>
                {workType === 'theka' && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.radioLabel, workType === 'theka' && styles.radioLabelActive]}>
                ठेका
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calculation / Pricing Card */}
        {workType === 'theka' ? (
          <View style={styles.calcCard}>
            <View style={styles.calcTopRow}>
              <View style={styles.calcCol}>
                <Text style={styles.calcColLabel}>ठेका एकूण रक्कम (₹) *</Text>
                <TextInput
                  style={styles.calcInput}
                  value={thekaAmount}
                  onChangeText={setThekaAmount}
                  placeholder="उदा. 45000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.calcBottomRow}>
              <Text style={styles.calcTotalLabel}>एकूण रक्कम</Text>
              <Text style={styles.calcTotalValue}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.calcCard}>
            <View style={styles.calcTopRow}>
              <View style={styles.calcCol}>
                <Text style={styles.calcColLabel}>
                  {workType === 'foot' ? 'प्रति फूट दर (₹)' : 'प्रति तास दर (₹)'}
                </Text>
                <TextInput
                  style={styles.calcInput}
                  value={rateInput}
                  onChangeText={setRateInput}
                  placeholder="उदा. 80"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.calcDivider} />

              <View style={styles.calcCol}>
                <Text style={styles.calcColLabel}>
                  {workType === 'foot' ? 'एकूण फूट' : 'एकूण तास'}
                </Text>
                <TextInput
                  style={styles.calcInput}
                  value={quantityInput}
                  onChangeText={setQuantityInput}
                  placeholder="उदा. 350"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.calcBottomRow}>
              <Text style={styles.calcTotalLabel}>एकूण रक्कम</Text>
              <Text style={styles.calcTotalValue}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        )}

        {/* आगाऊ रक्कम (Advance) */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <IndianRupee size={18} color="#78350F" />
            <Text style={styles.labelText}>आगाऊ रक्कम (₹)</Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={advanceAmount}
            onChangeText={setAdvanceAmount}
            placeholder="उदा. 5000 (असल्यास)"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>

        {/* Remaining Balance Indicator if advance entered */}
        {numAdvance > 0 && totalAmount > 0 ? (
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>उर्वरित बाकी (उधारी):</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(remainingBalance)}</Text>
          </View>
        ) : null}

        {/* पेमेंट पद्धत */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <CreditCard size={18} color="#78350F" />
            <Text style={styles.labelText}>पेमेंट पद्धत</Text>
          </View>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setPaymentType('cash')}
              activeOpacity={0.7}
            >
              <View style={[styles.radioCircle, paymentType === 'cash' && styles.radioCircleActive]}>
                {paymentType === 'cash' && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.radioLabel, paymentType === 'cash' && styles.radioLabelActive]}>
                रोख
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setPaymentType('online')}
              activeOpacity={0.7}
            >
              <View style={[styles.radioCircle, paymentType === 'online' && styles.radioCircleActive]}>
                {paymentType === 'online' && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.radioLabel, paymentType === 'online' && styles.radioLabelActive]}>
                ऑनलाइन
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setPaymentType('credit')}
              activeOpacity={0.7}
            >
              <View style={[styles.radioCircle, paymentType === 'credit' && styles.radioCircleActive]}>
                {paymentType === 'credit' && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.radioLabel, paymentType === 'credit' && styles.radioLabelActive]}>
                उधारी
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* सुरुवातीची तारीख */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <CalendarIcon size={18} color="#78350F" />
            <Text style={styles.labelText}>सुरुवात तारीख <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <View style={styles.dateInputWrapper}>
            <AppDatePicker label="" value={startDate} onChange={setStartDate} />
          </View>
        </View>

        {/* नोंद (Notes) */}
        <View style={styles.notesRow}>
          <View style={styles.labelContainerNotes}>
            <StickyNote size={18} color="#78350F" />
            <Text style={styles.labelText}>नोंद</Text>
          </View>
          <TextInput
            style={styles.notesArea}
            value={notes}
            onChangeText={setNotes}
            placeholder="उदा. काम संपल्यावर उर्वरित पेमेंट देणे..."
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
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.bottomSaveBtnText}>
              {saving ? 'जतन होत आहे...' : 'काम जतन करा'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Quick Add Customer Modal */}
      <Modal
        visible={isCustModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCustModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>नवीन ग्राहक जोडा</Text>
              <TouchableOpacity onPress={() => setIsCustModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>ग्राहकाचे नाव *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newCustName}
                  onChangeText={setNewCustName}
                  placeholder="उदा. सुरेश पाटील"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>मोबाईल नंबर</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newCustPhone}
                  onChangeText={setNewCustPhone}
                  placeholder="उदा. 9876543210"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>गाव / ठिकाण</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newCustLocation}
                  onChangeText={setNewCustLocation}
                  placeholder="उदा. पाटोदा"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleCreateCustomer}
                disabled={savingCust}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveBtnText}>
                  {savingCust ? 'जोडत आहे...' : 'ग्राहक जोडा'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quick Add Machine Modal */}
      <Modal
        visible={isMachModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMachModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>नवीन मशीन जोडा</Text>
              <TouchableOpacity onPress={() => setIsMachModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>मशीनचे नाव *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newMachName}
                  onChangeText={setNewMachName}
                  placeholder="उदा. JCB 3DX"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>गाडी क्रमांक</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newMachReg}
                  onChangeText={setNewMachReg}
                  placeholder="उदा. MH 23 AB 1234"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.modalInputGroup}>
                <Text style={styles.modalLabel}>प्रति तास दर (₹)</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newMachRate}
                  onChangeText={setNewMachRate}
                  placeholder="उदा. 1200"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleCreateMachine}
                disabled={savingMach}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSaveBtnText}>
                  {savingMach ? 'जोडत आहे...' : 'मशीन जोडा'}
                </Text>
              </TouchableOpacity>
            </View>
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
    fontSize: 19,
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
  dropdownWithAdd: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownFlex: {
    flex: 1,
  },
  quickAddBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
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
    justifyContent: 'space-between',
    gap: 6,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#6B121C',
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#6B121C',
  },
  radioLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  radioLabelActive: {
    color: '#1C1917',
    fontWeight: '800',
  },
  calcCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 2,
    marginBottom: 2,
  },
  calcTopRow: {
    flexDirection: 'row',
    padding: 12,
  },
  calcCol: {
    flex: 1,
  },
  calcDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  calcColLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  calcInput: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    padding: 0,
  },
  calcBottomRow: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  calcTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1C1917',
  },
  calcTotalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1C1917',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  balanceLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E40AF',
  },
  balanceAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E40AF',
  },
  dateInputWrapper: {
    flex: 1,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1917',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    gap: 12,
  },
  modalInputGroup: {
    gap: 4,
  },
  modalLabel: {
    fontSize: 12,
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
  modalSaveBtn: {
    backgroundColor: '#6B121C',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalSaveBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default NavinKamForm;
