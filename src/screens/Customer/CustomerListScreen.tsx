import React, { useState, useEffect } from 'react';
import { View, Text, Alert, ScrollView, StyleSheet } from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { AppSearch } from '../../components/AppSearch';
import { CustomerCard } from '../../components/CustomerCard';
import { AppModal } from '../../components/AppModal';
import { AppInput } from '../../components/AppInput';
import { AppButton } from '../../components/AppButton';
import { Customer } from '../../types/customer';
import { DummyData } from '../../constants/DummyData';
import { CustomerService } from '../../utils/api';
import { colors } from '../../theme';
import { Users } from 'lucide-react-native';
import { CustomerDetailScreen } from './CustomerDetailScreen';

interface CustomerListScreenProps {
  onBack: () => void;
  onSelectCustomer?: (customer: Customer) => void;
}

export const CustomerListScreen: React.FC<CustomerListScreenProps> = ({ onBack, onSelectCustomer }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [name, setName] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const fetchCustomers = async (search?: string) => {
    try {
      setLoading(true);
      const data = await CustomerService.getAll(search);
      if (Array.isArray(data)) {
        setCustomers(data);
        DummyData.customers = data;
      }
    } catch {
      // Fallback gracefully to local state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const avatarColors = ['bg-blue-600', 'bg-orange-600', 'bg-teal-600', 'bg-emerald-600', 'bg-purple-600'];

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const handleSelectCustomer = (customer: Customer) => {
    if (onSelectCustomer) {
      onSelectCustomer(customer);
    } else {
      setSelectedCustomer(customer);
    }
  };

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
          onPress: async () => {
            const updated = customers.filter((c) => c.id !== id);
            setCustomers(updated);
            DummyData.customers = updated;
            try {
              await CustomerService.delete(id);
            } catch {
              // Local state updated
            }
          },
        },
      ]
    );
  };

  const handleSaveModal = async () => {
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
      try {
        await CustomerService.update(editingCustomer.id, { name, location, phone });
      } catch {
        // Local updated
      }
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
      try {
        const created = await CustomerService.create({ name, location, phone: phone || '9000000000' });
        if (created?.id) {
          fetchCustomers();
        }
      } catch {
        // Local updated
      }
    }

    setIsModalOpen(false);
  };

  // Render Customer Detail View if a customer is clicked
  if (selectedCustomer) {
    return (
      <CustomerDetailScreen
        customer={selectedCustomer}
        onBack={() => {
          setSelectedCustomer(null);
          fetchCustomers();
        }}
      />
    );
  }

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
          <AppSearch
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ग्राहक शोधा..."
          />

          {/* Customer Count */}
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              एकूण ग्राहक: <Text style={styles.countNumber}>{filteredCustomers.length}</Text>
            </Text>
          </View>

          {/* Customer Cards */}
          <View style={styles.cardList}>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer, index) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onSelect={handleSelectCustomer}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  avatarBgColor={avatarColors[index % avatarColors.length]}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Users size={40} color={colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>ग्राहक आढळले नाहीत</Text>
                <Text style={styles.emptySubtitle}>शोध क्वेरी बदला किंवा नवीन ग्राहक जोडा</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          एकूण ग्राहक :{' '}
          <Text style={styles.footerCount}>{customers.length}</Text>
        </Text>
      </View>

      {/* Add / Edit Modal */}
      <AppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'ग्राहक संपादित करा' : 'नवीन ग्राहक जोडा'}
      >
        <View style={styles.modalContent}>
          <AppInput
            label="ग्राहकाचे नाव"
            value={name}
            onChangeText={setName}
            placeholder="उदा. संतोष पाटील"
            required
          />
          <AppInput
            label="गाव / ठिकाण"
            value={location}
            onChangeText={setLocation}
            placeholder="उदा. गोकुळ शिरगाव"
          />
          <AppInput
            label="मोबाईल नंबर"
            value={phone}
            onChangeText={setPhone}
            placeholder="उदा. 9765432101"
            keyboardType="phone-pad"
          />
          <View style={styles.modalBtn}>
            <AppButton
              title={editingCustomer ? 'अपडेट करा' : 'सेव्ह करा'}
              onPress={handleSaveModal}
              variant="primary"
            />
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
    gap: 12,
  },
  countRow: {
    paddingHorizontal: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  countNumber: {
    color: colors.primary,
    fontWeight: '700',
  },
  cardList: {
    gap: 10,
    paddingTop: 2,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontWeight: '600',
    fontSize: 13,
    color: colors.textSecondary,
  },
  footerCount: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  modalContent: {
    gap: 14,
  },
  modalBtn: {
    paddingTop: 4,
  },
});

export default CustomerListScreen;
