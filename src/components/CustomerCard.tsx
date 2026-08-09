import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Pencil, Trash2, User } from 'lucide-react-native';
import { Customer } from '../types/customer';

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  avatarBgColor?: string;
}

// Map twrnc color class names to actual hex colors
const colorMap: Record<string, string> = {
  'bg-blue-600': '#2563eb',
  'bg-orange-600': '#ea580c',
  'bg-teal-600': '#0d9488',
  'bg-emerald-600': '#059669',
  'bg-purple-600': '#9333ea',
};

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onEdit,
  onDelete,
  avatarBgColor = 'bg-blue-600',
}) => {
  const avatarColor = colorMap[avatarBgColor] ?? '#2563eb';

  return (
    <View style={styles.card}>
      {/* Left: Avatar + Info */}
      <View style={styles.leftSection}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <User size={20} color="#fff" />
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.location}>{customer.location}</Text>
          <Text style={styles.phone}>{customer.phone}</Text>
        </View>
      </View>

      {/* Right: Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onEdit(customer)}
          style={styles.editBtn}
          accessibilityLabel="Edit customer"
        >
          <Pencil size={16} color="#57534e" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(customer.id)}
          style={styles.deleteBtn}
          accessibilityLabel="Delete customer"
        >
          <Trash2 size={16} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBlock: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    color: '#57534e',
    marginBottom: 1,
  },
  phone: {
    fontSize: 12,
    color: '#78716c',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f4',
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
});

export default CustomerCard;
