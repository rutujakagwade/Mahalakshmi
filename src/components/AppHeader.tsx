import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { ArrowLeft, Menu, Bell, Plus, Calendar, Settings } from 'lucide-react-native';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showMenu?: boolean;
  onMenuPress?: () => void;
  rightActionIcon?: 'bell' | 'plus' | 'calendar' | 'settings' | 'none';
  onRightActionPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  showMenu = false,
  onMenuPress,
  rightActionIcon = 'none',
  onRightActionPress,
}) => {
  return (
    <View style={tw`bg-[#6B121C] pt-14 pb-3 px-4 flex flex-row items-center justify-between shadow-md`}>
      <View style={tw`w-10 flex flex-row items-center`}>
        {showBack && (
          <TouchableOpacity
            onPress={onBackPress}
            style={tw`p-1 rounded-full`}
            accessibilityLabel="Back"
          >
            <ArrowLeft size={22} color="white" />
          </TouchableOpacity>
        )}
        {showMenu && (
          <TouchableOpacity
            onPress={onMenuPress}
            style={tw`p-1 rounded-full`}
            accessibilityLabel="Menu"
          >
            <Menu size={22} color="white" />
          </TouchableOpacity>
        )}
      </View>

      <View style={tw`flex-1 items-center justify-center`}>
        <Text style={tw`font-bold text-base text-white text-center`}>
          {title}
        </Text>
        {subtitle && (
          <Text style={tw`text-[11px] text-amber-200 opacity-90 font-medium text-center`}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={tw`w-10 flex flex-row items-center justify-end`}>
        {rightActionIcon === 'bell' && (
          <TouchableOpacity
            onPress={onRightActionPress}
            style={tw`p-1.5 rounded-full relative`}
            accessibilityLabel="Notifications"
          >
            <Bell size={20} color="white" />
            <View style={tw`absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full`} />
          </TouchableOpacity>
        )}
        {rightActionIcon === 'plus' && (
          <TouchableOpacity
            onPress={onRightActionPress}
            style={tw`p-1.5 rounded-full`}
            accessibilityLabel="Add"
          >
            <Plus size={22} color="white" />
          </TouchableOpacity>
        )}
        {rightActionIcon === 'calendar' && (
          <TouchableOpacity
            onPress={onRightActionPress}
            style={tw`p-1.5 rounded-full`}
            accessibilityLabel="Calendar"
          >
            <Calendar size={20} color="white" />
          </TouchableOpacity>
        )}
        {rightActionIcon === 'settings' && (
          <TouchableOpacity
            onPress={onRightActionPress}
            style={tw`p-1.5 rounded-full`}
            accessibilityLabel="Settings"
          >
            <Settings size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default AppHeader;
