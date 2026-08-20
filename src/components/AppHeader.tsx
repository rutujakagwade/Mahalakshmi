import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { ArrowLeft, Menu, Bell, Plus, Calendar, Settings, MoreVertical } from 'lucide-react-native';
import { colors } from '../theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showMenu?: boolean;
  onMenuPress?: () => void;
  rightActionIcon?: 'bell' | 'plus' | 'calendar' | 'settings' | 'more' | 'none';
  unreadBadgeCount?: number;
  onRightActionPress?: () => void;
  // Second right icon (e.g. bell alongside calendar)
  secondRightIcon?: 'bell' | 'calendar' | 'none';
  secondUnreadBadgeCount?: number;
  onSecondRightActionPress?: () => void;
  variant?: 'default' | 'large';
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  showMenu = false,
  onMenuPress,
  rightActionIcon = 'none',
  unreadBadgeCount = 0,
  onRightActionPress,
  secondRightIcon = 'none',
  secondUnreadBadgeCount = 0,
  onSecondRightActionPress,
  variant = 'default',
}) => {
  return (
    <View style={tw`bg-[${colors.primary}] pt-14 pb-4 px-4 flex flex-row items-center justify-between`}>
      {/* Left: Menu or Back */}
      <View style={tw`w-11 flex flex-row items-center`}>
        {showBack && (
          <TouchableOpacity
            onPress={onBackPress}
            style={tw`p-2 rounded-xl bg-white/10`}
            accessibilityLabel="Back"
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
        )}
        {showMenu && (
          <TouchableOpacity
            onPress={onMenuPress}
            style={tw`p-2 rounded-xl bg-white/10`}
            accessibilityLabel="Menu"
            activeOpacity={0.7}
          >
            <Menu size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {/* Center: Title */}
      <View style={tw`flex-1 items-center justify-center`}>
        <Text style={tw`font-bold text-base text-white text-center`}>
          {title}
        </Text>
        {subtitle && (
          <Text style={tw`text-[11px] text-amber-200/90 font-medium text-center mt-0.5`}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right: Up to two action icons */}
      <View style={tw`flex flex-row items-center gap-1 justify-end`}>
        {/* Primary right icon */}
        {rightActionIcon === 'bell' && (
          <TouchableOpacity
            onPress={onRightActionPress}
            style={tw`p-2 rounded-xl bg-white/10 relative`}
            accessibilityLabel="Notifications"
            activeOpacity={0.7}
          >
            <Bell size={18} color="white" />
            <View style={tw`absolute top-1 right-1 w-2.5 h-2.5 ${unreadBadgeCount > 0 ? 'bg-red-500' : 'bg-amber-400'} rounded-full`} />
          </TouchableOpacity>
        )}
        {rightActionIcon === 'calendar' && (
          <TouchableOpacity
            onPress={onRightActionPress}
            style={tw`p-2 rounded-xl bg-white/10`}
            accessibilityLabel="Calendar"
            activeOpacity={0.7}
          >
            <Calendar size={18} color="white" />
          </TouchableOpacity>
        )}
        {rightActionIcon === 'plus' && (
          <TouchableOpacity
            onPress={onRightActionPress}
            style={tw`p-2 rounded-xl bg-white/10`}
            accessibilityLabel="Add"
            activeOpacity={0.7}
          >
            <Plus size={20} color="white" />
          </TouchableOpacity>
        )}
        {rightActionIcon === 'settings' && (
          <TouchableOpacity
            onPress={onRightActionPress}
            style={tw`p-2 rounded-xl bg-white/10`}
            accessibilityLabel="Settings"
            activeOpacity={0.7}
          >
            <Settings size={18} color="white" />
          </TouchableOpacity>
        )}
        {rightActionIcon === 'more' && (
          <TouchableOpacity
            onPress={onRightActionPress}
            style={tw`p-2 rounded-xl bg-white/10`}
            accessibilityLabel="More"
            activeOpacity={0.7}
          >
            <MoreVertical size={18} color="white" />
          </TouchableOpacity>
        )}

        {/* Second right icon */}
        {secondRightIcon === 'bell' && (
          <TouchableOpacity
            onPress={onSecondRightActionPress}
            style={tw`p-2 rounded-xl bg-white/10 relative`}
            accessibilityLabel="Notifications"
            activeOpacity={0.7}
          >
            <Bell size={18} color="white" />
            <View style={tw`absolute top-1 right-1 w-2.5 h-2.5 ${secondUnreadBadgeCount > 0 ? 'bg-red-500' : 'bg-amber-400'} rounded-full`} />
          </TouchableOpacity>
        )}
        {secondRightIcon === 'calendar' && (
          <TouchableOpacity
            onPress={onSecondRightActionPress}
            style={tw`p-2 rounded-xl bg-white/10`}
            accessibilityLabel="Calendar"
            activeOpacity={0.7}
          >
            <Calendar size={18} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default AppHeader;
