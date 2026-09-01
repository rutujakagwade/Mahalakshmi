import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import tw from 'twrnc';
import {
  X,
  Home,
  TrendingUp,
  TrendingDown,
  Truck,
  Users,
  BarChart3,
  Calendar,
  Settings,
  LogOut,
  Bell,
  CreditCard,
  FileText,
  ChevronRight,
} from 'lucide-react-native';
import { ActiveScreen } from '../types/navigation';

interface DrawerNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 300);

export const DrawerNavigator: React.FC<DrawerNavigatorProps> = ({
  isOpen,
  onClose,
  activeScreen,
  onNavigate,
  onLogout,
}) => {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const menuItems: { id: ActiveScreen; label: string; icon: React.ReactNode }[] = [
    {
      id: 'Dashboard',
      label: 'डॅशबोर्ड',
      icon: <Home size={19} color={activeScreen === 'Dashboard' ? '#6B121C' : '#4B5563'} />,
    },
    {
      id: 'NavinKam',
      label: 'नवीन काम नोंद',
      icon: <FileText size={19} color={activeScreen === 'NavinKam' ? '#15803D' : '#4B5563'} />,
    },
    {
      id: 'ChaluKamList',
      label: 'चालू काम यादी',
      icon: <Truck size={19} color={activeScreen === 'ChaluKamList' ? '#0D9488' : '#4B5563'} />,
    },
    {
      id: 'KamaiEntry',
      label: 'कमाई (आवक नोंद)',
      icon: <TrendingUp size={19} color={activeScreen === 'KamaiEntry' ? '#15803D' : '#4B5563'} />,
    },
    {
      id: 'KharchEntry',
      label: 'खर्च (जावक नोंद)',
      icon: <TrendingDown size={19} color={activeScreen === 'KharchEntry' ? '#DC2626' : '#4B5563'} />,
    },
    {
      id: 'MajurYadi',
      label: 'मजूर / ऑपरेटर यादी',
      icon: <Users size={19} color={activeScreen === 'MajurYadi' ? '#7C3AED' : '#4B5563'} />,
    },
    {
      id: 'CustomerList',
      label: 'ग्राहक व्यवस्थापन',
      icon: <Users size={19} color={activeScreen === 'CustomerList' ? '#2563EB' : '#4B5563'} />,
    },
    {
      id: 'MyLoan',
      label: 'माझं Loan (कर्ज खाते)',
      icon: <CreditCard size={19} color={activeScreen === 'MyLoan' ? '#D97706' : '#4B5563'} />,
    },
    {
      id: 'CalendarView',
      label: 'कॅलेंडर हिशोब',
      icon: <Calendar size={19} color={activeScreen === 'CalendarView' ? '#0D9488' : '#4B5563'} />,
    },
    {
      id: 'KharchReport',
      label: 'खर्च अहवाल',
      icon: <TrendingDown size={19} color={activeScreen === 'KharchReport' ? '#DC2626' : '#4B5563'} />,
    },
    {
      id: 'DateReport',
      label: 'तारीखनुसार अहवाल',
      icon: <Calendar size={19} color={activeScreen === 'DateReport' ? '#4F46E5' : '#4B5563'} />,
    },
    {
      id: 'MonthlyReport',
      label: 'मासिक व मशीन अहवाल',
      icon: <BarChart3 size={19} color={activeScreen === 'MonthlyReport' ? '#0284C7' : '#4B5563'} />,
    },
    {
      id: 'UdharReport',
      label: 'उधारी अहवाल',
      icon: <Users size={19} color={activeScreen === 'UdharReport' ? '#C026D3' : '#4B5563'} />,
    },
    {
      id: 'NotificationList',
      label: 'सूचना व संदेश',
      icon: <Bell size={19} color={activeScreen === 'NotificationList' ? '#EA580C' : '#4B5563'} />,
    },
    {
      id: 'Settings',
      label: 'ॲप सेटिंग्ज',
      icon: <Settings size={19} color={activeScreen === 'Settings' ? '#4B5563' : '#4B5563'} />,
    },
  ];

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* Animated Dark Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Animated Slide-in Drawer Panel */}
      <Animated.View
        style={[
          styles.drawerPanel,
          {
            width: DRAWER_WIDTH,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <Text style={styles.headerTitle}>महालक्ष्मी</Text>
            <Text style={styles.headerSubtitle}>इन्फ्रा अँड अर्थमूव्हर्स</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Menu Items */}
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {menuItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  onClose();
                  onNavigate(item.id);
                }}
                activeOpacity={0.7}
                style={[
                  styles.menuItem,
                  isActive && styles.menuItemActive,
                ]}
              >
                <View style={styles.menuIconWrap}>{item.icon}</View>
                <Text
                  style={[
                    styles.menuLabel,
                    isActive && styles.menuLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
                {isActive && <ChevronRight size={16} color="#6B121C" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer Logout */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => {
              onClose();
              onLogout();
            }}
            activeOpacity={0.8}
            style={styles.logoutBtn}
          >
            <LogOut size={18} color="#DC2626" />
            <Text style={styles.logoutText}>लॉगआउट करा</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  drawerPanel: {
    backgroundColor: 'white',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'space-between',
    elevation: 10000,
    zIndex: 10000,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    backgroundColor: '#6B121C',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 52,
    paddingBottom: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBrand: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FDE68A',
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  menuItemActive: {
    backgroundColor: '#FDF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#6B121C',
  },
  menuIconWrap: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  menuLabelActive: {
    color: '#6B121C',
    fontWeight: '800',
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default DrawerNavigator;
