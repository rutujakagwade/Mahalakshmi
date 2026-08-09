import tw from 'twrnc';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import React from 'react';
import { X, Home, FileText, Truck, Users, BarChart3, Calendar, Settings, LogOut } from 'lucide-react-native';
import { ActiveScreen } from '../types/navigation';

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
    { id: 'Dashboard', label: 'डॅशबोर्ड', icon: <Home size={18} color={activeScreen === 'Dashboard' ? '#6B121C' : '#6B7280'} /> },
    { id: 'DailyEntry', label: 'रोजचा हिशोब', icon: <FileText size={18} color={activeScreen === 'DailyEntry' ? '#6B121C' : '#6B7280'} /> },
    { id: 'MachineEntry', label: 'मशीन नोंद', icon: <Truck size={18} color={activeScreen === 'MachineEntry' ? '#6B121C' : '#6B7280'} /> },
    { id: 'CustomerList', label: 'ग्राहक यादी', icon: <Users size={18} color={activeScreen === 'CustomerList' ? '#6B121C' : '#6B7280'} /> },
    { id: 'DateReport', label: 'तारीखनुसार हिशोब', icon: <Calendar size={18} color={activeScreen === 'DateReport' ? '#6B121C' : '#6B7280'} /> },
    { id: 'MonthlyReport', label: 'मासिक व मशीन रिपोर्ट', icon: <BarChart3 size={18} color={activeScreen === 'MonthlyReport' ? '#6B121C' : '#6B7280'} /> },
    { id: 'Settings', label: 'सेटिंग', icon: <Settings size={18} color={activeScreen === 'Settings' ? '#6B121C' : '#6B7280'} /> },
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
        <View style={tw`w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10`}>
          <View>
            {/* Header */}
            <View style={tw`bg-[#6B121C] p-4 flex flex-row items-center justify-between`}>
              <View>
                <Text style={tw`font-bold text-base text-white leading-tight`}>महालक्ष्मी</Text>
                <Text style={tw`text-xs text-amber-200`}>इन्फ्रा अँड अर्थमूव्हर्स</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={tw`p-1 rounded-full`}
              >
                <X size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={tw`py-2 px-2 gap-1`}>
              {menuItems.map((item) => {
                const isActive = activeScreen === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    style={tw`w-full flex flex-row items-center gap-3 px-3 py-2.5 rounded-xl ${
                      isActive ? 'bg-amber-100' : ''
                    }`}
                  >
                    {item.icon}
                    <Text style={tw`text-xs font-bold ${isActive ? 'text-[#6B121C]' : 'text-stone-700'}`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Footer Logout */}
          <View style={tw`p-3 border-t border-stone-200`}>
            <TouchableOpacity
              onPress={() => {
                onLogout();
                onClose();
              }}
              style={tw`w-full flex flex-row items-center justify-center gap-2 py-2.5 px-3 bg-red-50 rounded-xl`}
            >
              <LogOut size={16} color="#DC2626" />
              <Text style={tw`text-red-600 font-bold text-xs`}>लॉगआउट करा</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DrawerNavigator;
