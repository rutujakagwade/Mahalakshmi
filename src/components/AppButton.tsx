import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import tw from 'twrnc';
import { colors, radii, shadows } from '../theme';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: any;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
}) => {
  const sizeStyles = {
    sm: 'py-2 px-3',
    md: 'py-3 px-4',
    lg: 'py-4 px-6',
  };

  const textSizeStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const variantStyles = {
    primary: `bg-[${colors.primary}]`,
    secondary: `bg-[${colors.gold}]`,
    outline: `border-2 border-[${colors.primary}] bg-transparent`,
    danger: `bg-[${colors.error}]`,
    success: `bg-[${colors.success}]`,
    ghost: 'bg-transparent',
  };

  const textStyles = {
    primary: 'text-white',
    secondary: 'text-stone-900',
    outline: `text-[${colors.primary}]`,
    danger: 'text-white',
    success: 'text-white',
    ghost: `text-[${colors.primary}]`,
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        tw`flex-row items-center justify-center gap-2 rounded-xl ${sizeStyles[size]} ${variantStyles[variant]} ${textSizeStyles[size]} ${fullWidth ? 'w-full' : ''}`,
        isDisabled && tw`opacity-50`,
        variant === 'primary' && shadows.sm,
        variant === 'secondary' && shadows.sm,
        variant === 'danger' && shadows.sm,
        variant === 'success' && shadows.sm,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textStyles[variant] === 'text-white' ? '#FFFFFF' : colors.primary} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View>{icon}</View>}
          <Text style={tw`font-bold ${textStyles[variant]} text-center`}>{title}</Text>
          {icon && iconPosition === 'right' && <View>{icon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};

export default AppButton;
