import tw from 'twrnc';
import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { Delete, Fingerprint } from 'lucide-react-native';

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

  // Helper to chunk keypad keys into rows
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <View style={tw`flex flex-col items-center gap-6 w-full max-w-xs mx-auto`}>
      {/* 4 PIN Boxes */}
      <View style={tw`flex flex-row items-center gap-3 my-4`}>
        {pinDigits.map((digit, idx) => (
          <View
            key={idx}
            style={tw`w-14 h-14 rounded-xl border-2 flex items-center justify-center shadow-sm ${
              digit ? 'border-[#6B121C] bg-red-50' : 'border-stone-300 bg-white'
            }`}
          >
            <Text style={tw`text-2xl font-bold text-[#6B121C]`}>
              {digit ? '●' : ' '}
            </Text>
          </View>
        ))}
      </View>

      {/* Numeric Keypad Grid using flex rows */}
      <View style={tw`w-full px-2`}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={tw`flex flex-row justify-between mb-4 gap-4`}>
            {row.map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => onKeyPress(num)}
                style={tw`flex-1 h-14 bg-white border border-stone-200 rounded-full flex items-center justify-center shadow-sm`}
              >
                <Text style={tw`text-xl font-semibold text-stone-800`}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Bottom Row */}
        <View style={tw`flex flex-row justify-between gap-4`}>
          <TouchableOpacity
            onPress={onFingerprint}
            style={tw`flex-1 h-14 bg-stone-100 border border-stone-200 rounded-full flex items-center justify-center shadow-sm`}
          >
            <Fingerprint size={24} color="#6B121C" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onKeyPress('0')}
            style={tw`flex-1 h-14 bg-white border border-stone-200 rounded-full flex items-center justify-center shadow-sm`}
          >
            <Text style={tw`text-xl font-semibold text-stone-800`}>0</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            style={tw`flex-1 h-14 bg-stone-100 border border-stone-200 rounded-full flex items-center justify-center shadow-sm`}
          >
            <Delete size={22} color="#444444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default PinInput;
