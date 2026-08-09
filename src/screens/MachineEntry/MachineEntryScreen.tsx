import React, { useState } from 'react';
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

interface MachineEntryScreenProps {
  onBack: () => void;
}

export const MachineEntryScreen: React.FC<MachineEntryScreenProps> = ({ onBack }) => {
  const [date, setDate] = useState<string>('20/05/2024');
  const [selectedMachine, setSelectedMachine] = useState<string>(
    DummyData.machines.length > 0
      ? `${DummyData.machines[0].name} (${DummyData.machines[0].registrationNumber})`
      : ''
  );
  const [customer, setCustomer] = useState<string>(
    DummyData.customers.length > 0 ? DummyData.customers[0].name : ''
  );
  const [location, setLocation] = useState<string>('गोकुळ शिरगाव');
  const [description, setDescription] = useState<string>('खाड्डा खणकाम');
  const [hoursOrTrips, setHoursOrTrips] = useState<string>('8 तास');
  const [amount, setAmount] = useState<string>('12,000');
  const [paymentType, setPaymentType] = useState<string>('रोख');

  // Add Machine Modal State
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

  const handleSave = () => {
    const numericAmt = parseFloat(amount.replace(/,/g, '')) || 0;
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
    
    // Reset form and close
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
            <Text style={styles.successBannerText}>{savedMsg}</Text>
          </View>
        )}

        {/* Machine Entry Form */}
        <AppCard style={styles.formCard}>
          {/* Date */}
          <AppDatePicker
            label="दिनांक"
            value={date}
            onChange={setDate}
          />

          {/* Machine Selection */}
          <AppDropdown
            label="मशीन निवडा"
            value={selectedMachine}
            onChangeText={setSelectedMachine}
            options={DummyData.machines.map((m) => ({
              label: `${m.name} (${m.registrationNumber})`,
              value: `${m.name} (${m.registrationNumber})`,
            }))}
          />

          {/* Customer */}
          <AppDropdown
            label="ग्राहक"
            value={customer}
            onChangeText={setCustomer}
            options={DummyData.customers.map((c) => ({
              label: `${c.name} (${c.location})`,
              value: c.name,
            }))}
          />

          {/* Work Location */}
          <AppInput
            label="कामाचे ठिकाण"
            value={location}
            onChangeText={setLocation}
            placeholder="उदा. गोकुळ शिरगाव"
          />

          {/* Work Description */}
          <AppInput
            label="कामाचे वर्णन"
            value={description}
            onChangeText={setDescription}
            placeholder="उदा. खाड्डा खणकाम"
          />

          {/* Hours or Trips */}
          <AppInput
            label="तास / फेऱ्या"
            value={hoursOrTrips}
            onChangeText={setHoursOrTrips}
            placeholder="उदा. 8 तास किंवा 5 फेऱ्या"
          />

          {/* Amount */}
          <AppInput
            label="रक्कम (₹)"
            value={amount}
            onChangeText={setAmount}
            placeholder="उदा. 12000"
          />

          {/* Payment Type */}
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

          {/* Save Button */}
          <View style={styles.btnWrapper}>
            <AppButton title="सेव्ह करा" onPress={handleSave} variant="primary" />
          </View>
        </AppCard>

        {/* Today Machine Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>आजची मशीन सारांश</Text>
          <AppCard style={styles.summaryCard}>
            {machineSummaries.map((item, index) => (
              <View key={index} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{item.name}</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </AppCard>
        </View>
      </ScrollView>

      {/* Add Machine Modal Popup */}
      <AppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="नवीन मशीन जोडा"
      >
        <View style={styles.modalContent}>
          <AppInput
            label="मशीनचे नाव"
            value={newMachineName}
            onChangeText={setNewMachineName}
            placeholder="उदा. JCB 3DX"
          />
          <AppInput
            label="मॉडेल"
            value={newMachineModel}
            onChangeText={setNewMachineModel}
            placeholder="उदा. 3DX Super"
          />
          <AppInput
            label="नोंदणी क्रमांक (रजिस्ट्रेशन नंबर)"
            value={newMachineReg}
            onChangeText={setNewMachineReg}
            placeholder="उदा. MH 09 AB 1234"
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
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF7F2',
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
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  successBannerText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    padding: 16,
    gap: 12,
  },
  btnWrapper: {
    paddingTop: 8,
  },
  summaryContainer: {
    gap: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#292524',
  },
  summaryCard: {
    padding: 14,
    backgroundColor: '#f5f5f4',
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e7e5e4',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#292524',
  },
  summaryAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
  },
  modalContent: {
    gap: 12,
  },
  modalBtn: {
    paddingTop: 8,
  },
});

export default MachineEntryScreen;
