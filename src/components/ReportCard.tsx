import tw from 'twrnc';
import { View, Text } from 'react-native';
import React from 'react';
import { DatewiseReportRow } from '../types/report';
import { formatCurrency } from '../utils/currency';
import { colors } from '../theme';

interface ReportCardProps {
  row: DatewiseReportRow;
  index?: number;
}

export const ReportCard: React.FC<ReportCardProps> = ({ row, index = 0 }) => {
  const isEven = index % 2 === 0;

  return (
    <View style={tw`flex flex-row py-3 px-3 items-center justify-between ${isEven ? `bg-[${colors.surfaceSecondary}]` : 'bg-white'}`}>
      <Text style={tw`flex-1 text-xs font-semibold text-[${colors.textPrimary}]`}>{row.date}</Text>
      <Text style={tw`flex-1 text-xs font-semibold text-[${colors.earnings}] text-right`}>{formatCurrency(row.earnings)}</Text>
      <Text style={tw`flex-1 text-xs font-semibold text-[${colors.expense}] text-right`}>{formatCurrency(row.expense)}</Text>
      <Text style={tw`flex-1 text-xs font-bold text-[${colors.earnings}] text-right`}>{formatCurrency(row.profit)}</Text>
    </View>
  );
};

export default ReportCard;
