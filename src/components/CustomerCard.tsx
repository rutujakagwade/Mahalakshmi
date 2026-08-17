import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Pencil, Trash2, User, MapPin, Phone } from 'lucide-react-native';
import { Customer } from '../types/customer';
import { colors, radii, shadows } from '../theme';

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  avatarBgColor?: string;
}

const avatarColors: Record<string, string> = {
  'bg-blue-600': '#2563EB',
  'bg-orange-600': '#EA580C',
  'bg-teal-600': '#0D9488',
  'bg-emerald-600': '#059669',
  'bg-purple-600': '#9333EA',
};

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onEdit,
  onDelete,
  avatarBgColor = 'bg-blue-600',
}) => {
  const avatarColor = avatarColors[avatarBgColor] ?? '#2563EB';
  const initials = customer.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.name} numberOfLines={1}>{customer.name}</Text>
          {customer.location ? (
            <View style={styles.detailRow}>
              <MapPin size={11} color={colors.textMuted} />
              <Text style={styles.location} numberOfLines={1}>{customer.location}</Text>
            </View>
          ) : null}
          {customer.phone ? (
            <View style={styles.detailRow}>
              <Phone size={11} color={colors.textMuted} />
              <Text style={styles.phone}>{customer.phone}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onEdit(customer)}
          style={styles.editBtn}
          accessibilityLabel="Edit customer"
          activeOpacity={0.7}
        >
          <Pencil size={14} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(customer.id)}
          style={styles.deleteBtn}
          accessibilityLabel="Delete customer"
          activeOpacity={0.7}
        >
          <Trash2 size={14} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.xs,
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
  avatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  infoBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: colors.textTertiary,
    flex: 1,
  },
  phone: {
    fontSize: 12,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editBtn: {
    padding: 8,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceTertiary,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: radii.md,
    backgroundColor: colors.errorBg,
  },
});

export default CustomerCard;
