import tw from 'twrnc';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import React from 'react';
import { X, Home, TrendingUp, TrendingDown, Truck, Users, BarChart3, Calendar, Settings, LogOut, Bell } from 'lucide-react-native';
import { ActiveScreen } from '../types/navigation';
import { colors, radii, shadows } from '../theme';

interface DrawerNavigatorProps {
  isOpen: boolean;
  onClose: () => void;
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  onLogout: () => void;
}

export const DrawerNavigator: React.FC<DrawerNavigatorProps> = ({
  isOpen,
  onClose,
  activeScreen,
  onNavigate,
  onLogout,
}) => {
  const menuItems: { id: ActiveScreen; label: string; icon: React.ReactNode }[] = [
    { id: 'Dashboard', label: 'डॅशबोर्ड', icon: <Home size={18} color={activeScreen === 'Dashboard' ? colors.primary : colors.textMuted} /> },
    { id: 'KamaiEntry', label: 'कमाई (आवक)', icon: <TrendingUp size={18} color={activeScreen === 'KamaiEntry' ? colors.primary : colors.textMuted} /> },
    { id: 'KharchEntry', label: 'खर्च (जावक)', icon: <TrendingDown size={18} color={activeScreen === 'KharchEntry' ? colors.primary : colors.textMuted} /> },
    { id: 'MachineEntry', label: 'मशीन नोंद', icon: <Truck size={18} color={activeScreen === 'MachineEntry' ? colors.primary : colors.textMuted} /> },
    { id: 'CustomerList', label: 'ग्राहक यादी', icon: <Users size={18} color={activeScreen === 'CustomerList' ? colors.primary : colors.textMuted} /> },
    { id: 'CalendarView', label: 'कॅलेंडर हिशोब', icon: <Calendar size={18} color={activeScreen === 'CalendarView' ? colors.primary : colors.textMuted} /> },
    { id: 'DateReport', label: 'तारीखनुसार अहवाल', icon: <Calendar size={18} color={activeScreen === 'DateReport' ? colors.primary : colors.textMuted} /> },
    { id: 'MonthlyReport', label: 'मासिक व मशीन रिपोर्ट', icon: <BarChart3 size={18} color={activeScreen === 'MonthlyReport' ? colors.primary : colors.textMuted} /> },
    { id: 'UdharReport', label: 'उधारी अहवाल', icon: <Users size={18} color={activeScreen === 'UdharReport' ? colors.primary : colors.textMuted} /> },
    { id: 'NotificationList', label: 'सूचना व संदेश', icon: <Bell size={18} color={activeScreen === 'NotificationList' ? colors.primary : colors.textMuted} /> },
    { id: 'Settings', label: 'ॲप सेटिंग्ज', icon: <Settings size={18} color={activeScreen === 'Settings' ? colors.primary : colors.textMuted} /> },
  ];



  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 flex-row`}>
        {/* Backdrop */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={tw`absolute inset-0 bg-black/60`}
        />

        {/* Drawer Panel */}
        <View style={tw`w-72 max-w-[80vw] bg-white h-full flex flex-col justify-between z-10`}>
          <View>
            {/* Header */}
            <View style={tw`bg-[${colors.primary}] pt-14 pb-5 px-5`}>
              <View style={tw`flex flex-row items-center justify-between`}>
                <View>
                  <Text style={tw`font-bold text-lg text-white leading-tight`}>महालक्ष्मी</Text>
                  <Text style={tw`text-xs text-amber-200/90 mt-0.5`}>इन्फ्रा अँड अर्थमूव्हर्स</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={tw`p-2 rounded-xl bg-white/10`}
                  activeOpacity={0.7}
                >
                  <X size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Menu Items */}
            <View style={tw`py-3 px-3 gap-1`}>
              {menuItems.map((item) => {
                const isActive = activeScreen === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    activeOpacity={0.7}
                    style={tw`w-full flex flex-row items-center gap-3 px-4 py-3 rounded-xl ${
                      isActive ? `bg-[${colors.primarySurface}]` : ''
                    }`}
                  >
                    {item.icon}
                    <Text style={tw`text-xs font-bold ${isActive ? `text-[${colors.primary}]` : `text-[${colors.textSecondary}]`}`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Footer Logout */}
          <View style={tw`p-4 border-t border-[${colors.border}]`}>
            <TouchableOpacity
              onPress={() => {
                onLogout();
                onClose();
              }}
              activeOpacity={0.7}
              style={tw`w-full flex flex-row items-center justify-center gap-2 py-3 px-3 bg-[${colors.errorBg}] rounded-xl border border-red-200`}
            >
              <LogOut size={16} color={colors.error} />
              <Text style={tw`text-[${colors.error}] font-bold text-xs`}>लॉगआउट करा</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DrawerNavigator;
