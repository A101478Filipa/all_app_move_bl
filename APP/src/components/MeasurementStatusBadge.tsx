import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  MeasurementStatus,
  MEASUREMENT_STATUS_COLORS,
  MEASUREMENT_STATUS_BG_COLORS,
  getStatusLabel,
  getStatusIcon,
} from '@utils/healthColorSystem';
import { FontFamily, FontSize } from '@src/styles/fonts';

interface Props {
  status: MeasurementStatus;
  /** If true, renders as a compact dot without text */
  compact?: boolean;
  /** Optional sub-label (e.g. "Febre", "Normal") */
  subLabel?: string;
}

export const MeasurementStatusBadge: React.FC<Props> = ({ status, compact = false, subLabel }) => {
  const color = MEASUREMENT_STATUS_COLORS[status];
  const bgColor = MEASUREMENT_STATUS_BG_COLORS[status];

  if (compact) {
    return <View style={[styles.dot, { backgroundColor: color }]} />;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <MaterialIcons name={getStatusIcon(status) as any} size={16} color={color} />
      <Text style={[styles.label, { color }]}>{getStatusLabel(status)}</Text>
      {subLabel ? <Text style={[styles.subLabel, { color }]}>{subLabel}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  label: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.caption_12,
  },
  subLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    opacity: 0.85,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
