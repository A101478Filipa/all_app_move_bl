import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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

const pad = (n: number) => String(n).padStart(2, '0');

export const FormTimeInput: React.FC<FormTimeInputProps> = ({
  title,
  value,
  onChange,
  placeholder,
  required = false,
}) => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  const handleOpen = () => {
    const base = value ?? makeNow();
    setHours(base.getHours());
    setMinutes(base.getMinutes());
    setShow(true);
  };

  const handleConfirm = () => {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    onChange(d);
    setShow(false);
  };

  const changeHours = (delta: number) => setHours(h => (h + delta + 24) % 24);
  const changeMinutes = (delta: number) => setMinutes(m => (m + delta + 60) % 60);

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

      <Modal
        visible={show}
        transparent
        animationType="fade"
        onRequestClose={() => setShow(false)}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShow(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>{title}</Text>

            <View style={styles.wheelRow}>
              {/* Hours */}
              <View style={styles.wheelCol}>
                <TouchableOpacity onPress={() => changeHours(1)} style={styles.arrowBtn}>
                  <MaterialIcons name="keyboard-arrow-up" size={32} color={Color.primary} />
                </TouchableOpacity>
                <Text style={styles.wheelValue}>{pad(hours)}</Text>
                <TouchableOpacity onPress={() => changeHours(-1)} style={styles.arrowBtn}>
                  <MaterialIcons name="keyboard-arrow-down" size={32} color={Color.primary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.separator}>:</Text>

              {/* Minutes */}
              <View style={styles.wheelCol}>
                <TouchableOpacity onPress={() => changeMinutes(5)} style={styles.arrowBtn}>
                  <MaterialIcons name="keyboard-arrow-up" size={32} color={Color.primary} />
                </TouchableOpacity>
                <Text style={styles.wheelValue}>{pad(minutes)}</Text>
                <TouchableOpacity onPress={() => changeMinutes(-5)} style={styles.arrowBtn}>
                  <MaterialIcons name="keyboard-arrow-down" size={32} color={Color.primary} />
                </TouchableOpacity>
              </View>
            </View>

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
    width: 280,
    paddingTop: Spacing.lg_24,
  },
  pickerTitle: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.semi_bold,
    color: Color.dark,
    textAlign: 'center',
    marginBottom: Spacing.md_16,
  },
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg_24,
    marginBottom: Spacing.md_16,
    gap: 8,
  },
  wheelCol: {
    alignItems: 'center',
    width: 72,
  },
  arrowBtn: {
    padding: Spacing.xs_4,
  },
  wheelValue: {
    fontSize: 40,
    fontFamily: FontFamily.bold ?? FontFamily.semi_bold,
    color: Color.dark,
    lineHeight: 52,
  },
  separator: {
    fontSize: 36,
    fontFamily: FontFamily.bold ?? FontFamily.semi_bold,
    color: Color.dark,
    marginBottom: 4,
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
