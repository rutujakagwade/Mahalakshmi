import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { colors, radii } from '../theme';
import { formatCurrency } from '../utils/currency';

export interface PieChartSlice {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartSlice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
  showLegend?: boolean;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  size = 180,
  strokeWidth = 28,
  centerLabel,
  centerValue,
  showLegend = true,
}) => {
  const total = data.reduce((acc, cur) => acc + (cur.value > 0 ? cur.value : 0), 0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Filter items with positive values
  const validData = data.filter((d) => d.value > 0);

  if (total === 0 || validData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.border}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
          />
        </Svg>
        <View style={[styles.centerTextContainer, { width: size, height: size }]}>
          <Text style={styles.emptyText}>नोंद उपलब्ध नाही</Text>
        </View>
      </View>
    );
  }

  let accumulatedPercent = 0;

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {validData.map((slice, index) => {
              const percent = slice.value / total;
              const strokeDashoffset = circumference * (1 - percent);
              const rotation = accumulatedPercent * 360;
              accumulatedPercent += percent;

              return (
                <Circle
                  key={index}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  fill="none"
                  origin={`${center}, ${center}`}
                  rotation={rotation}
                  strokeLinecap="butt"
                />
              );
            })}
          </G>
        </Svg>

        {(centerLabel || centerValue) && (
          <View style={[styles.centerTextContainer, { width: size - strokeWidth * 2, height: size - strokeWidth * 2 }]}>
            {centerLabel && <Text style={styles.centerLabelText} numberOfLines={1}>{centerLabel}</Text>}
            {centerValue && <Text style={styles.centerValueText} numberOfLines={1}>{centerValue}</Text>}
          </View>
        )}
      </View>

      {showLegend && (
        <View style={styles.legendContainer}>
          {validData.map((item, idx) => {
            const pct = Math.round((item.value / total) * 100);
            return (
              <View key={idx} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <View style={styles.legendTextWrap}>
                  <Text style={styles.legendLabel} numberOfLines={1}>{item.label}</Text>
                  <Text style={styles.legendAmount}>{formatCurrency(item.value)} ({pct}%)</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  centerLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  centerValueText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  legendContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '47%',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendTextWrap: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  legendAmount: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textTertiary,
  },
});

export default PieChart;
