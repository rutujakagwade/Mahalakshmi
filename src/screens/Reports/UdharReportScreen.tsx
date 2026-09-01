import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { AppHeader } from '../../components/AppHeader';
import { AppSearch } from '../../components/AppSearch';
import { Customer } from '../../types/customer';
import { ReportService } from '../../utils/api';
import { colors, radii, shadows } from '../../theme';
import {
  Users,
  MapPin,
  Phone,
  Calendar,
  ChevronRight,
  AlertCircle,
  TrendingDown,
  Share2,
} from 'lucide-react-native';
import { CustomerDetailScreen } from '../Customer/CustomerDetailScreen';
import { sendCustomerUdharOnWhatsApp } from '../../utils/whatsapp';

interface UdharReportScreenProps {
  onBack: () => void;
}

interface UdharReportData {
  totalUdhar: number;
  pendingCount: number;
  totalCustomers: number;
  customers: Customer[];
}

export const UdharReportScreen: React.FC<UdharReportScreenProps> = ({ onBack }) => {
  const [reportData, setReportData] = useState<UdharReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filterMode, setFilterMode] = useState<'pending' | 'all'>('pending');

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ReportService.getUdharReport();
      if (res) {
        setReportData(res);
      }
    } catch (err: any) {
      console.warn('Failed to fetch Udhar report:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  const customersList = reportData?.customers || [];

  const filteredCustomers = customersList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (filterMode === 'pending') {
      return matchesSearch && (c.udhariBalance ?? 0) > 0;
    }
    return matchesSearch;
  });

  const avatarColors = ['#2563EB', '#EA580C', '#0D9488', '#059669', '#9333EA'];

  if (selectedCustomer) {
    return (
      <CustomerDetailScreen
        customer={selectedCustomer}
        onBack={() => {
          setSelectedCustomer(null);
          fetchReport();
        }}
      />
    );
  }

  const totalUdhar = reportData?.totalUdhar ?? 0;
  const pendingCount = reportData?.pendingCount ?? 0;
  const totalCustomers = reportData?.totalCustomers ?? 0;

  return (
    <View style={styles.screen}>
      <AppHeader
        title="उधारी अहवाल"
        showBack={true}
        onBackPress={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Financial Summary Dashboard */}
        <View style={styles.dashboardContainer}>
          <View style={styles.mainTotalCard}>
            <View style={styles.mainTotalLeft}>
              <View style={styles.iconCircle}>
                <TrendingDown size={22} color="#DC2626" />
              </View>
              <View style={styles.mainTotalTextGroup}>
                <Text style={styles.mainTotalLabel}>एकूण बाकी उधारी (Total Udhar)</Text>
                <Text style={styles.mainTotalValue}>₹{totalUdhar.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>बाकीदार ग्राहक</Text>
              <Text style={[styles.statBoxValue, { color: '#DC2626' }]}>{pendingCount}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statBoxLabel}>एकूण ग्राहक</Text>
              <Text style={styles.statBoxValue}>{totalCustomers}</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <AppSearch
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="उधारी ग्राहक शोधा..."
        />

        {/* Filter Toggle Buttons */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filterMode === 'pending' && styles.filterBtnActive]}
            onPress={() => setFilterMode('pending')}
          >
            <Text style={[styles.filterBtnText, filterMode === 'pending' && styles.filterBtnTextActive]}>
              बाकी असलेले ({pendingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filterMode === 'all' && styles.filterBtnActive]}
            onPress={() => setFilterMode('all')}
          >
            <Text style={[styles.filterBtnText, filterMode === 'all' && styles.filterBtnTextActive]}>
              सर्व ग्राहक ({customersList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Customer Cards List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>उधारी अहवाल लोड होत आहे...</Text>
          </View>
        ) : filteredCustomers.length > 0 ? (
          <View style={styles.customerList}>
            {filteredCustomers.map((c, index) => {
              const initials = c.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const avatarColor = avatarColors[index % avatarColors.length];
              const udhari = c.udhariBalance ?? 0;
              const isPending = udhari > 0;

              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.customerCard}
                  activeOpacity={0.85}
                  onPress={() => setSelectedCustomer(c)}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>

                    <View style={styles.customerHeaderInfo}>
                      <Text style={styles.customerName}>{c.name}</Text>
                      <View style={styles.subInfoRow}>
                        {c.location ? (
                          <View style={styles.subInfoItem}>
                            <MapPin size={11} color={colors.textMuted} />
                            <Text style={styles.subInfoText}>{c.location}</Text>
                          </View>
                        ) : null}
                        {c.phone ? (
                          <View style={styles.subInfoItem}>
                            <Phone size={11} color={colors.textMuted} />
                            <Text style={styles.subInfoText}>{c.phone}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <ChevronRight size={20} color={colors.textMuted} />
                  </View>

                  {/* Udhar Balance Amounts Grid */}
                  <View style={styles.amountsGrid}>
                    <View style={styles.amountBox}>
                      <Text style={styles.amountLabel}>एकूण काम</Text>
                      <Text style={styles.amountVal}>₹{(c.totalWork ?? 0).toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.amountBox}>
                      <Text style={styles.amountLabel}>जमा रक्कम</Text>
                      <Text style={[styles.amountVal, { color: '#059669' }]}>
                        ₹{(c.totalPaid ?? 0).toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={styles.amountBox}>
                      <Text style={styles.amountLabel}>बाकी उधारी</Text>
                      <Text style={[styles.amountVal, { color: isPending ? '#DC2626' : '#059669' }]}>
                        ₹{udhari.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* Promised Payment Date Tag if present */}
                  {c.expectedPaymentDate && isPending ? (
                    <View style={styles.promisedTag}>
                      <Calendar size={13} color={colors.primary} />
                      <Text style={styles.promisedTagText}>
                        आपक्षित देय तारीख: <Text style={styles.promisedDateVal}>{c.expectedPaymentDate}</Text>
                      </Text>
                    </View>
                  ) : null}

                  {/* Send on WhatsApp Button */}
                  {isPending ? (
                    <TouchableOpacity
                      style={styles.whatsAppCardBtn}
                      activeOpacity={0.85}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        sendCustomerUdharOnWhatsApp({
                          customerName: c.name,
                          phone: c.phone,
                          location: c.location,
                          totalWork: c.totalWork,
                          totalPaid: c.totalPaid,
                          udhariBalance: udhari,
                          expectedPaymentDate: c.expectedPaymentDate,
                        });
                      }}
                    >
                      <Share2 size={13} color="#FFFFFF" />
                      <Text style={styles.whatsAppCardBtnText}>WhatsApp वर उधारी पाठवा</Text>
                    </TouchableOpacity>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Users size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>उधारी माहिती आढळली नाही</Text>
            <Text style={styles.emptySubtitle}>कोणत्याही ग्राहकाची उधारी बाकी नाही</Text>
          </View>
        )}
      </ScrollView>
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
    gap: 14,
  },
  dashboardContainer: {
    gap: 10,
  },
  mainTotalCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 5,
    borderLeftColor: '#DC2626',
    ...shadows.sm,
  },
  mainTotalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTotalTextGroup: {
    gap: 2,
  },
  mainTotalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  mainTotalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#DC2626',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.xs,
  },
  statBoxLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '600',
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radii.lg,
    padding: 3,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radii.md,
  },
  filterBtnActive: {
    backgroundColor: colors.white,
    ...shadows.xs,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  customerList: {
    gap: 12,
  },
  customerCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    ...shadows.xs,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  customerHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  subInfoText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  amountsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radii.lg,
    padding: 8,
  },
  amountBox: {
    flex: 1,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: '600',
    marginBottom: 2,
  },
  amountVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  promisedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.md,
  },
  promisedTagText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  promisedDateVal: {
    fontWeight: '700',
    color: '#B45309',
  },
  whatsAppCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    marginTop: 4,
  },
  whatsAppCardBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.textTertiary,
    fontSize: 12,
  },
});

export default UdharReportScreen;
