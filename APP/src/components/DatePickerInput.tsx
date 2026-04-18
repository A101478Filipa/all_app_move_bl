import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';

interface DatePickerInputProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  hasError?: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChange,
  hasError = false,
  maximumDate,
  minimumDate,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleConfirm = (date: Date) => {
    onChange(date);
    setShowPicker(false);
    setIsFocused(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
    setIsFocused(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const handlePress = () => {
    setShowPicker(true);
    setIsFocused(true);
  };

  const borderColor = hasError
    ? Color.Error.default
    : isFocused
    ? Color.primary
    : Color.Gray.v200;

  const labelColor = hasError
    ? Color.Error.default
    : isFocused
    ? Color.primary
    : Color.Gray.v400;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.inputContainer,
          { borderColor },
        ]}
        onPress={handlePress}
        activeOpacity={1}
      >
        <Text style={[styles.label, { color: labelColor }]}>
          {label}
        </Text>

        <Text style={styles.valueText}>{formatDate(value)}</Text>

        <MaterialIcons
          name="calendar-today"
          size={20}
          color={hasError ? Color.Error.default : Color.Gray.v400}
          style={styles.icon}
        />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePickerModal
          isVisible={showPicker}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          date={value}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          textColor={Color.black}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.lg_24,
    paddingTop: Spacing.lg_24 + Spacing.sm_8,
    paddingBottom: Spacing.sm_12,
    backgroundColor: Color.white,
    position: 'relative',
    minHeight: 56,
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: Spacing.lg_24,
    top: Spacing.sm_8,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    backgroundColor: Color.white,
  },
  valueText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodymedium_16,
    color: Color.black,
  },
  icon: {
    position: 'absolute',
    right: Spacing.md_16,
    top: 16,
  },
});
