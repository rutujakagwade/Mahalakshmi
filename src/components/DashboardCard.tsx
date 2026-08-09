import tw from 'twrnc';
import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { formatCurrency } from '../utils/currency';

interface MetricSummaryProps {
  earnings: number;
  expense: number;
  profit: number;
}

export const MetricSummaryRow: React.FC<MetricSummaryProps> = ({ earnings, expense, profit }) => {
  return (
    <View style={tw`flex flex-row justify-between w-full gap-2`}>
      {/* Earnings */}
      <View style={tw`flex-1 bg-white border border-stone-200/60 rounded-xl p-2.5 flex flex-col items-center justify-center shadow-sm`}>
        <Text style={tw`text-[11px] font-semibold text-stone-600 mb-0.5`}>आजची कमाई</Text>
        <View style={tw`flex flex-row items-center gap-1`}>
          <Text style={tw`text-stone-900 font-extrabold text-xs sm:text-sm`}>{formatCurrency(earnings)}</Text>
          <TrendingUp size={14} color="#15803D" />
        </View>
      </View>

      {/* Expense */}
      <View style={tw`flex-1 bg-white border border-stone-200/60 rounded-xl p-2.5 flex flex-col items-center justify-center shadow-sm`}>
        <Text style={tw`text-[11px] font-semibold text-stone-600 mb-0.5`}>आजचा खर्च</Text>
        <View style={tw`flex flex-row items-center gap-1`}>
          <Text style={tw`text-stone-900 font-extrabold text-xs sm:text-sm`}>{formatCurrency(expense)}</Text>
          <TrendingDown size={14} color="#DC2626" />
        </View>
      </View>

      {/* Profit */}
      <View style={tw`flex-1 bg-white border border-stone-200/60 rounded-xl p-2.5 flex flex-col items-center justify-center shadow-sm`}>
        <Text style={tw`text-[11px] font-semibold text-stone-600 mb-0.5`}>आजचा नफा</Text>
        <View style={tw`flex flex-row items-center gap-1`}>
          <Text style={tw`text-stone-900 font-extrabold text-xs sm:text-sm`}>{formatCurrency(profit)}</Text>
          <TrendingUp size={14} color="#15803D" />
        </View>
      </View>
    </View>
  );
};

interface ActionTileProps {
  title: string;
  bgColor: string;
  icon: React.ReactNode;
  onPress: () => void;
}

export const ActionTileCard: React.FC<ActionTileProps> = ({ title, bgColor, icon, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={tw`flex-1 bg-white border border-stone-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-sm`}
    >
      <View
        style={tw`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${bgColor}`}
      >
        {icon}
      </View>
      <Text style={tw`font-bold text-xs sm:text-sm text-stone-800 text-center leading-snug`}>{title}</Text>
    </TouchableOpacity>
  );
};

export default MetricSummaryRow;
