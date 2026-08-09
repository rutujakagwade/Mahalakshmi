import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface AppInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  rightIcon?: React.ReactNode;
  readOnly?: boolean;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder = '',
  keyboardType = 'default',
  rightIcon,
  readOnly = false,
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <TextInput
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#a8a29e"
          editable={!readOnly}
          style={styles.input}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#44403c',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1c1917',
  },
  rightIcon: {
    position: 'absolute',
    right: 12,
  },
});

export default AppInput;
