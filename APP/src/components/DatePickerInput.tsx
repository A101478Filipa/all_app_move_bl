import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { useTranslation } from '@src/localization/hooks/useTranslation';

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
  const { t } = useTranslation();
  const defaultStyles = useDefaultStyles();
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(() => dayjs(value));

  const handlePress = () => {
    setTempDate(dayjs(value));
    setShowPicker(true);
  };

  const handleConfirm = () => {
    onChange(tempDate.toDate());
    setShowPicker(false);
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  const formatDate = (date: Date) => date.toLocaleDateString('pt-PT');

  const borderColor = hasError ? Color.Error.default : Color.Gray.v200;
  const labelColor = hasError ? Color.Error.default : Color.Gray.v400;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.inputContainer, { borderColor }]}
        onPress={handlePress}
        activeOpacity={1}
      >
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        <Text style={styles.valueText}>{formatDate(value)}</Text>
        <MaterialIcons
          name="calendar-today"
          size={20}
          color={hasError ? Color.Error.default : Color.Gray.v400}
          style={styles.icon}
        />
      </TouchableOpacity>

      <Modal
        transparent
        visible={showPicker}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleCancel}>
          <TouchableOpacity activeOpacity={1} style={styles.calendarContainer}>
            <DateTimePicker
              mode="single"
              date={tempDate.toDate()}
              onChange={(params) => setTempDate(dayjs(params.date))}
              minDate={minimumDate}
              maxDate={maximumDate}
              styles={{
                ...defaultStyles,
                selected: { backgroundColor: Color.primary, borderRadius: 100 },
                selected_label: { color: '#fff', fontWeight: 'bold' },
                today: { borderColor: Color.primary, borderWidth: 1, borderRadius: 100 },
              }}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={handleCancel} style={styles.button}>
                <Text style={styles.cancelText}>{t('common.cancel') ?? 'Cancelar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirm} style={styles.button}>
                <Text style={styles.confirmText}>{t('common.confirm') ?? 'Confirmar'}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: Color.white,
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    width: '90%',
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: Spacing.sm_8,
    gap: Spacing.md_16,
  },
  button: {
    paddingVertical: Spacing.sm_8,
    paddingHorizontal: Spacing.md_16,
  },
  cancelText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
  },
  confirmText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodymedium_16,
    color: Color.primary,
  },
});
