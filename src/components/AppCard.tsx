import React from 'react';
import { View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import tw from 'twrnc';

interface AppCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const AppCard: React.FC<AppCardProps> = ({ children, className = '', onClick, style }) => {
  if (onClick) {
    return (
      <TouchableOpacity
        onPress={onClick}
        style={[tw`bg-white rounded-xl p-3 border border-stone-200/80 shadow-sm ${className}`, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <View
      style={[tw`bg-white rounded-xl p-3 border border-stone-200/80 shadow-sm ${className}`, style]}
    >
      {children}
    </View>
  );
};

export default AppCard;
