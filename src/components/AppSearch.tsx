import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';

interface AppSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const AppSearch: React.FC<AppSearchProps> = ({
  value,
  onChangeText,
  placeholder = 'शोधा...',
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a8a29e"
        style={styles.input}
      />
      <View style={styles.iconWrapper} pointerEvents="none">
        <Search size={18} color="#a8a29e" />
      </View>
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
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 10,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 40,
    fontSize: 14,
    color: '#1c1917',
  },
  iconWrapper: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppSearch;
