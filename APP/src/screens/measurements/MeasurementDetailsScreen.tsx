import React, { useState, useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { InstitutionDashboardNavigationStackParamList } from '@src/navigation/InstitutionDashboardNavigationStack';
import { MeasurementDetailsComponent } from '@components/screens/MeasurementDetailsComponent';
import { measurementApi } from '@src/api/endpoints/measurements';
import { Measurement } from 'moveplus-shared';
import { ActivityIndicatorOverlay } from '@components/ActivityIndicatorOverlay';
import { useErrorHandler } from '@hooks/useErrorHandler';
import ScreenState from '@constants/screenState';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, Text } from 'react-native';
import { VStack } from '@components/CoreComponents';
import { MaterialIcons } from '@expo/vector-icons';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { StyleSheet } from 'react-native';

type Props = NativeStackScreenProps<InstitutionDashboardNavigationStackParamList, 'MeasurementDetails'>;

interface MeasurementDetailsScreenRouteParams {
  measurementId: number;
}

interface MeasurementWithElderly extends Measurement {
  elderly?: {
    id: number;
    name: string;
    institutionId: number;
  };
}

const MeasurementDetailsScreen: React.FC<Props> = ({ route }) => {
  const measurementId = (route.params as any).measurementId;
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();

  const [measurement, setMeasurement] = useState<MeasurementWithElderly | null>(null);
  const [state, setState] = useState<ScreenState>(ScreenState.LOADING);

  useEffect(() => {
    fetchMeasurement();
  }, [measurementId]);

  const fetchMeasurement = async () => {
    try {
      setState(ScreenState.LOADING);
      const response = await measurementApi.getMeasurement(measurementId);
      setMeasurement(response.data);
      setState(ScreenState.IDLE);
    } catch (error) {
      console.error('Failed to fetch measurement:', error);
      handleError(error, t('measurement.failedToLoadMeasurement'));
      setState(ScreenState.ERROR);
    }
  };

  if (state === ScreenState.LOADING) {
    return <ActivityIndicatorOverlay />;
  }

  if (state === ScreenState.ERROR || !measurement) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <VStack align="center" style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={Color.Error.default} />
          <Text style={styles.errorText}>{t('measurement.failedToLoadMeasurement')}</Text>
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <MeasurementDetailsComponent
      measurementType={measurement.type}
      value={measurement.value}
      unit={measurement.unit}
      notes={measurement.notes}
      createdAt={new Date(measurement.createdAt)}
      elderlyName={measurement.elderly?.name}
    />
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg_24,
  },
  errorText: {
    fontSize: FontSize.heading3_24,
    fontFamily: FontFamily.medium,
    color: Color.Error.default,
    textAlign: 'center',
    marginTop: Spacing.md_16,
  },
});

export default MeasurementDetailsScreen;