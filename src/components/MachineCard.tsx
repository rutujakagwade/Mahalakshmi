import tw from 'twrnc';
import { View, Text } from 'react-native';
import React from 'react';
import { Machine } from '../types/machine';
import { Truck } from 'lucide-react-native';
import { formatCurrency } from '../utils/currency';

interface MachineCardProps {
  machine: Machine;
  onSelect?: (machine: Machine) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({ machine, onSelect }) => {
  return (
    <View
      onPress={() => onSelect && onSelect(machine)}
      style={tw`bg-white rounded-xl p-3 border border-stone-200 flex items-center justify-between shadow-2xs hover:shadow-xs transition cursor-pointer`}
    >
      <View style={tw`flex items-center gap-3`}>
        <View style={tw`w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white`}>
          <Truck size={20} />
        </View>
        <View>
          <Text style={tw`font-bold text-stone-900 text-sm`}>{machine.name}</Text>
          <Text style={tw`text-xs text-stone-500 font-mono`}>{machine.registrationNumber}</Text>
        </View>
      </View>
      <View style={tw`text-right`}>
        <Text style={tw`text-xs font-semibold text-emerald-700`}>
          {formatCurrency(machine.hourlyRate)}/तास
        </Text>
      </View>
    </View>
  );
};

export default MachineCard;
