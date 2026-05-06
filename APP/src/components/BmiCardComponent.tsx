import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Measurement, MeasurementType } from 'moveplus-shared';
import {
  calculateBMI,
  getBMIStatus,
  getBMILabel,
  getBMIRiskLabel,
  MEASUREMENT_STATUS_COLORS,
  MEASUREMENT_STATUS_BG_COLORS,
} from '@utils/healthColorSystem';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { shadowStyles } from '@src/styles/shadow';
import { useTranslation } from 'react-i18next';

interface Props {
  measurements: Measurement[];
}

export const BmiCardComponent: React.FC<Props> = ({ measurements }) => {
  const { t } = useTranslation();

  const bmiData = useMemo(() => {
    const sorted = [...measurements].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latestWeight = sorted.find(m => m.type === MeasurementType.WEIGHT);
    const latestHeight = sorted.find(m => m.type === MeasurementType.HEIGHT);
    if (!latestWeight || !latestHeight) return null;

    const bmi = calculateBMI(latestWeight.value, latestHeight.value);
    const status = getBMIStatus(bmi);
    return {
      bmi,
      status,
      label: getBMILabel(bmi),
      risk:  getBMIRiskLabel(bmi),
      weightKg: latestWeight.value,
      heightCm: latestHeight.value,
    };
  }, [measurements]);

  if (!bmiData) return null;

  const color  = MEASUREMENT_STATUS_COLORS[bmiData.status];
  const bgColor = MEASUREMENT_STATUS_BG_COLORS[bmiData.status];

  // ── BMI scale segments (7 segments left → right, active one highlighted) ──
  const segments: { label: string; min: number; max: number; status: string }[] = [
    { label: 'Magreza\nGrave',   min: 0,    max: 17,   status: 'RED'    },
    { label: 'Magreza\nLeve',    min: 17,   max: 18.5, status: 'ORANGE' },
    { label: 'Normal',           min: 18.5, max: 25,   status: 'GREEN'  },
    { label: 'Sobrepeso',        min: 25,   max: 30,   status: 'YELLOW' },
    { label: 'Obesi.\nGrau I',   min: 30,   max: 35,   status: 'ORANGE' },
    { label: 'Obesi.\nGrau II',  min: 35,   max: 40,   status: 'RED'    },
    { label: 'Obesi.\nGrau III', min: 40,   max: 100,  status: 'RED'    },
  ];

  const activeIndex = segments.findIndex(
    s => bmiData.bmi >= s.min && bmiData.bmi < s.max
  );

  return (
    <View style={[styles.card, shadowStyles.cardShadow]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconBubble, { backgroundColor: bgColor }]}>
          <MaterialIcons name="monitor-weight" size={22} color={color} />
        </View>
        <Text style={styles.cardTitle}>{t('measurements.bmi.title')}</Text>
      </View>

      {/* Main value */}
      <View style={[styles.valueBanner, { backgroundColor: bgColor }]}>
        <Text style={[styles.bmiValue, { color }]}>{bmiData.bmi.toFixed(1)}</Text>
        <Text style={[styles.bmiUnit, { color }]}>kg/m²</Text>
        <View style={styles.labelContainer}>
          <Text style={[styles.bmiLabel, { color }]}>{bmiData.label}</Text>
          <Text style={[styles.bmiRisk, { color }]}>
            {t('measurements.bmi.risk')}: {bmiData.risk}
          </Text>
        </View>
      </View>

      {/* Scale bar */}
      <View style={styles.scaleRow}>
        {segments.map((seg, i) => {
          const isActive = i === activeIndex;
          const segColor = MEASUREMENT_STATUS_COLORS[seg.status as keyof typeof MEASUREMENT_STATUS_COLORS];
          return (
            <View key={i} style={styles.segmentWrapper}>
              <View
                style={[
                  styles.segment,
                  { backgroundColor: isActive ? segColor : segColor + '40' },
                  isActive && styles.segmentActive,
                ]}
              >
                {isActive && (
                  <MaterialIcons name="arrow-drop-down" size={14} color={segColor} style={styles.segmentArrow} />
                )}
              </View>
              <Text style={[styles.segmentLabel, isActive && { color: segColor, fontFamily: FontFamily.semi_bold }]}>
                {seg.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Source measurements */}
      <View style={styles.sourceRow}>
        <Text style={styles.sourceText}>
          {t('measurements.bmi.basedOn', {
            weight: bmiData.weightKg.toFixed(1),
            height: bmiData.heightCm.toFixed(0),
          })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Color.Background.white,
    borderRadius: Border.lg_16,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm_8,
    paddingHorizontal: Spacing.md_16,
    paddingTop: Spacing.md_16,
    paddingBottom: Spacing.sm_8,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.dark,
  },
  valueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_8,
    gap: Spacing.xs_4,
  },
  bmiValue: {
    fontFamily: FontFamily.extraBold,
    fontSize: 36,
  },
  bmiUnit: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.caption_12,
    marginTop: 4,
    marginRight: Spacing.sm_8,
  },
  labelContainer: {
    flex: 1,
  },
  bmiLabel: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodymedium_16,
  },
  bmiRisk: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    opacity: 0.8,
  },
  scaleRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm_8,
    paddingTop: Spacing.sm_8,
    gap: 2,
  },
  segmentWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  segment: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentActive: {
    height: 8,
    borderRadius: 4,
  },
  segmentArrow: {
    position: 'absolute',
    top: -14,
  },
  segmentLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 8,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  sourceRow: {
    paddingHorizontal: Spacing.md_16,
    paddingTop: Spacing.xs_4,
    paddingBottom: Spacing.md_16,
  },
  sourceText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v400,
  },
});
