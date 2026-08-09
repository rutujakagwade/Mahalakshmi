import tw from 'twrnc';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { Calendar } from 'lucide-react-native';
import { formatCurrency } from '../../utils/currency';
import { AppDatePicker } from '../../components/AppDatePicker';
import { DummyData } from '../../constants/DummyData';

interface DateReportScreenProps {
  onBack: () => void;
}

export const DateReportScreen: React.FC<DateReportScreenProps> = ({ onBack }) => {
  const [fromDate, setFromDate] = useState<string>('01/05/2024');
  const [toDate, setToDate] = useState<string>('20/05/2024');

  const summary = DummyData.reports.dateRangeSummary;
  const rows = DummyData.reports.datewiseRows;

  return (
    <View style={tw`flex-1 w-full bg-[#FAF7F2]`}>
      <AppHeader
        title="तारीखनुसार हिशोब"
        showBack={true}
        onBackPress={onBack}
        rightActionIcon="calendar"
      />

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-3.5 max-w-lg mx-auto w-full gap-3.5 pb-8`}>
        {/* Date Filters Card */}
        <View style={tw`bg-white rounded-xl p-3 border border-stone-200 shadow-sm gap-2.5`}>
          <View style={tw`flex flex-row gap-2`}>
            <View style={tw`flex-1`}>
              <AppDatePicker
                label="पासून"
                value={fromDate}
                onChange={setFromDate}
              />
            </View>
            <View style={tw`flex-1`}>
              <AppDatePicker
                label="पर्यंत"
                value={toDate}
                onChange={setToDate}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => alert('माहिती फिल्टर झाली')}
            style={tw`w-full bg-[#6B121C] py-2.5 rounded-lg flex items-center justify-center`}
          >
            <Text style={tw`text-white font-bold text-xs`}>शोधा</Text>
          </TouchableOpacity>
        </View>

        {/* 3 Metrics Summary Bar */}
        <View style={tw`flex flex-row gap-2`}>
          <View style={tw`flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-2 items-center`}>
            <Text style={tw`text-[10px] font-medium text-stone-600 mb-0.5`}>एकूण कमाई</Text>
            <Text style={tw`font-extrabold text-emerald-700 text-xs sm:text-sm`}>
              {formatCurrency(summary.totalEarnings)}
            </Text>
          </View>

          <View style={tw`flex-1 bg-red-50 border border-red-200 rounded-xl p-2 items-center`}>
            <Text style={tw`text-[10px] font-medium text-stone-600 mb-0.5`}>एकूण खर्च</Text>
            <Text style={tw`font-extrabold text-red-600 text-xs sm:text-sm`}>
              {formatCurrency(summary.totalExpense)}
            </Text>
          </View>

          <View style={tw`flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-2 items-center`}>
            <Text style={tw`text-[10px] font-medium text-stone-600 mb-0.5`}>नफा</Text>
            <Text style={tw`font-extrabold text-emerald-700 text-xs sm:text-sm`}>
              {formatCurrency(summary.totalProfit)}
            </Text>
          </View>
        </View>

        {/* Ledger Table */}
        <View style={tw`bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm`}>
          {/* Table Header */}
          <View style={tw`flex flex-row bg-stone-100 p-2.5 border-b border-stone-200`}>
            <Text style={tw`flex-1 text-center font-bold text-xs text-stone-700`}>दिनांक</Text>
            <Text style={tw`flex-1 text-center font-bold text-xs text-stone-700`}>कमाई</Text>
            <Text style={tw`flex-1 text-center font-bold text-xs text-stone-700`}>खर्च</Text>
            <Text style={tw`flex-1 text-center font-bold text-xs text-stone-700`}>नफा</Text>
          </View>

          {/* Table Body */}
          <View style={tw`divide-y divide-stone-100`}>
            {rows.map((row) => (
              <View key={row.id} style={tw`flex flex-row p-2.5 items-center`}>
                <Text style={tw`flex-1 text-center text-xs font-medium text-stone-800`}>{row.date}</Text>
                <Text style={tw`flex-1 text-center text-xs font-semibold text-emerald-700`}>{formatCurrency(row.earnings)}</Text>
                <Text style={tw`flex-1 text-center text-xs font-semibold text-red-600`}>{formatCurrency(row.expense)}</Text>
                <Text style={tw`flex-1 text-center text-xs font-bold text-emerald-700`}>{formatCurrency(row.profit)}</Text>
              </View>
            ))}
          </View>

          {/* Table Footer Total */}
          <View style={tw`flex flex-row bg-amber-50 p-2.5 border-t-2 border-stone-300`}>
            <Text style={tw`flex-1 text-center font-extrabold text-xs text-stone-900`}>एकूण</Text>
            <Text style={tw`flex-1 text-center font-extrabold text-xs text-emerald-700`}>{formatCurrency(summary.totalEarnings)}</Text>
            <Text style={tw`flex-1 text-center font-extrabold text-xs text-red-600`}>{formatCurrency(summary.totalExpense)}</Text>
            <Text style={tw`flex-1 text-center font-extrabold text-xs text-emerald-700`}>{formatCurrency(summary.totalProfit)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default DateReportScreen;
