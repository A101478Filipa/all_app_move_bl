import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Border } from '@src/styles/borders';

export const BODY_LOCATION_GROUPS = [
  { key: 'head', locations: ['HEAD', 'FACE', 'NECK'] },
  { key: 'trunk', locations: ['SHOULDER_LEFT', 'SHOULDER_RIGHT', 'CHEST', 'ABDOMEN', 'BACK_UPPER', 'BACK_LOWER', 'PELVIS'] },
  { key: 'upperLimbs', locations: ['ARM_UPPER_LEFT', 'ARM_UPPER_RIGHT', 'ELBOW_LEFT', 'ELBOW_RIGHT', 'FOREARM_LEFT', 'FOREARM_RIGHT', 'WRIST_LEFT', 'WRIST_RIGHT', 'HAND_LEFT', 'HAND_RIGHT'] },
  { key: 'lowerLimbs', locations: ['HIP_LEFT', 'HIP_RIGHT', 'THIGH_LEFT', 'THIGH_RIGHT', 'KNEE_LEFT', 'KNEE_RIGHT', 'LEG_LOWER_LEFT', 'LEG_LOWER_RIGHT', 'ANKLE_LEFT', 'ANKLE_RIGHT', 'FOOT_LEFT', 'FOOT_RIGHT'] },
];

interface Props {
  selected: string[];
  onChange: (locations: string[]) => void;
  label?: string;
}

const BodyLocationPicker: React.FC<Props> = ({ selected, onChange, label }) => {
  const { t } = useTranslation();

  const toggle = (loc: string) => {
    onChange(selected.includes(loc) ? selected.filter(l => l !== loc) : [...selected, loc]);
  };

  return (
    <View style={styles.wrapper}>
      {label !== undefined && (
        <Text style={styles.label}>{label || t('woundTracking.bodyLocation')}</Text>
      )}
      {BODY_LOCATION_GROUPS.map(group => (
        <View key={group.key} style={styles.group}>
          <Text style={styles.groupTitle}>{t(`woundTracking.bodyLocationGroup_${group.key}`)}</Text>
          <View style={styles.chips}>
            {group.locations.map(loc => {
              const active = selected.includes(loc);
              return (
                <TouchableOpacity
                  key={loc}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggle(loc)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {t(`woundTracking.bodyLocation_${loc}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.sm_8,
  },
  label: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  group: {
    gap: Spacing.xs_4,
  },
  groupTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodysmall_14 - 1,
    color: Color.Gray.v400,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs_4,
  },
  chip: {
    paddingHorizontal: Spacing.sm_8,
    paddingVertical: Spacing.xs_4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    backgroundColor: Color.white,
  },
  chipActive: {
    backgroundColor: Color.primary,
    borderColor: Color.primary,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14 - 1,
    color: Color.Gray.v400,
  },
  chipTextActive: {
    color: Color.white,
  },
});

export default BodyLocationPicker;
