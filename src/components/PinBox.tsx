import tw from 'twrnc';
import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { Delete, Fingerprint } from 'lucide-react-native';
import { colors, radii, shadows } from '../theme';

interface PinInputProps {
  pin: string;
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onFingerprint?: () => void;
}

export const PinInput: React.FC<PinInputProps> = ({
  pin,
  onKeyPress,
  onDelete,
  onFingerprint,
}) => {
  const pinDigits = [0, 1, 2, 3].map((i) => pin[i] || '');

  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <View style={tw`flex flex-col items-center gap-6 w-full max-w-xs mx-auto`}>
      {/* PIN Boxes */}
      <View style={tw`flex flex-row items-center gap-3 my-4`}>
        {pinDigits.map((digit, idx) => (
          <View
            key={idx}
            style={tw`w-14 h-14 rounded-2xl border-2 flex items-center justify-center ${
              digit
                ? `border-[${colors.primary}] bg-[${colors.primarySurface}]`
                : `border-[${colors.border}] bg-white`
            }`}
          >
            <Text style={tw`text-2xl font-bold text-[${colors.primary}]`}>
              {digit ? '●' : ' '}
            </Text>
          </View>
        ))}
      </View>

      {/* Numeric Keypad */}
      <View style={tw`w-full px-2`}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={tw`flex flex-row justify-between mb-4 gap-4`}>
            {row.map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => onKeyPress(num)}
                activeOpacity={0.6}
                style={tw`flex-1 h-14 bg-white border border-[${colors.border}] rounded-2xl flex items-center justify-center`}
              >
                <Text style={tw`text-xl font-semibold text-[${colors.textPrimary}]`}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Bottom Row */}
        <View style={tw`flex flex-row justify-between gap-4`}>
          <TouchableOpacity
            onPress={onFingerprint}
            activeOpacity={0.6}
            style={tw`flex-1 h-14 bg-[${colors.surfaceTertiary}] border border-[${colors.border}] rounded-2xl flex items-center justify-center`}
          >
            <Fingerprint size={24} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onKeyPress('0')}
            activeOpacity={0.6}
            style={tw`flex-1 h-14 bg-white border border-[${colors.border}] rounded-2xl flex items-center justify-center`}
          >
            <Text style={tw`text-xl font-semibold text-[${colors.textPrimary}]`}>0</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            activeOpacity={0.6}
            style={tw`flex-1 h-14 bg-[${colors.surfaceTertiary}] border border-[${colors.border}] rounded-2xl flex items-center justify-center`}
          >
            <Delete size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default PinInput;
