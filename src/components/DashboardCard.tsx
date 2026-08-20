import tw from 'twrnc';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import { ChevronRight } from 'lucide-react-native';
import { formatCurrency } from '../utils/currency';
import { colors } from '../theme';

interface MetricSummaryProps {
  earnings: number;
  expense: number;
  profit: number;
  onEarningsPress?: () => void;
  onExpensePress?: () => void;
  onProfitPress?: () => void;
}

export const MetricSummaryRow: React.FC<MetricSummaryProps> = ({
  earnings,
  expense,
  profit,
  onEarningsPress,
  onExpensePress,
  onProfitPress,
}) => {
  return (
    <View style={tw`flex flex-row gap-3`}>
      {/* Earnings Card */}
      <TouchableOpacity
        activeOpacity={onEarningsPress ? 0.75 : 1}
        onPress={onEarningsPress}
        style={[
          styles.summaryBox,
          styles.clickableEarningsBox,
          { backgroundColor: colors.earningsSurface, borderColor: '#86EFAC' },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.summaryLabel, { color: colors.earnings }]}>
            आजची कमाई
          </Text>
          {onEarningsPress && <ChevronRight size={13} color={colors.earnings} />}
        </View>

        <Text style={[styles.summaryAmount, { color: colors.earnings }]} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(earnings)}
        </Text>

        <View style={styles.badgeEarnings}>
          <Text style={styles.tapEarningsText}>तपशील पहा ›</Text>
        </View>
      </TouchableOpacity>

      {/* Expense Card */}
      <TouchableOpacity
        activeOpacity={onExpensePress ? 0.75 : 1}
        onPress={onExpensePress}
        style={[
          styles.summaryBox,
          styles.clickableSummaryBox,
          { backgroundColor: colors.expenseSurface, borderColor: '#FECDD3' },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.summaryLabel, { color: colors.expense }]}>
            आजचा खर्च
          </Text>
          {onExpensePress && <ChevronRight size={13} color={colors.expense} />}
        </View>

        <Text style={[styles.summaryAmount, { color: colors.expense }]} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(expense)}
        </Text>

        <View style={styles.badgeExpense}>
          <Text style={styles.tapExpenseText}>तपशील पहा ›</Text>
        </View>
      </TouchableOpacity>

      {/* Profit Card */}
      <TouchableOpacity
        activeOpacity={onProfitPress ? 0.75 : 1}
        onPress={onProfitPress}
        style={[
          styles.summaryBox,
          styles.clickableProfitBox,
          {
            backgroundColor: profit >= 0 ? '#F0FDF4' : '#FEF2F2',
            borderColor: profit >= 0 ? '#86EFAC' : '#FECDD3',
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.summaryLabel,
              {
                color: profit >= 0 ? colors.earnings : colors.expense,
              },
            ]}
          >
            आजचा नफा
          </Text>
          {onProfitPress && (
            <ChevronRight
              size={13}
              color={profit >= 0 ? colors.earnings : colors.expense}
            />
          )}
        </View>

        <Text
          style={[
            styles.summaryAmount,
            {
              color: profit >= 0 ? colors.earnings : colors.expense,
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatCurrency(profit)}
        </Text>

        <View
          style={[
            styles.badgeProfit,
            {
              backgroundColor: profit >= 0 ? '#DCFCE7' : '#FEE2E2',
            },
          ]}
        >
          <Text
            style={[
              styles.tapEarningsText,
              {
                color: profit >= 0 ? '#15803D' : '#991B1B',
              },
            ]}
          >
            हिशोब पहा ›
          </Text>
        </View>
      </TouchableOpacity>
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
      style={[
        tw`flex-1 bg-white rounded-2xl p-4 border border-[${colors.border}] flex flex-col items-center gap-2.5`,
        styles.actionTileCard,
      ]}
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

const styles = StyleSheet.create({
  summaryBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 104,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
  },
  clickableEarningsBox: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 4,
  },
  clickableSummaryBox: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 4,
  },
  clickableProfitBox: {
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 4,
  },
  actionTileCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    marginVertical: 4,
  },
  badgeEarnings: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeExpense: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeProfit: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tapEarningsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  tapExpenseText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991B1B',
  },
});

export default MetricSummaryRow;
