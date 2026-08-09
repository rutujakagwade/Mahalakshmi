import tw from 'twrnc';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react-native';

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
  className?: string;
}

export const AppDropdown: React.FC<AppDropdownProps> = ({
  label,
  value,
  onChange,
  onChangeText,
  options,
  className = '',
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value) || { label: value, value };

  const handleSelect = (val: string) => {
    if (onChange) onChange(val);
    if (onChangeText) onChangeText(val);
    setModalVisible(false);
  };

  return (
    <View style={tw`w-full flex flex-col gap-1.5 ${className}`}>
      {label && <Text style={tw`text-xs font-semibold text-stone-700`}>{label}</Text>}
      
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setModalVisible(true)}
        style={tw`w-full bg-stone-50 border border-stone-300 rounded-lg py-2.5 px-3 flex flex-row items-center justify-between`}
      >
        <Text style={tw`text-stone-900 text-sm font-medium`}>{selectedOption.label}</Text>
        <ChevronDown size={18} style={tw`text-stone-500`} />
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
          style={tw`flex-1 bg-stone-900/50 justify-center items-center p-4`}
        >
          <View style={tw`w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden`}>
            {label && (
              <View style={tw`bg-[#6B121C] py-3.5 px-4`}>
                <Text style={tw`text-white font-bold text-sm`}>{label}</Text>
              </View>
            )}
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => handleSelect(item.value)}
                  style={tw`py-3.5 px-4 border-b border-stone-100 flex flex-row items-center justify-between ${
                    item.value === value ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <Text style={tw`text-sm font-medium ${item.value === value ? 'text-[#6B121C] font-bold' : 'text-stone-800'}`}>
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <View style={tw`w-2 h-2 rounded-full bg-[#6B121C]`} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default AppDropdown;
