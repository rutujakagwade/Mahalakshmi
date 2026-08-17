import tw from 'twrnc';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { formatCurrency } from '../../utils/currency';
import { AppDatePicker } from '../../components/AppDatePicker';
import { DummyData } from '../../constants/DummyData';
import { ReportService } from '../../utils/api';
import { colors, radii, shadows } from '../../theme';
import { Search } from 'lucide-react-native';

interface DateReportScreenProps {
  onBack: () => void;
}

export const DateReportScreen: React.FC<DateReportScreenProps> = ({ onBack }) => {
  const [fromDate, setFromDate] = useState<string>('01/08/2026');
  const [toDate, setToDate] = useState<string>('15/08/2026');

  const [summary, setSummary] = useState(DummyData.reports.dateRangeSummary);
  const [rows, setRows] = useState(DummyData.reports.datewiseRows);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDateRangeReport = async () => {
    const fromParts = fromDate.split('/');
    const toParts = toDate.split('/');
    const isoFrom = fromParts.length === 3 ? `${fromParts[2]}-${fromParts[1]}-${fromParts[0]}` : undefined;
    const isoTo = toParts.length === 3 ? `${toParts[2]}-${toParts[1]}-${toParts[0]}` : undefined;

    setLoading(true);
    try {
      const data = await ReportService.getDateReport(isoFrom, isoTo);
      if (data?.dateRangeSummary) {
        setSummary(data.dateRangeSummary);
      }
      if (Array.isArray(data?.datewiseRows)) {
        setRows(data.datewiseRows);
      }
    } catch {
      // Local fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDateRangeReport();
  }, []);

  return (
    <View style={tw`flex-1 w-full bg-[${colors.background}]`}>
      <AppHeader
        title="तारीखनुसार हिशोब"
        showBack={true}
        onBackPress={onBack}
      />

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 max-w-lg mx-auto w-full gap-4 pb-8`}>
        {/* Date Filters */}
        <View style={tw`bg-white rounded-2xl p-4 border border-[${colors.border}] gap-3`}>
          <View style={tw`flex flex-row gap-3`}>
            <View style={tw`flex-1`}>
              <AppDatePicker label="पासून" value={fromDate} onChange={setFromDate} />
            </View>
            <View style={tw`flex-1`}>
              <AppDatePicker label="पर्यंत" value={toDate} onChange={setToDate} />
            </View>
          </View>

          <TouchableOpacity
            onPress={fetchDateRangeReport}
            activeOpacity={0.7}
            style={tw`w-full bg-[${colors.primary}] py-3 rounded-xl flex flex-row items-center justify-center gap-2`}
          >
            <Search size={16} color="white" />
            <Text style={tw`text-white font-bold text-xs`}>शोधा</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={tw`flex flex-row gap-3`}>
          <View style={tw`flex-1 bg-[${colors.earningsSurface}] border border-green-200 rounded-xl p-3 items-center`}>
            <Text style={tw`text-[10px] font-semibold text-[${colors.textTertiary}] mb-1`}>एकूण कमाई</Text>
            <Text style={tw`font-extrabold text-[${colors.earnings}] text-sm`}>
              {formatCurrency(summary.totalEarnings)}
            </Text>
          </View>

          <View style={tw`flex-1 bg-[${colors.expenseSurface}] border border-red-200 rounded-xl p-3 items-center`}>
            <Text style={tw`text-[10px] font-semibold text-[${colors.textTertiary}] mb-1`}>एकूण खर्च</Text>
            <Text style={tw`font-extrabold text-[${colors.expense}] text-sm`}>
              {formatCurrency(summary.totalExpense)}
            </Text>
          </View>

          <View style={tw`flex-1 bg-[${colors.earningsSurface}] border border-green-200 rounded-xl p-3 items-center`}>
            <Text style={tw`text-[10px] font-semibold text-[${colors.textTertiary}] mb-1`}>नफा</Text>
            <Text style={tw`font-extrabold text-[${colors.earnings}] text-sm`}>
              {formatCurrency(summary.totalProfit)}
            </Text>
          </View>
        </View>

        {/* Ledger Table */}
        <View style={tw`bg-white rounded-2xl border border-[${colors.border}] overflow-hidden`}>
          {/* Header */}
          <View style={tw`flex flex-row bg-[${colors.surfaceTertiary}] py-3 px-3 border-b border-[${colors.border}]`}>
            <Text style={tw`flex-1 text-center font-bold text-[11px] text-[${colors.textTertiary}]`}>दिनांक</Text>
            <Text style={tw`flex-1 text-center font-bold text-[11px] text-[${colors.textTertiary}]`}>कमाई</Text>
            <Text style={tw`flex-1 text-center font-bold text-[11px] text-[${colors.textTertiary}]`}>खर्च</Text>
            <Text style={tw`flex-1 text-center font-bold text-[11px] text-[${colors.textTertiary}]`}>नफा</Text>
          </View>

          {/* Body */}
          {rows.map((row, index) => (
            <View
              key={row.id}
              style={tw`flex flex-row py-3 px-3 items-center border-b border-[${colors.borderLight}] ${index % 2 === 0 ? `bg-[${colors.surfaceSecondary}]` : 'bg-white'}`}
            >
              <Text style={tw`flex-1 text-center text-xs font-medium text-[${colors.textPrimary}]`}>{row.date}</Text>
              <Text style={tw`flex-1 text-center text-xs font-semibold text-[${colors.earnings}]`}>{formatCurrency(row.earnings)}</Text>
              <Text style={tw`flex-1 text-center text-xs font-semibold text-[${colors.expense}]`}>{formatCurrency(row.expense)}</Text>
              <Text style={tw`flex-1 text-center text-xs font-bold text-[${colors.earnings}]`}>{formatCurrency(row.profit)}</Text>
            </View>
          ))}

          {/* Footer Total */}
          <View style={tw`flex flex-row bg-[${colors.goldLight}] py-3 px-3 border-t-2 border-[${colors.gold}]`}>
            <Text style={tw`flex-1 text-center font-extrabold text-xs text-[${colors.textPrimary}]`}>एकूण</Text>
            <Text style={tw`flex-1 text-center font-extrabold text-xs text-[${colors.earnings}]`}>{formatCurrency(summary.totalEarnings)}</Text>
            <Text style={tw`flex-1 text-center font-extrabold text-xs text-[${colors.expense}]`}>{formatCurrency(summary.totalExpense)}</Text>
            <Text style={tw`flex-1 text-center font-extrabold text-xs text-[${colors.earnings}]`}>{formatCurrency(summary.totalProfit)}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default DateReportScreen;
