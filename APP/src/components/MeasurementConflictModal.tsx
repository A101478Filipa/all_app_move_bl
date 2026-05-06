import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MeasurementStatus } from 'moveplus-shared';
import { MEASUREMENT_STATUS_COLORS, getStatusLabel } from '@utils/healthColorSystem';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { shadowStyles } from '@src/styles/shadow';
import { useTranslation } from 'react-i18next';

interface Props {
  visible: boolean;
  doctorStatus: MeasurementStatus;
  referenceStatus: MeasurementStatus;
  onConfirm: () => void;
  onCorrect: () => void;
}

/**
 * Shown when the doctor's chosen status conflicts with the reference scale.
 */
export const MeasurementConflictModal: React.FC<Props> = ({
  visible,
  doctorStatus,
  referenceStatus,
  onConfirm,
  onCorrect,
}) => {
  const { t } = useTranslation();

  const doctorColor  = MEASUREMENT_STATUS_COLORS[doctorStatus];
  const refColor     = MEASUREMENT_STATUS_COLORS[referenceStatus];
  const doctorLabel  = getStatusLabel(doctorStatus);
  const refLabel     = getStatusLabel(referenceStatus);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, shadowStyles.cardShadow]}>

          {/* Warning icon */}
          <View style={styles.iconContainer}>
            <MaterialIcons name="warning" size={36} color={Color.Warning.amber} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{t('measurements.conflict.title')}</Text>

          {/* Body */}
          <Text style={styles.body}>
            {t('measurements.conflict.body', {
              referenceStatus: refLabel,
              doctorStatus: doctorLabel,
            })}
          </Text>

          {/* Status comparison */}
          <View style={styles.statusRow}>
            <View style={styles.statusChip}>
              <View style={[styles.dot, { backgroundColor: refColor }]} />
              <Text style={styles.statusChipText}>
                {t('measurements.conflict.scale')}: {refLabel}
              </Text>
            </View>
            <MaterialIcons name="arrow-forward" size={18} color={Color.Gray.v400} />
            <View style={styles.statusChip}>
              <View style={[styles.dot, { backgroundColor: doctorColor }]} />
              <Text style={styles.statusChipText}>
                {t('measurements.conflict.yours')}: {doctorLabel}
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={onCorrect}>
              <Text style={styles.btnOutlineText}>{t('measurements.conflict.correct')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onConfirm}>
              <Text style={styles.btnPrimaryText}>{t('measurements.conflict.confirm')}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg_24,
  },
  card: {
    backgroundColor: Color.Background.white,
    borderRadius: Border.md_12,
    padding: Spacing.lg_24,
    alignItems: 'center',
    gap: Spacing.md_16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.dark,
    textAlign: 'center',
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
    textAlign: 'center',
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm_8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Color.Background.subtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusChipText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.caption_12,
    color: Color.dark,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm_8,
    alignSelf: 'stretch',
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Border.sm_8,
    alignItems: 'center',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: Color.primary,
  },
  btnOutlineText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.primary,
  },
  btnPrimary: {
    backgroundColor: Color.primary,
  },
  btnPrimaryText: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.Background.white,
  },
});
