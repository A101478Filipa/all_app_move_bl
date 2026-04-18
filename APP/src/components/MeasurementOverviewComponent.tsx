import React, { useMemo } from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Measurement, MeasurementType } from 'moveplus-shared';
import { HStack, Spacer, VStack } from '@components/CoreComponents';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { formatDate } from '@utils/Date';
import { MaterialIcons } from '@expo/vector-icons';
import { fillStyles } from '@styles/fill';
import { shadowStyles } from '@styles/shadow';
import { Border } from '@styles/borders';
import { getMeasurementTypeLabel, getMeasurementUnitSymbol } from '@utils/measurementHelper';
import { useTranslation } from 'react-i18next';

export interface MeasurementOverviewComponentProps {
  elderlyId: number;
  measurementType: MeasurementType;
  measurements: Measurement[];
  navigation: any;
}

export const MeasurementOverviewComponent: React.FC<MeasurementOverviewComponentProps> = ({
  elderlyId,
  measurementType,
  measurements,
  navigation
}) => {
  const { t } = useTranslation();

  const latestMeasurement = useMemo(
    () => (measurements?.length > 0 ? measurements[measurements.length - 1] : null),
    [measurements]
  );

  const formatMeasurementValue = (value: number, measurement: Measurement) => {
    const unitSymbol = getMeasurementUnitSymbol(measurement.unit);
    return `${value}${unitSymbol ? ` ${unitSymbol}` : ''}`;
  };

  const onPress = () => {
    navigation.push('ElderlyMeasurements', {
      elderlyId,
      measurementType
    });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
    >
      <HStack align='center' style={styles.content}>
        <VStack align="flex-start" spacing={Spacing.xs_4}>
          <Text style={styles.measurementType}>{getMeasurementTypeLabel(measurementType, t)}</Text>

          {latestMeasurement && (
            <VStack align="flex-start" spacing={Spacing.xxs_2}>
              <Text style={styles.latestValue}>
                {formatMeasurementValue(latestMeasurement.value, latestMeasurement)}
              </Text>

              <Text style={styles.dateText}>
                {formatDate(latestMeasurement.createdAt)}
              </Text>
            </VStack>
          )}
        </VStack>

        <Spacer/>

        <MaterialIcons name="chevron-right" size={24} color={Color.Gray.v400}/>
      </HStack>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    ...shadowStyles.cardShadow,
    backgroundColor: Color.Background.white,
    borderRadius: Border.sm_8,
  },
  content: {
    paddingVertical: Spacing.sm_8,
    paddingHorizontal: Spacing.md_16,
  },
  measurementType: {
    fontFamily: FontFamily.semi_bold,
    fontSize: FontSize.bodymedium_16,
    color: Color.dark,
  },
  latestValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.heading3_24,
    color: Color.primary,
  },
  dateText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption_12,
    color: Color.Gray.v500,
  },
});
