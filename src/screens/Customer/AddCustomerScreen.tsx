import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import tw from 'twrnc';
import { CustomerService } from '../../utils/api';
import {
  User,
  Phone,
  Home,
  IndianRupee,
  StickyNote,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react-native';

interface AddCustomerScreenProps {
  onBack: () => void;
  onSuccess?: () => void;
}

export const AddCustomerScreen: React.FC<AddCustomerScreenProps> = ({ onBack, onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(digits);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('त्रुटी', 'कृपया ग्राहकाचे नाव टाका');
      return;
    }
    if (phone && phone.length !== 10) {
      Alert.alert('त्रुटी', 'कृपया योग्य १० अंकी मोबाईल नंबर टाका');
      return;
    }

    setSaving(true);
    try {
      const combinedNotes = [
        openingBalance.trim() ? `सुरुवातीची उधारी: ₹${openingBalance.trim()}` : '',
        notes.trim(),
      ].filter(Boolean).join(' | ') || undefined;

      await CustomerService.create({
        name: name.trim(),
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        notes: combinedNotes,
      });

      setSavedMsg('ग्राहक यशस्वीरित्या जोडला गेला!');
      setTimeout(() => {
        setSavedMsg('');
        if (onSuccess) {
          onSuccess();
        } else {
          onBack();
        }
      }, 1200);
    } catch {
      Alert.alert('त्रुटी', 'ग्राहक जोडताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>नवीन ग्राहक</Text>
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

        {/* ग्राहकाचे नाव */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <User size={18} color="#78350F" />
            <Text style={styles.labelText}>ग्राहकाचे नाव <Text style={styles.requiredStar}>*</Text></Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={name}
            onChangeText={setName}
            placeholder="उदा. संतोष पाटील"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* मोबाईल नंबर */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <Phone size={18} color="#78350F" />
            <Text style={styles.labelText}>मोबाईल नंबर</Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="9876543210"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        {/* गाव / ठिकाण */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <Home size={18} color="#78350F" />
            <Text style={styles.labelText}>गाव / ठिकाण</Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={location}
            onChangeText={setLocation}
            placeholder="उदा. वडगाव / गोकुळ शिरगाव"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* सुरुवातीची उधारी / शिल्लक */}
        <View style={styles.inputRow}>
          <View style={styles.labelContainer}>
            <IndianRupee size={18} color="#78350F" />
            <Text style={styles.labelText}>सुरुवातीची उधारी (₹)</Text>
          </View>
          <TextInput
            style={styles.textInputBox}
            value={openingBalance}
            onChangeText={setOpeningBalance}
            placeholder="उदा. 0"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>

        {/* नोंद */}
        <View style={styles.notesRow}>
          <View style={styles.labelContainerNotes}>
            <StickyNote size={18} color="#78350F" />
            <Text style={styles.labelText}>नोंद</Text>
          </View>
          <TextInput
            style={styles.notesArea}
            value={notes}
            onChangeText={setNotes}
            placeholder="काही नोंद असल्यास लिहा..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
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
              {saving ? 'जतन होत आहे...' : 'ग्राहक जतन करा'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    minHeight: 90,
  },
  bottomBtnWrapper: {
    marginTop: 12,
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
});

export default AddCustomerScreen;
