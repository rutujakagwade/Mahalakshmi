import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { AppInput } from '../../components/AppInput';
import { AppDropdown } from '../../components/AppDropdown';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { AppModal } from '../../components/AppModal';
import { formatCurrency } from '../../utils/currency';
import { AppDatePicker } from '../../components/AppDatePicker';
import { DummyData } from '../../constants/DummyData';
import { getTodayFormatted } from '../../utils/date';
import { CustomerService, MachineEntryService, MachineService } from '../../utils/api';
import { colors, radii } from '../../theme';
import { CheckCircle } from 'lucide-react-native';

interface MachineEntryScreenProps {
  onBack: () => void;
}

export const MachineEntryScreen: React.FC<MachineEntryScreenProps> = ({ onBack }) => {
  const [date, setDate] = useState<string>(getTodayFormatted());
  const [machinesList, setMachinesList] = useState(DummyData.machines);
  const [customersList, setCustomersList] = useState(DummyData.customers);
  const [selectedMachine, setSelectedMachine] = useState<string>(
    DummyData.machines.length > 0
      ? `${DummyData.machines[0].name} (${DummyData.machines[0].registrationNumber})`
      : ''
  );
  const [customer, setCustomer] = useState<string>(
    DummyData.customers.length > 0 ? DummyData.customers[0].name : ''
  );
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

  const [machineSummaries, setMachineSummaries] = useState([
    { name: 'JCB 3DX', amount: 12000 },
    { name: 'POCLAIN 210', amount: 15500 },
    { name: 'TATA TIPPER', amount: 8700 },
  ]);

  const [savedMsg, setSavedMsg] = useState<string>('');

  const loadData = async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        MachineService.getAll(),
        CustomerService.getAll(),
      ]);
      if (Array.isArray(mRes) && mRes.length > 0) {
        setMachinesList(mRes);
      }
      if (Array.isArray(cRes) && cRes.length > 0) {
        setCustomersList(cRes);
      }
    } catch {
      // Local fallback
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    const numericAmt = parseFloat(amount.replace(/,/g, '')) || 0;
    const parts = date.split('/');
    const isoDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : new Date().toISOString().split('T')[0];

    const matchedMachine = machinesList.find(
      (m: any) => `${m.name} (${m.registrationNumber || m.registration_number})` === selectedMachine || m.name === selectedMachine
    );
    const matchedCustomer = customersList.find((c: any) => c.name === customer);

    const payTypeMap: Record<string, 'cash' | 'online' | 'credit'> = {
      'रोख': 'cash',
      'ऑनलाइन': 'online',
      'उधारी': 'credit',
    };

    const numHours = parseFloat(hoursOrTrips.replace(/[^0-9.]/g, '')) || 0;
    const unit = hoursOrTrips.includes('फेऱ्या') ? 'trips' : 'hours';

    try {
      if (matchedMachine?.id) {
        await MachineEntryService.create({
          machine_id: matchedMachine.id,
          customer_id: matchedCustomer?.id || null,
          entry_date: isoDate,
          location,
          work_description: description,
          hours_or_trips: numHours,
          hours_unit: unit,
          amount: numericAmt,
          payment_type: payTypeMap[paymentType] || 'cash',
        });
      }
    } catch {
      // Local update
    }

    if (numericAmt > 0) {
      const machineName = selectedMachine.split(' ')[0] + ' ' + (selectedMachine.split(' ')[1] || '');
      setMachineSummaries((prev) => [
        { name: machineName, amount: numericAmt },
        ...prev.filter((m) => m.name !== machineName),
      ]);
    }
    setSavedMsg('मशीन नोंद यशस्वीरित्या सेव्ह झाली!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleAddMachine = () => {
    if (!newMachineName.trim() || !newMachineReg.trim()) {
      Alert.alert('त्रुटी', 'कृपया मशीनचे नाव व नंबर टाका');
      return;
    }

    const newMachine = {
      id: `m_${Date.now()}`,
      name: newMachineName,
      modelNumber: newMachineModel || 'N/A',
      registrationNumber: newMachineReg,
      hourlyRate: parseFloat(newMachineRate) || 0,
    };

    const updatedMachines = [...DummyData.machines, newMachine];
    DummyData.machines = updatedMachines;
    setSelectedMachine(`${newMachine.name} (${newMachine.registrationNumber})`);

    setNewMachineName('');
    setNewMachineModel('');
    setNewMachineReg('');
    setNewMachineRate('');
    setIsModalOpen(false);
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
        {savedMsg && (
          <View style={styles.successBanner}>
            <CheckCircle size={16} color={colors.success} />
            <Text style={styles.successBannerText}>{savedMsg}</Text>
          </View>
        )}

        {/* Form */}
        <AppCard style={styles.formCard}>
          <AppDatePicker label="दिनांक" value={date} onChange={setDate} />

          <AppDropdown
            label="मशीन निवडा"
            value={selectedMachine}
            onChangeText={setSelectedMachine}
            options={DummyData.machines.map((m) => ({
              label: `${m.name} (${m.registrationNumber})`,
              value: `${m.name} (${m.registrationNumber})`,
            }))}
          />

          <AppDropdown
            label="ग्राहक"
            value={customer}
            onChangeText={setCustomer}
            options={DummyData.customers.map((c) => ({
              label: `${c.name} (${c.location})`,
              value: c.name,
            }))}
          />

          <AppInput label="कामाचे ठिकाण" value={location} onChangeText={setLocation} placeholder="उदा. गोकुळ शिरगाव" />
          <AppInput label="कामाचे वर्णन" value={description} onChangeText={setDescription} placeholder="उदा. खाड्डा खणकाम" />
          <AppInput label="तास / फेऱ्या" value={hoursOrTrips} onChangeText={setHoursOrTrips} placeholder="उदा. 8 तास" />
          <AppInput label="रक्कम (₹)" value={amount} onChangeText={setAmount} placeholder="उदा. 12000" keyboardType="numeric" />

          <AppDropdown
            label="पेमेंट प्रकार"
            value={paymentType}
            onChangeText={setPaymentType}
            options={[
              { label: 'रोख', value: 'रोख' },
              { label: 'ऑनलाइन (GPay/PhonePe)', value: 'ऑनलाइन' },
              { label: 'उधारी', value: 'उधारी' },
            ]}
          />

          <View style={styles.btnWrapper}>
            <AppButton title="सेव्ह करा" onPress={handleSave} variant="primary" />
          </View>
        </AppCard>

        {/* Machine Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>आजची मशीन सारांश</Text>
          <AppCard variant="elevated" style={styles.summaryCard}>
            {machineSummaries.map((item, index) => (
              <View key={index} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{item.name}</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </AppCard>
        </View>
      </ScrollView>

      {/* Add Machine Modal */}
      <AppModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="नवीन मशीन जोडा">
        <View style={styles.modalContent}>
          <AppInput label="मशीनचे नाव" value={newMachineName} onChangeText={setNewMachineName} placeholder="उदा. JCB 3DX" required />
          <AppInput label="मॉडेल" value={newMachineModel} onChangeText={setNewMachineModel} placeholder="उदा. 3DX Super" />
          <AppInput label="नोंदणी क्रमांक" value={newMachineReg} onChangeText={setNewMachineReg} placeholder="उदा. MH 09 AB 1234" required />
          <AppInput label="तास दर (₹/तास)" value={newMachineRate} onChangeText={setNewMachineRate} placeholder="उदा. 1500" keyboardType="numeric" />
          <View style={styles.modalBtn}>
            <AppButton title="सेव्ह करा" onPress={handleAddMachine} variant="primary" />
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
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  summaryCard: {
    padding: 14,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.earnings,
  },
  modalContent: {
    gap: 14,
  },
  modalBtn: {
    paddingTop: 4,
  },
});

export default MachineEntryScreen;
