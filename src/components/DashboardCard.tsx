import tw from 'twrnc';
import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react-native';
import { formatCurrency } from '../utils/currency';
import { colors, radii, shadows } from '../theme';

interface MetricSummaryProps {
  earnings: number;
  expense: number;
  profit: number;
}

export const MetricSummaryRow: React.FC<MetricSummaryProps> = ({ earnings, expense, profit }) => {
  return (
    <View style={tw`gap-3`}>
      {/* Earnings Card */}
      <View style={tw`bg-white rounded-2xl p-4 border border-[${colors.border}] flex flex-row items-center justify-between`}>
        <View style={tw`flex flex-row items-center gap-3`}>
          <View style={tw`w-10 h-10 rounded-xl bg-[${colors.earningsBg}] items-center justify-center`}>
            <TrendingUp size={18} color={colors.earnings} />
          </View>
          <View>
            <Text style={tw`text-[11px] font-semibold text-[${colors.textTertiary}]`}>आजची कमाई</Text>
            <Text style={tw`text-lg font-extrabold text-[${colors.textPrimary}]`}>{formatCurrency(earnings)}</Text>
          </View>
        </View>
        <View style={tw`w-8 h-8 rounded-full bg-[${colors.earningsBg}] items-center justify-center`}>
          <ArrowUpRight size={14} color={colors.earnings} />
        </View>
      </View>

      {/* Expense & Profit Row */}
      <View style={tw`flex flex-row gap-3`}>
        <View style={tw`flex-1 bg-white rounded-2xl p-3.5 border border-[${colors.border}]`}>
          <View style={tw`w-8 h-8 rounded-lg bg-[${colors.expenseBg}] items-center justify-center mb-2`}>
            <TrendingDown size={14} color={colors.expense} />
          </View>
          <Text style={tw`text-[10px] font-semibold text-[${colors.textTertiary}] mb-0.5`}>आजचा खर्च</Text>
          <Text style={tw`text-base font-extrabold text-[${colors.expense}]`}>{formatCurrency(expense)}</Text>
        </View>

        <View style={tw`flex-1 bg-white rounded-2xl p-3.5 border border-[${colors.border}]`}>
          <View style={tw`w-8 h-8 rounded-lg bg-[${colors.earningsBg}] items-center justify-center mb-2`}>
            <TrendingUp size={14} color={colors.earnings} />
          </View>
          <Text style={tw`text-[10px] font-semibold text-[${colors.textTertiary}] mb-0.5`}>आजचा नफा</Text>
          <Text style={tw`text-base font-extrabold text-[${colors.earnings}]`}>{formatCurrency(profit)}</Text>
        </View>
      </View>
    </View>
  );
};

interface ActionTileProps {
  title: string;
  subtitle?: string;
  bgColor: string;
  icon: React.ReactNode;
  onPress: () => void;
}

export const ActionTileCard: React.FC<ActionTileProps> = ({ title, subtitle, bgColor, icon, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={tw`flex-1 bg-white rounded-2xl p-4 border border-[${colors.border}] flex flex-col items-center gap-2.5`}
    >
      <View style={tw`w-12 h-12 rounded-xl ${bgColor} items-center justify-center`}>
        {icon}
      </View>
      <View style={tw`items-center`}>
        <Text style={tw`font-bold text-xs text-[${colors.textPrimary}] text-center leading-tight`}>{title}</Text>
        {subtitle && (
          <Text style={tw`text-[10px] text-[${colors.textTertiary}] text-center mt-0.5`}>{subtitle}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default MetricSummaryRow;
