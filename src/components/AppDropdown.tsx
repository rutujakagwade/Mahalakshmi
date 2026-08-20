import tw from 'twrnc';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react-native';
import { colors } from '../theme';

interface DropdownOption {
  label: string;
  value: string;
}

interface AppDropdownProps {
  label?: string;
  value: string;
  onChange?: (value: string) => void;
  onChangeText?: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  /** Optional label + callback for a "+ Add New" button at the bottom of the list */
  footerActionLabel?: string;
  onFooterAction?: () => void;
}

export const AppDropdown: React.FC<AppDropdownProps> = ({
  label,
  value,
  onChange,
  onChangeText,
  options,
  placeholder = 'निवडा',
  className = '',
  footerActionLabel,
  onFooterAction,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value) || { label: value, value };
  const hasSelection = value && value.length > 0;

  const handleSelect = (val: string) => {
    if (onChange) onChange(val);
    if (onChangeText) onChangeText(val);
    setModalVisible(false);
  };

  const handleFooterAction = () => {
    setModalVisible(false);
    // Small delay so dropdown closes smoothly before new modal opens
    setTimeout(() => {
      onFooterAction?.();
    }, 200);
  };

  return (
    <View style={tw`w-full flex flex-col gap-1.5 ${className}`}>
      {label && <Text style={tw`text-xs font-semibold text-[${colors.textSecondary}]`}>{label}</Text>}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
        style={tw`w-full bg-[${colors.surfaceSecondary}] border border-[${colors.border}] rounded-xl py-3 px-3.5 flex flex-row items-center justify-between`}
      >
        <Text style={tw`text-sm font-medium ${hasSelection ? `text-[${colors.textPrimary}]` : `text-[${colors.textMuted}]`}`}>
          {hasSelection ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
          style={tw`flex-1 bg-black/50 justify-center items-center p-4`}
        >
          {/* Stop inner taps from closing the modal */}
          <TouchableOpacity activeOpacity={1} style={tw`w-full max-w-sm`}>
            <View style={tw`w-full bg-white rounded-2xl overflow-hidden`}>
              {/* Header */}
              {label && (
                <View style={tw`bg-[${colors.primary}] py-3.5 px-4`}>
                  <Text style={tw`text-white font-bold text-sm`}>{label}</Text>
                </View>
              )}

              {/* Options list */}
              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                style={{ maxHeight: 300 }}
                renderItem={({ item }) => {
                  const isSelected = item.value === value;
                  return (
                    <TouchableOpacity
                      activeOpacity={0.6}
                      onPress={() => handleSelect(item.value)}
                      style={tw`py-3.5 px-4 border-b border-[${colors.borderLight}] flex flex-row items-center justify-between ${
                        isSelected ? `bg-[${colors.primarySurface}]` : ''
                      }`}
                    >
                      <Text style={tw`text-sm font-medium ${isSelected ? `text-[${colors.primary}] font-bold` : `text-[${colors.textPrimary}]`}`}>
                        {item.label}
                      </Text>
                      {isSelected && <Check size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <Text style={tw`text-sm text-[${colors.textMuted}] text-center py-5 px-4`}>
                    कोणतेही पर्याय उपलब्ध नाहीत
                  </Text>
                }
              />

              {/* Footer action — "+ नवीन मशीन नोंदवा" */}
              {footerActionLabel && onFooterAction && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleFooterAction}
                  style={styles.footerAction}
                >
                  <View style={styles.footerIconWrap}>
                    <Plus size={14} color={colors.primary} />
                  </View>
                  <Text style={styles.footerActionText}>{footerActionLabel}</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    backgroundColor: colors.primarySurface,
  },
  footerIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default AppDropdown;
