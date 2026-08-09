import tw from 'twrnc';
import { View, Text, ScrollView } from 'react-native';
import React from 'react';
import { AppHeader } from '../../components/AppHeader';
import { MetricSummaryRow, ActionTileCard } from '../../components/DashboardCard';
import { FileText, Truck, Users, BarChart3, Calendar, Wrench, WifiOff } from 'lucide-react-native';
import { ActiveScreen } from '../../types/navigation';
import { DummyData } from '../../constants/DummyData';

interface DashboardScreenProps {
  onNavigate: (screen: ActiveScreen) => void;
  onOpenDrawer?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate, onOpenDrawer }) => {
  const summary = DummyData.dashboard.todaySummary;

  return (
    <View style={tw`flex-1 w-full bg-[#FAF7F2] flex flex-col justify-between`}>
      <View style={tw`flex-1`}>
        {/* App Header */}
        <AppHeader
          title="महालक्ष्मी"
          subtitle="इन्फ्रा अँड अर्थमूव्हर्स"
          showMenu={true}
          onMenuPress={onOpenDrawer}
          rightActionIcon="bell"
          onRightActionPress={() => alert('कोणतीही नवीन सूचना नाही')}
        />

        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 max-w-lg mx-auto w-full pb-8`}>
          {/* Today's Metrics Summary Cards */}
          <MetricSummaryRow
            earnings={summary.earnings}
            expense={summary.expense}
            profit={summary.profit}
          />

          {/* Action Tiles Grid structured using flex rows */}
          <View style={tw`mt-4 gap-4`}>
            {/* Row 1 */}
            <View style={tw`flex flex-row gap-4`}>
              <ActionTileCard
                title="रोजचा हिशोब"
                bgColor="bg-emerald-600"
                icon={<FileText size={26} color="white" />}
                onPress={() => onNavigate('DailyEntry')}
              />
              <ActionTileCard
                title="मशीन नोंद"
                bgColor="bg-orange-600"
                icon={<Truck size={26} color="white" />}
                onPress={() => onNavigate('MachineEntry')}
              />
            </View>

            {/* Row 2 */}
            <View style={tw`flex flex-row gap-4`}>
              <ActionTileCard
                title="ग्राहक"
                bgColor="bg-blue-600"
                icon={<Users size={26} color="white" />}
                onPress={() => onNavigate('CustomerList')}
              />
              <ActionTileCard
                title="रिपोर्ट"
                bgColor="bg-purple-600"
                icon={<BarChart3 size={26} color="white" />}
                onPress={() => onNavigate('MonthlyReport')}
              />
            </View>

            {/* Row 3 */}
            <View style={tw`flex flex-row gap-4`}>
              <ActionTileCard
                title="तारीखनुसार हिशोब"
                bgColor="bg-teal-600"
                icon={<Calendar size={26} color="white" />}
                onPress={() => onNavigate('DateReport')}
              />
              <ActionTileCard
                title="सेटिंग"
                bgColor="bg-[#4B5563]"
                icon={<Wrench size={26} color="white" />}
                onPress={() => onNavigate('Settings')}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Bottom Offline Status Banner */}
      <View style={tw`px-4 py-2 mt-2 max-w-lg mx-auto w-full`}>
        <View style={tw`bg-emerald-50 border border-emerald-200 rounded-xl py-2 px-3 flex flex-row items-center justify-center gap-2`}>
          <WifiOff size={15} color="#047857" />
          <Text style={tw`text-xs font-semibold text-emerald-800`}>डेटा : पूर्णपणे ऑफलाइन</Text>
        </View>
      </View>
    </View>
  );
};

export default DashboardScreen;
