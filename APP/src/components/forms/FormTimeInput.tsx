import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { useTranslation } from '@src/localization/hooks/useTranslation';

interface FormTimeInputProps {
  title: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  required?: boolean;
}

const formatTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

const makeNow = () => {
  const d = new Date();
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
};

export const FormTimeInput: React.FC<FormTimeInputProps> = ({
  title,
  value,
  onChange,
  placeholder,
  required = false,
}) => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value ?? makeNow());

  const handleOpen = () => {
    setTempDate(value ?? makeNow());
    setShow(true);
  };

  const handleAndroidChange = (_: any, selected?: Date) => {
    setShow(false);
    if (selected) onChange(selected);
  };

  const handleIOSChange = (_: any, selected?: Date) => {
    if (selected) setTempDate(selected);
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setShow(false);
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {title}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <TouchableOpacity style={styles.input} onPress={handleOpen}>
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {value ? formatTime(value) : (placeholder ?? '--:--')}
        </Text>
      </TouchableOpacity>

      {Platform.OS === 'android' && show && (
        <DateTimePicker
          mode="time"
          value={value}
          display="default"
          is24Hour
          onChange={handleAndroidChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={show}
          transparent
          animationType="fade"
          onRequestClose={() => setShow(false)}
        >
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShow(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.pickerContainer}>
              <DateTimePicker
                mode="time"
                value={tempDate}
                display="spinner"
                is24Hour
                onChange={handleIOSChange}
                style={styles.spinner}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setShow(false)} style={styles.modalBtn}>
                  <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirm} style={styles.modalBtn}>
                  <Text style={styles.confirmText}>{t('common.confirm')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    width: '100%',
  },
  label: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
    marginBottom: Spacing.xs_4,
  },
  required: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.Error.default,
  },
  input: {
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    borderRadius: Border.sm_8,
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_8,
    backgroundColor: Color.Background.white,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.dark,
  },
  placeholderText: {
    color: Color.Gray.v400,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: Color.Background.white,
    borderRadius: Border.md_12,
    overflow: 'hidden',
    width: 300,
  },
  spinner: {
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Color.Gray.v200,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: Spacing.md_16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
  },
  confirmText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.primary,
  },
});
