import tw from 'twrnc';
import { View, Text, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { AppDropdown } from '../../components/AppDropdown';
import { AppButton } from '../../components/AppButton';
import { Download, Share2 } from 'lucide-react-native';
import { formatCurrency } from '../../utils/currency';
import { DummyData } from '../../constants/DummyData';

interface MonthlyReportScreenProps {
  onBack: () => void;
}

export const MonthlyReportScreen: React.FC<MonthlyReportScreenProps> = ({ onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('मे - 2024');

  const monthlySummary = DummyData.reports.monthlySummary;
  const machineSummary = DummyData.reports.machineSummary;

  // Mock bar chart days data (1 to 30)
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
    <View style={tw`flex-1 w-full bg-[#FAF7F2]`}>
      <AppHeader
        title="मासिक रिपोर्ट"
        showBack={true}
        onBackPress={onBack}
        rightActionIcon="calendar"
      />

      <ScrollView contentContainerStyle={tw`p-3.5 max-w-lg mx-auto gap-4`}>
        {/* Month Selector Dropdown */}
        <View style={tw`bg-white rounded-xl p-3 border border-stone-200 shadow-sm`}>
          <AppDropdown
            label="महिना"
            value={selectedMonth}
            onChangeText={setSelectedMonth}
            options={[
              { label: 'मे - 2024', value: 'मे - 2024' },
              { label: 'एप्रिल - 2024', value: 'एप्रिल - 2024' },
              { label: 'मार्च - 2024', value: 'मार्च - 2024' },
            ]}
          />
        </View>

        {/* Top 3 Summary Boxes */}
        <View style={tw`flex flex-row gap-2`}>
          <View style={tw`flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-2 items-center`}>
            <Text style={tw`text-[10px] font-semibold text-stone-600 mb-0.5`}>एकूण कमाई</Text>
            <Text style={tw`font-extrabold text-emerald-700 text-xs sm:text-sm`}>
              {formatCurrency(monthlySummary.totalEarnings)}
            </Text>
          </View>

          <View style={tw`flex-1 bg-red-50 border border-red-200 rounded-xl p-2 items-center`}>
            <Text style={tw`text-[10px] font-semibold text-stone-600 mb-0.5`}>एकूण खर्च</Text>
            <Text style={tw`font-extrabold text-red-600 text-xs sm:text-sm`}>
              {formatCurrency(monthlySummary.totalExpense)}
            </Text>
          </View>

          <View style={tw`flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-2 items-center`}>
            <Text style={tw`text-[10px] font-semibold text-stone-600 mb-0.5`}>नफा</Text>
            <Text style={tw`font-extrabold text-emerald-700 text-xs sm:text-sm`}>
              {formatCurrency(monthlySummary.totalProfit)}
            </Text>
          </View>
        </View>

        {/* Bar Chart Visualization Box */}
        <View style={tw`bg-white rounded-xl p-4 border border-stone-200 shadow-sm gap-3`}>
          <View style={tw`flex flex-row items-center justify-end gap-4`}>
            <View style={tw`flex flex-row items-center gap-1.5`}>
              <View style={tw`w-3 h-3 bg-emerald-600 rounded-sm`} />
              <Text style={tw`text-xs font-semibold text-stone-600`}>कमाई</Text>
            </View>
            <View style={tw`flex flex-row items-center gap-1.5`}>
              <View style={tw`w-3 h-3 bg-red-500 rounded-sm`} />
              <Text style={tw`text-xs font-semibold text-stone-600`}>खर्च</Text>
            </View>
          </View>

          {/* Bar chart graph area */}
          <View style={tw`h-32 w-full flex flex-row items-end justify-between border-b border-l border-stone-300 pt-4 px-2`}>
            {chartBars.map((bar, idx) => (
              <View key={idx} style={tw`flex flex-col items-center gap-1`}>
                <View style={tw`flex flex-row items-end gap-1`}>
                  <View
                    style={[
                      tw`w-2.5 bg-emerald-600 rounded-t-sm`,
                      { height: bar.earnings * 1.4 },
                    ]}
                  />
                  <View
                    style={[
                      tw`w-2.5 bg-red-500 rounded-t-sm`,
                      { height: bar.expense * 1.4 },
                    ]}
                  />
                </View>
                <Text style={tw`text-[10px] text-stone-500 font-bold`}>{bar.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons: PDF & Share */}
        <View style={tw`flex flex-row gap-2`}>
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
              title="रिपोर्ट शेअर करा"
              icon={<Share2 size={16} color="white" />}
              onPress={() => alert('WhatsApp शेअर मेसेज तयार केला!')}
              variant="primary"
            />
          </View>
        </View>

        {/* Machine Breakdown Table */}
        <View style={tw`bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm mt-2`}>
          <View style={tw`flex flex-row bg-stone-100 p-2.5 border-b border-stone-200`}>
            <Text style={tw`flex-1 text-left font-bold text-xs text-stone-700 pl-2`}>मशीन</Text>
            <Text style={tw`flex-1 text-center font-bold text-xs text-stone-700`}>कामाचे तास</Text>
            <Text style={tw`flex-1 text-right font-bold text-xs text-stone-700 pr-2`}>कमाई (₹)</Text>
          </View>

          <View style={tw`divide-y divide-stone-100`}>
            {machineSummary.map((m) => (
              <View key={m.id} style={tw`flex flex-row p-2.5 items-center`}>
                <Text style={tw`flex-1 font-bold text-stone-900 text-left pl-2 text-xs`}>{m.machineName}</Text>
                <Text style={tw`flex-1 font-semibold text-stone-600 text-center text-xs`}>{m.hoursOrTrips}</Text>
                <Text style={tw`flex-1 font-bold text-emerald-700 text-right pr-2 text-xs`}>
                  {formatCurrency(m.totalEarnings)}
                </Text>
              </View>
            ))}
          </View>

          {/* Machine Summary Footer */}
          <View style={tw`flex flex-row bg-amber-50 p-2.5 border-t-2 border-stone-300`}>
            <Text style={tw`flex-1 text-left font-extrabold text-xs text-stone-900 pl-2`}>एकूण</Text>
            <Text style={tw`flex-1 text-center font-extrabold text-xs text-stone-900`}></Text>
            <Text style={tw`flex-1 text-right font-extrabold text-xs text-emerald-700 pr-2`}>₹ 4,47,200</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default MonthlyReportScreen;
