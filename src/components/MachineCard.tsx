import tw from 'twrnc';
import { View, Text } from 'react-native';
import React from 'react';
import { Truck } from 'lucide-react-native';
import { Machine } from '../types/machine';
import { formatCurrency } from '../utils/currency';
import { colors, radii, shadows } from '../theme';

interface MachineCardProps {
  machine: Machine;
  onSelect?: (machine: Machine) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({ machine, onSelect }) => {
  return (
    <View
      style={tw`bg-white rounded-xl p-4 border border-[${colors.border}] flex flex-row items-center justify-between`}
    >
      <View style={tw`flex flex-row items-center gap-3`}>
        <View style={tw`w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 items-center justify-center`}>
          <Truck size={20} color="#D97706" />
        </View>
        <View>
          <Text style={tw`font-bold text-[${colors.textPrimary}] text-sm`}>{machine.name}</Text>
          <Text style={tw`text-[11px] text-[${colors.textTertiary}] font-mono mt-0.5`}>{machine.registrationNumber}</Text>
        </View>
      </View>
      <View style={tw`items-end`}>
        <Text style={tw`text-xs font-bold text-[${colors.earnings}]`}>
          {formatCurrency(machine.hourlyRate)}
        </Text>
        <Text style={tw`text-[10px] text-[${colors.textMuted}]`}>/तास</Text>
      </View>
    </View>
  );
};

export default MachineCard;
