import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Pencil, Trash2, MapPin, Phone, ChevronRight, Share2 } from 'lucide-react-native';
import { Customer } from '../types/customer';
import { colors, radii, shadows } from '../theme';
import { sendCustomerUdharOnWhatsApp } from '../utils/whatsapp';

interface CustomerCardProps {
  customer: Customer;
  onSelect?: (customer: Customer) => void;
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
  onSelect,
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

  const udhari = customer.udhariBalance ?? 0;
  const isPending = udhari > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onSelect && onSelect(customer)}
    >
      <View style={styles.mainContainer}>
        {/* Left Avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Center Details */}
        <View style={styles.centerContent}>
          <Text style={styles.name} numberOfLines={1}>
            {customer.name}
          </Text>

          <View style={styles.metaRow}>
            {customer.location ? (
              <View style={styles.metaItem}>
                <MapPin size={12} color={colors.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {customer.location}
                </Text>
              </View>
            ) : null}

            {customer.phone ? (
              <View style={styles.metaItem}>
                <Phone size={12} color={colors.textMuted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {customer.phone}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Udhar Balance Badge */}
          {customer.udhariBalance !== undefined && (
            <View style={styles.badgeWrapper}>
              <View style={[styles.badge, isPending ? styles.badgeDanger : styles.badgeSuccess]}>
                <Text style={[styles.badgeText, isPending ? styles.badgeTextDanger : styles.badgeTextSuccess]}>
                  {isPending ? `बाकी: ₹${udhari.toLocaleString('en-IN')}` : 'शिल्लक (₹0)'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Right Actions */}
        <View style={styles.rightActions}>
          {isPending ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                sendCustomerUdharOnWhatsApp({
                  customerName: customer.name,
                  phone: customer.phone,
                  location: customer.location,
                  totalWork: customer.totalWork,
                  totalPaid: customer.totalPaid,
                  udhariBalance: udhari,
                  expectedPaymentDate: customer.expectedPaymentDate,
                });
              }}
              style={[styles.actionBtn, styles.whatsAppBtnBg]}
              accessibilityLabel="Share on WhatsApp"
              activeOpacity={0.7}
            >
              <Share2 size={14} color="#15803D" />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onEdit(customer);
            }}
            style={styles.actionBtn}
            accessibilityLabel="Edit customer"
            activeOpacity={0.7}
          >
            <Pencil size={15} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onDelete(customer.id);
            }}
            style={[styles.actionBtn, styles.deleteBtnBg]}
            accessibilityLabel="Delete customer"
            activeOpacity={0.7}
          >
            <Trash2 size={15} color={colors.error} />
          </TouchableOpacity>

          <ChevronRight size={18} color={colors.textMuted} style={styles.chevron} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    ...shadows.xs,
  },
  mainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
    paddingRight: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  badgeWrapper: {
    flexDirection: 'row',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  badgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  badgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextDanger: {
    color: '#DC2626',
  },
  badgeTextSuccess: {
    color: '#059669',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnBg: {
    backgroundColor: colors.errorBg,
  },
  whatsAppBtnBg: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  chevron: {
    marginLeft: 2,
  },
});

export default CustomerCard;
