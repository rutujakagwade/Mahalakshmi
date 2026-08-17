import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors } from '../theme';

interface AppInputProps extends TextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  readOnly?: boolean;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder = '',
  keyboardType = 'default',
  rightIcon,
  leftIcon,
  readOnly = false,
  error,
  helperText,
  required = false,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, error && styles.labelError]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View style={[styles.inputWrapper, error && styles.inputWrapperError, readOnly && styles.readOnly]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          editable={!readOnly}
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
          ]}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
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
    color: colors.textSecondary,
    marginBottom: 4,
  },
  labelError: {
    color: colors.error,
  },
  required: {
    color: colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
  },
  inputWrapperError: {
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
  },
  readOnly: {
    backgroundColor: colors.surfaceTertiary,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputWithLeftIcon: {
    paddingLeft: 36,
  },
  inputWithRightIcon: {
    paddingRight: 36,
  },
  leftIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  helperText: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  errorText: {
    color: colors.error,
  },
});

export default AppInput;
