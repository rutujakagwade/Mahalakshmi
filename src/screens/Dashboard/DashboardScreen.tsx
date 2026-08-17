import tw from 'twrnc';
import { View, Text, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { MetricSummaryRow, ActionTileCard } from '../../components/DashboardCard';
import { FileText, Truck, Users, BarChart3, Calendar, Wrench, Wifi, WifiOff } from 'lucide-react-native';
import { ActiveScreen } from '../../types/navigation';
import { DummyData } from '../../constants/DummyData';
import { DashboardService } from '../../utils/api';
import { colors } from '../../theme';

interface DashboardScreenProps {
  onNavigate: (screen: ActiveScreen) => void;
  onOpenDrawer?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate, onOpenDrawer }) => {
  const [summary, setSummary] = useState(DummyData.dashboard.todaySummary);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('डेटा : ऑफलाइन मोड');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await DashboardService.getSummary();
        if (data?.todaySummary) {
          setSummary(data.todaySummary);
          setIsOnline(true);
          setStatusText(data.status || 'डेटा : ऑनलाइन (सिंक्ड)');
        }
      } catch {
        setIsOnline(false);
        setStatusText('डेटा : ऑफलाइन मोड');
      }
    };
    fetchDashboard();
  }, []);

  const today = new Date();
  const dateStr = today.toLocaleDateString('mr-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={tw`flex-1 w-full bg-[${colors.background}]`}>
      <View style={tw`flex-1`}>
        <AppHeader
          title="महालक्ष्मी"
          subtitle="इन्फ्रा अँड अर्थमूव्हर्स"
          showMenu={true}
          onMenuPress={onOpenDrawer}
          rightActionIcon="bell"
          onRightActionPress={() => alert('कोणतीही नवीन सूचना नाही')}
        />

        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`p-4 max-w-lg mx-auto w-full pb-8`}>
          {/* Date */}
          <Text style={tw`text-xs font-semibold text-[${colors.textTertiary}] mb-3`}>{dateStr}</Text>

          {/* Metrics Summary */}
          <MetricSummaryRow
            earnings={summary.earnings}
            expense={summary.expense}
            profit={summary.profit}
          />

          {/* Action Tiles */}
          <View style={tw`mt-5`}>
            <Text style={tw`text-xs font-bold text-[${colors.textTertiary}] uppercase tracking-wider mb-3 px-1`}>कार्ये</Text>
            <View style={tw`gap-3`}>
              <View style={tw`flex flex-row gap-3`}>
                <ActionTileCard
                  title="रोजचा हिशोब"
                  subtitle="दैनिक आवक/जावक"
                  bgColor={`bg-[${colors.tileDaily}]`}
                  icon={<FileText size={22} color="white" />}
                  onPress={() => onNavigate('DailyEntry')}
                />
                <ActionTileCard
                  title="मशीन नोंद"
                  subtitle="कामाची नोंद"
                  bgColor={`bg-[${colors.tileMachine}]`}
                  icon={<Truck size={22} color="white" />}
                  onPress={() => onNavigate('MachineEntry')}
                />
              </View>

              <View style={tw`flex flex-row gap-3`}>
                <ActionTileCard
                  title="ग्राहक"
                  subtitle="ग्राहक व्यवस्थापन"
                  bgColor={`bg-[${colors.tileCustomer}]`}
                  icon={<Users size={22} color="white" />}
                  onPress={() => onNavigate('CustomerList')}
                />
                <ActionTileCard
                  title="रिपोर्ट"
                  subtitle="मासिक अहवाल"
                  bgColor={`bg-[${colors.tileReport}]`}
                  icon={<BarChart3 size={22} color="white" />}
                  onPress={() => onNavigate('MonthlyReport')}
                />
              </View>

              <View style={tw`flex flex-row gap-3`}>
                <ActionTileCard
                  title="तारीखनुसार"
                  subtitle="दिनांक निहित"
                  bgColor={`bg-[${colors.tileDatewise}]`}
                  icon={<Calendar size={22} color="white" />}
                  onPress={() => onNavigate('DateReport')}
                />
                <ActionTileCard
                  title="सेटिंग"
                  subtitle="अॅप सेटिंग"
                  bgColor={`bg-[${colors.tileSetting}]`}
                  icon={<Wrench size={22} color="white" />}
                  onPress={() => onNavigate('Settings')}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Status Banner */}
      <View style={tw`px-4 pb-3 pt-1 max-w-lg mx-auto w-full`}>
        <View style={tw`bg-[${isOnline ? colors.successBg : colors.earningsSurface}] border border-[${isOnline ? '#A7F3D0' : '#BBF7D0'}] rounded-xl py-2.5 px-3 flex flex-row items-center justify-center gap-2`}>
          {isOnline ? (
            <Wifi size={14} color={colors.success} />
          ) : (
            <WifiOff size={14} color={colors.earnings} />
          )}
          <Text style={tw`text-[11px] font-semibold text-[${isOnline ? colors.success : colors.earnings}]`}>{statusText}</Text>
        </View>
      </View>
    </View>
  );
};

export default DashboardScreen;
