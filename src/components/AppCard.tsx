import React from 'react';
import { View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import tw from 'twrnc';
import { colors, radii, shadows } from '../theme';

interface AppCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  padding = 'md',
  style,
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  const variantStyles = {
    default: `bg-white border border-[${colors.border}]`,
    elevated: `bg-white`,
    outlined: `bg-transparent border border-[${colors.border}]`,
    filled: `bg-[${colors.surfaceSecondary}]`,
  };

  const shadowStyle = variant === 'elevated' ? shadows.md : shadows.xs;

  const container = (
    <View
      style={[
        tw`rounded-xl ${paddingStyles[padding]} ${variantStyles[variant]} ${className}`,
        variant === 'elevated' || variant === 'default' ? shadowStyle : {},
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onClick) {
    return (
      <TouchableOpacity onPress={onClick} activeOpacity={0.7}>
        {container}
      </TouchableOpacity>
    );
  }

  return container;
};

export default AppCard;
