import tw from 'twrnc';
import { View, Text, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { AppDropdown } from '../../components/AppDropdown';
import { AppButton } from '../../components/AppButton';
import { Download, Share2 } from 'lucide-react-native';
import { formatCurrency } from '../../utils/currency';
import { DummyData } from '../../constants/DummyData';
import { ReportService } from '../../utils/api';
import { colors, radii, shadows } from '../../theme';

interface MonthlyReportScreenProps {
  onBack: () => void;
}

export const MonthlyReportScreen: React.FC<MonthlyReportScreenProps> = ({ onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('ऑगस्ट - 2026');
  const [monthlySummary, setMonthlySummary] = useState(DummyData.reports.monthlySummary);
  const [machineSummary, setMachineSummary] = useState(DummyData.reports.machineSummary);

  const monthMap: Record<string, { year: number; month: number }> = {
    'ऑगस्ट - 2026': { year: 2026, month: 8 },
    'जुलै - 2026': { year: 2026, month: 7 },
    'जून - 2026': { year: 2026, month: 6 },
    'मे - 2026': { year: 2026, month: 5 },
  };

  useEffect(() => {
    const fetchMonthly = async () => {
      const { year, month } = monthMap[selectedMonth] || { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
      try {
        const data = await ReportService.getMonthlyReport(year, month);
        if (data?.monthlySummary) {
          setMonthlySummary(data.monthlySummary);
          if (data.machineSummary) {
            setMachineSummary(data.machineSummary);
          }
        }
      } catch {
        // Fallback to local
      }
    };
    fetchMonthly();
  }, [selectedMonth]);

  const chartBars = [
    { day: 1, earnings: 40, expense: 20 },
    { day: 5, earnings: 60, expense: 30 },
    { day: 10, earnings: 50, expense: 25 },
    { day: 15, earnings: 55, expense: 28 },
    { day: 20, earnings: 45, expense: 22 },
    { day: 25, earnings: 65, expense: 32 },
    { day: 30, earnings: 50, expense: 24 },
  ];

  return (
    <View style={tw`flex-1 w-full bg-[${colors.background}]`}>
      <AppHeader
        title="मासिक रिपोर्ट"
        showBack={true}
        onBackPress={onBack}
      />

      <ScrollView contentContainerStyle={tw`p-4 max-w-lg mx-auto gap-4 pb-8`}>
        {/* Month Selector */}
        <View style={tw`bg-white rounded-2xl p-4 border border-[${colors.border}]`}>
          <AppDropdown
            label="महिना"
            value={selectedMonth}
            onChangeText={setSelectedMonth}
            options={[
              { label: 'ऑगस्ट - 2026', value: 'ऑगस्ट - 2026' },
              { label: 'जुलै - 2026', value: 'जुलै - 2026' },
              { label: 'जून - 2026', value: 'जून - 2026' },
              { label: 'मे - 2026', value: 'मे - 2026' },
            ]}
          />
        </View>

        {/* Summary Cards */}
        <View style={tw`flex flex-row gap-3`}>
          <View style={tw`flex-1 bg-[${colors.earningsSurface}] border border-green-200 rounded-xl p-3 items-center`}>
            <Text style={tw`text-[10px] font-semibold text-[${colors.textTertiary}] mb-1`}>एकूण कमाई</Text>
            <Text style={tw`font-extrabold text-[${colors.earnings}] text-sm`}>
              {formatCurrency(monthlySummary.totalEarnings)}
            </Text>
          </View>

          <View style={tw`flex-1 bg-[${colors.expenseSurface}] border border-red-200 rounded-xl p-3 items-center`}>
            <Text style={tw`text-[10px] font-semibold text-[${colors.textTertiary}] mb-1`}>एकूण खर्च</Text>
            <Text style={tw`font-extrabold text-[${colors.expense}] text-sm`}>
              {formatCurrency(monthlySummary.totalExpense)}
            </Text>
          </View>

          <View style={tw`flex-1 bg-[${colors.earningsSurface}] border border-green-200 rounded-xl p-3 items-center`}>
            <Text style={tw`text-[10px] font-semibold text-[${colors.textTertiary}] mb-1`}>नफा</Text>
            <Text style={tw`font-extrabold text-[${colors.earnings}] text-sm`}>
              {formatCurrency(monthlySummary.totalProfit)}
            </Text>
          </View>
        </View>

        {/* Bar Chart */}
        <View style={tw`bg-white rounded-2xl p-4 border border-[${colors.border}] gap-3`}>
          <View style={tw`flex flex-row items-center justify-end gap-4`}>
            <View style={tw`flex flex-row items-center gap-1.5`}>
              <View style={tw`w-3 h-3 bg-[${colors.earnings}] rounded-sm`} />
              <Text style={tw`text-[11px] font-semibold text-[${colors.textTertiary}]`}>कमाई</Text>
            </View>
            <View style={tw`flex flex-row items-center gap-1.5`}>
              <View style={tw`w-3 h-3 bg-[${colors.expense}] rounded-sm`} />
              <Text style={tw`text-[11px] font-semibold text-[${colors.textTertiary}]`}>खर्च</Text>
            </View>
          </View>

          <View style={tw`h-36 w-full flex flex-row items-end justify-between border-b border-l border-[${colors.border}] pt-4 px-2`}>
            {chartBars.map((bar, idx) => (
              <View key={idx} style={tw`flex flex-col items-center gap-1`}>
                <View style={tw`flex flex-row items-end gap-1`}>
                  <View
                    style={[
                      tw`w-2.5 bg-[${colors.earnings}] rounded-t-sm`,
                      { height: bar.earnings * 1.4 },
                    ]}
                  />
                  <View
                    style={[
                      tw`w-2.5 bg-[${colors.expense}] rounded-t-sm`,
                      { height: bar.expense * 1.4 },
                    ]}
                  />
                </View>
                <Text style={tw`text-[10px] text-[${colors.textMuted}] font-bold`}>{bar.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={tw`flex flex-row gap-3`}>
          <View style={tw`flex-1`}>
            <AppButton
              title="PDF डाउनलोड"
              icon={<Download size={16} color="white" />}
              onPress={() => alert('PDF डाउनलोड सुरू झाली...')}
              variant="primary"
            />
          </View>
          <View style={tw`flex-1`}>
            <AppButton
              title="शेअर करा"
              icon={<Share2 size={16} color="white" />}
              onPress={() => alert('WhatsApp शेअर मेसेज तयार केला!')}
              variant="outline"
            />
          </View>
        </View>

        {/* Machine Breakdown Table */}
        <View style={tw`bg-white rounded-2xl border border-[${colors.border}] overflow-hidden`}>
          <View style={tw`flex flex-row bg-[${colors.surfaceTertiary}] py-3 px-3 border-b border-[${colors.border}]`}>
            <Text style={tw`flex-1 text-left font-bold text-[11px] text-[${colors.textTertiary}] pl-2`}>मशीन</Text>
            <Text style={tw`flex-1 text-center font-bold text-[11px] text-[${colors.textTertiary}]`}>कामाचे तास</Text>
            <Text style={tw`flex-1 text-right font-bold text-[11px] text-[${colors.textTertiary}] pr-2`}>कमाई</Text>
          </View>

          {machineSummary.map((m, index) => (
            <View
              key={m.id}
              style={tw`flex flex-row py-3 px-3 items-center border-b border-[${colors.borderLight}] ${index % 2 === 0 ? `bg-[${colors.surfaceSecondary}]` : 'bg-white'}`}
            >
              <Text style={tw`flex-1 font-bold text-[${colors.textPrimary}] text-left pl-2 text-xs`}>{m.machineName}</Text>
              <Text style={tw`flex-1 font-semibold text-[${colors.textTertiary}] text-center text-xs`}>{m.hoursOrTrips}</Text>
              <Text style={tw`flex-1 font-bold text-[${colors.earnings}] text-right pr-2 text-xs`}>
                {formatCurrency(m.totalEarnings)}
              </Text>
            </View>
          ))}

          <View style={tw`flex flex-row bg-[${colors.goldLight}] py-3 px-3 border-t-2 border-[${colors.gold}]`}>
            <Text style={tw`flex-1 text-left font-extrabold text-xs text-[${colors.textPrimary}] pl-2`}>एकूण</Text>
            <Text style={tw`flex-1 text-center font-extrabold text-xs text-[${colors.textPrimary}]`}></Text>
            <Text style={tw`flex-1 text-right font-extrabold text-xs text-[${colors.earnings}] pr-2`}>₹ 4,47,200</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default MonthlyReportScreen;
