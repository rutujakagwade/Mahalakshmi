import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import tw from 'twrnc';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: any;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  className = '',
  style,
}) => {
  let baseStyle = 'w-full py-3 px-4 rounded-xl font-bold flex flex-row items-center justify-center gap-2 text-center text-sm shadow-sm ';

  switch (variant) {
    case 'primary':
      baseStyle += 'bg-[#6B121C] text-white';
      break;
    case 'secondary':
      baseStyle += 'bg-[#D4AF37] text-stone-900';
      break;
    case 'outline':
      baseStyle += 'border-2 border-[#6B121C] text-[#6B121C] bg-white';
      break;
    case 'danger':
      baseStyle += 'bg-red-600 text-white';
      break;
    case 'success':
      baseStyle += 'bg-emerald-700 text-white';
      break;
  }

  if (disabled) {
    baseStyle += ' opacity-50';
  }

  const textColor = variant === 'outline' ? 'text-[#6B121C]' : (variant === 'secondary' ? 'text-stone-900' : 'text-white');

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[tw`${baseStyle} ${className}`, style]}
    >
      {icon && icon}
      <Text style={tw`${textColor} font-bold text-center`}>{title}</Text>
    </TouchableOpacity>
  );
};

export default AppButton;
