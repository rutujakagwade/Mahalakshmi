import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors } from '../theme';

interface AppSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export const AppSearch: React.FC<AppSearchProps> = ({
  value,
  onChangeText,
  placeholder = 'शोधा...',
  onClear,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper} pointerEvents="none">
        <Search size={18} color={colors.textMuted} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      {value.length > 0 && onClear && (
        <View style={styles.clearWrapper}>
          <View onTouchEnd={onClear} style={styles.clearBtn}>
            <X size={14} color={colors.textMuted} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 14,
    color: colors.textPrimary,
  },
  iconWrapper: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearWrapper: {
    position: 'absolute',
    right: 8,
    zIndex: 1,
  },
  clearBtn: {
    padding: 4,
    borderRadius: 9999,
    backgroundColor: colors.surfaceTertiary,
  },
});

export default AppSearch;
