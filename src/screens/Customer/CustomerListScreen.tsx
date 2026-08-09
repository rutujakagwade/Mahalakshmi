import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, StyleSheet } from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { AppSearch } from '../../components/AppSearch';
import { CustomerCard } from '../../components/CustomerCard';
import { AppModal } from '../../components/AppModal';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { Customer } from '../../types/customer';
import { DummyData } from '../../constants/DummyData';

interface CustomerListScreenProps {
  onBack: () => void;
}

export const CustomerListScreen: React.FC<CustomerListScreenProps> = ({ onBack }) => {
  const [customers, setCustomers] = useState<Customer[]>(DummyData.customers as Customer[]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const avatarColors = ['bg-blue-600', 'bg-orange-600', 'bg-teal-600', 'bg-emerald-600', 'bg-purple-600'];

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setLocation('');
    setPhone('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setLocation(customer.location);
    setPhone(customer.phone);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'ग्राहक हटवा',
      'तुम्हाला खरोखर हा ग्राहक हटवायचा आहे का?',
      [
        { text: 'नाही', style: 'cancel' },
        {
          text: 'होय, हटवा',
          style: 'destructive',
          onPress: () => {
            const updated = customers.filter((c) => c.id !== id);
            setCustomers(updated);
            DummyData.customers = updated;
          },
        },
      ]
    );
  };

  const handleSaveModal = () => {
    if (!name.trim()) {
      Alert.alert('त्रुटी', 'कृपया ग्राहकाचे नाव टाका');
      return;
    }

    if (editingCustomer) {
      const updated = customers.map((c) =>
        c.id === editingCustomer.id ? { ...c, name, location, phone } : c
      );
      setCustomers(updated);
      DummyData.customers = updated;
    } else {
      const newCustomer: Customer = {
        id: `c_${Date.now()}`,
        name,
        location,
        phone: phone || '9000000000',
      };
      const updated = [newCustomer, ...customers];
      setCustomers(updated);
      DummyData.customers = updated;
    }

    setIsModalOpen(false);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <AppHeader
          title="ग्राहक"
          showBack={true}
          onBackPress={onBack}
          rightActionIcon="plus"
          onRightActionPress={handleOpenAdd}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Search bar */}
          <AppSearch
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="शोधा..."
          />

          {/* Customer Cards List */}
          <View style={styles.cardList}>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer, index) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  avatarBgColor={avatarColors[index % avatarColors.length]}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>कोणताही ग्राहक आढळला नाही</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Footer Total Customers Bar */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          एकूण ग्राहक :{' '}
          <Text style={styles.footerCount}>{customers.length}</Text>
        </Text>
      </View>

      {/* Add / Edit Customer Modal */}
      <AppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'ग्राहक संपादित करा' : 'नवीन ग्राहक जोडा'}
      >
        <View style={styles.modalContent}>
          <AppInput label="ग्राहकाचे नाव" value={name} onChangeText={setName} placeholder="उदा. संतोष पाटील" />
          <AppInput label="गाव / ठिकाण" value={location} onChangeText={setLocation} placeholder="उदा. गोकुळ शिरगाव" />
          <AppInput label="मोबाईल नंबर" value={phone} onChangeText={setPhone} placeholder="उदा. 9765432101" keyboardType="phone-pad" />
          <View style={styles.modalBtn}>
            <AppButton title="सेव्ह करा" onPress={handleSaveModal} variant="primary" />
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
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  cardList: {
    gap: 10,
    paddingTop: 4,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#78716c',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f4',
    borderTopWidth: 1,
    borderTopColor: '#e7e5e4',
    alignItems: 'center',
  },
  footerText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#1c1917',
  },
  footerCount: {
    color: '#6B121C',
    fontSize: 16,
  },
  modalContent: {
    gap: 12,
  },
  modalBtn: {
    paddingTop: 8,
  },
});

export default CustomerListScreen;
