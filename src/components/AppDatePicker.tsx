import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface AppDatePickerProps {
  value: string; // Format: DD/MM/YYYY
  onChange: (dateStr: string) => void;
  label?: string;
}

export const AppDatePicker: React.FC<AppDatePickerProps> = ({ value, onChange, label }) => {
  const [show, setShow] = useState(false);

  // Parse DD/MM/YYYY to Date object
  const parseDate = (str: string): Date => {
    try {
      const parts = str.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    } catch (e) {}
    return new Date();
  };

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(formatDate(selectedDate));
    }
  };

  const dateValue = parseDate(value);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.pickerButton} onPress={() => setShow(true)}>
        <Text style={styles.dateText}>{value || 'तारीख निवडा'}</Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#44403c',
    marginBottom: 4,
  },
  pickerButton: {
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#d6d3d1',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dateText: {
    fontSize: 14,
    color: '#1c1917',
  },
});

export default AppDatePicker;
