import tw from 'twrnc';
import { View, Text } from 'react-native';
import React from 'react';
import { DatewiseReportRow } from '../types/report';
import { formatCurrency } from '../utils/currency';

interface ReportCardProps {
  row: DatewiseReportRow;
}

export const ReportCard: React.FC<ReportCardProps> = ({ row }) => {
  return (
    <View style={tw`flex flex-row py-2.5 px-3 border-b border-stone-100 items-center justify-between`}>
      <Text style={tw`flex-1 text-xs font-semibold text-stone-700`}>{row.date}</Text>
      <Text style={tw`flex-1 text-xs font-semibold text-emerald-700 text-right`}>{formatCurrency(row.earnings)}</Text>
      <Text style={tw`flex-1 text-xs font-semibold text-red-600 text-right`}>{formatCurrency(row.expense)}</Text>
      <Text style={tw`flex-1 text-xs font-bold text-emerald-700 text-right`}>{formatCurrency(row.profit)}</Text>
    </View>
  );
};

export default ReportCard;
