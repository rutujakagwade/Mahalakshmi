import tw from 'twrnc';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Bell,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  IndianRupee,
  HardHat,
  List,
  Warehouse,
  Menu,
  Truck,
  CreditCard,
} from 'lucide-react-native';
import { ActiveScreen } from '../../types/navigation';
import { DashboardService } from '../../utils/api';
import { formatCurrency } from '../../utils/currency';
import { colors } from '../../theme';

interface DashboardScreenProps {
  onNavigate: (screen: ActiveScreen) => void;
  onOpenDrawer?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate, onOpenDrawer }) => {
  const [summary, setSummary] = useState({ earnings: 0, expense: 0, profit: 0 });
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [outstandingAmount, setOutstandingAmount] = useState(0);
  const [userName, setUserName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const dateStr = today.toLocaleDateString('mr-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const fetchDashboard = async () => {
    try {
      const data = await DashboardService.getSummary();
      if (data?.todaySummary) {
        setSummary({
          earnings: Number(data.todaySummary.earnings) || 0,
          expense: Number(data.todaySummary.expense) || 0,
          profit: Number(data.todaySummary.profit) || 0,
        });
        setTotalJobs(Number(data.totalJobs) || 0);
        setTotalCustomers(Number(data.totalCustomers) || 0);
        setOutstandingAmount(Number(data.outstandingAmount) || 0);
        if (data.userName) {
          setUserName(data.userName);
        }
      }
    } catch {
      // Offline mode
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, []);

  const quickAccessItems = [
    { label: 'नवीन काम', icon: <FileText size={24} color="white" />, bgColor: '#16A34A', screen: 'NavinKam' as ActiveScreen },
    { label: 'चालू कामे', icon: <Truck size={24} color="white" />, bgColor: '#0D9488', screen: 'ChaluKamList' as ActiveScreen },
    { label: 'कमाई', icon: <IndianRupee size={24} color="white" />, bgColor: '#16A34A', screen: 'KamaiEntry' as ActiveScreen },
    { label: 'खर्च', icon: <IndianRupee size={24} color="white" />, bgColor: '#DC2626', screen: 'KharchEntry' as ActiveScreen },
    { label: 'मजूर यादी', icon: <Users size={24} color="white" />, bgColor: '#7C3AED', screen: 'MajurYadi' as ActiveScreen },
    { label: 'मासिक रिपोर्ट', icon: <List size={24} color="white" />, bgColor: '#2563EB', screen: 'MonthlyReport' as ActiveScreen },
    { label: 'ग्राहक यादी', icon: <Users size={24} color="white" />, bgColor: '#7C3AED', screen: 'CustomerList' as ActiveScreen },
    { label: 'सेटिंग', icon: <Warehouse size={24} color="white" />, bgColor: '#374151', screen: 'Settings' as ActiveScreen },
    { label: 'माझं Loan', icon: <CreditCard size={24} color="white" />, bgColor: '#D97706', screen: 'MyLoan' as ActiveScreen },
    { label: 'खर्च अहवाल', icon: <TrendingDown size={24} color="white" />, bgColor: '#DC2626', screen: 'KharchReport' as ActiveScreen },
    { label: 'उधारी अहवाल', icon: <TrendingUp size={24} color="white" />, bgColor: '#7C3AED', screen: 'UdharReport' as ActiveScreen },
    { label: 'तारखेनुसार हिशोब', icon: <Calendar size={24} color="white" />, bgColor: '#0D9488', screen: 'DateReport' as ActiveScreen },
  ];

  return (
    <View style={tw`flex-1 w-full bg-[${colors.background}]`}>
      <View style={tw`flex-1`}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={onOpenDrawer}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Menu size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>महालक्ष्मी इन्फ्रा</Text>
            </View>

            <TouchableOpacity
              onPress={() => onNavigate('NotificationList')}
              style={styles.headerIconBtn}
              activeOpacity={0.7}
            >
              <Bell size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`p-4 max-w-lg mx-auto w-full pb-8`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
              title="अपडेट होत आहे..."
              titleColor={colors.textSecondary}
            />
          }
        >
          {/* Greeting Card */}
          <View style={styles.greetingCard}>
            <View style={tw`flex-1`}>
              <Text style={styles.greetingText}>नमस्कार {userName || 'भरत'}!</Text>
              <Text style={styles.greetingDate}>{dateStr}</Text>
            </View>
            <TouchableOpacity
              onPress={() => onNavigate('CalendarView')}
              style={styles.calendarIconBtn}
              activeOpacity={0.7}
            >
              <Calendar size={22} color="white" />
            </TouchableOpacity>
          </View>

          {/* 2x2 Summary Grid */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: '#0A7A30' }]}>
                <View style={styles.texStripe1} />
                <View style={styles.texStripe2} />
                <View style={styles.texCircle} />
                <View style={styles.texDot} />
                <View style={styles.cardContent}>
                  <Text style={styles.summaryCardLabel}>एकूण कामे</Text>
                  <Text style={styles.summaryCardValue}>{totalJobs}</Text>
                </View>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#0C59C3' }]}>
                <View style={styles.texStripe1} />
                <View style={styles.texStripe2} />
                <View style={styles.texCircle} />
                <View style={styles.texDot} />
                <View style={styles.cardContent}>
                  <Text style={styles.summaryCardLabel}>एकूण ग्राहक</Text>
                  <Text style={styles.summaryCardValue}>{totalCustomers}</Text>
                </View>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onNavigate('KamaiEntry')}
                style={[styles.summaryCard, { backgroundColor: '#D88B19' }]}
              >
                <View style={styles.texStripe1} />
                <View style={styles.texStripe2} />
                <View style={styles.texCircle} />
                <View style={styles.texDot} />
                <View style={styles.cardContent}>
                  <Text style={styles.summaryCardLabel}>एकूण कमाई</Text>
                  <Text style={styles.summaryCardAmount}>{formatCurrency(summary.earnings)}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onNavigate('KharchEntry')}
                style={[styles.summaryCard, { backgroundColor: '#CD3F3B' }]}
              >
                <View style={styles.texStripe1} />
                <View style={styles.texStripe2} />
                <View style={styles.texCircle} />
                <View style={styles.texDot} />
                <View style={styles.cardContent}>
                  <Text style={styles.summaryCardLabel}>एकूण खर्च</Text>
                  <Text style={styles.summaryCardAmount}>{formatCurrency(summary.expense)}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Profit Row */}
          <View style={styles.profitRow}>
            <View style={[styles.profitCard, { backgroundColor: '#5438AF' }]}>
              <View style={styles.texStripe1} />
              <View style={styles.texCircleLarge} />
              <View style={styles.cardContent}>
                <Text style={[styles.profitCardLabel, { color: 'white' }]}>नफा</Text>
                <Text style={[styles.profitCardAmount, { color: 'white' }]}>
                  {formatCurrency(summary.profit)}
                </Text>
              </View>
            </View>
            <View style={[styles.profitCard, { backgroundColor: '#09857D' }]}>
              <View style={styles.texStripe1} />
              <View style={styles.texCircleLarge} />
              <View style={styles.cardContent}>
                <Text style={[styles.profitCardLabel, { color: 'white' }]}>बाकी येणे</Text>
                <Text style={[styles.profitCardAmount, { color: 'white' }]}>
                  {formatCurrency(outstandingAmount)}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Access Section - Each item in separate card */}
          <Text style={styles.quickAccessTitle}>जलद एक्सेस</Text>

          <View style={styles.quickAccessGrid}>
            {quickAccessItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickAccessCard}
                activeOpacity={0.7}
                onPress={() => onNavigate(item.screen)}
              >
                <View style={[styles.quickAccessIcon, { backgroundColor: item.bgColor }]}>
                  {item.icon}
                </View>
                <Text style={styles.quickAccessLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Header
  headerContainer: {
    backgroundColor: '#6B121C',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerLine: {
    width: 20,
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
    marginVertical: 1.5,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },

  // Greeting Card
  greetingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1917',
  },
  greetingDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716C',
    marginTop: 2,
  },
  calendarIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#7F1D1D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Summary Grid
  summaryGrid: {
    gap: 10,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    justifyContent: 'center',
    minHeight: 80,
    overflow: 'hidden',
  },
  // Texture: diagonal stripe 1
  texStripe1: {
    position: 'absolute',
    width: 180,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    top: -10,
    right: -40,
    transform: [{ rotate: '-25deg' }],
  },
  // Texture: diagonal stripe 2
  texStripe2: {
    position: 'absolute',
    width: 120,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    bottom: 8,
    left: -20,
    transform: [{ rotate: '-25deg' }],
  },
  // Texture: accent circle top-right
  texCircle: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -18,
    right: -18,
  },
  // Texture: small dot
  texDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    bottom: 12,
    right: 16,
  },
  // Texture: large circle for profit cards
  texCircleLarge: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -25,
    right: -25,
  },
  cardContent: {
    zIndex: 1,
  },
  summaryCardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 6,
  },
  summaryCardValue: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
  },
  summaryCardAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: 'white',
  },

  // Profit Row
  profitRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  profitCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    justifyContent: 'center',
    minHeight: 80,
    overflow: 'hidden',
  },
  profitCardLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  profitCardAmount: {
    fontSize: 22,
    fontWeight: '900',
  },

  // Quick Access Section - Each item separate card
  quickAccessTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 12,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAccessCard: {
    width: '22%',
    backgroundColor: 'white',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quickAccessIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickAccessLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#57534E',
    textAlign: 'center',
  },
});

export default DashboardScreen;
