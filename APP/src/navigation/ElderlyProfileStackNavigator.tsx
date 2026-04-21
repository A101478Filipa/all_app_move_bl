import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ElderlyHomepageScreen from "@screens/elderly/ElderlyHomepageScreen";
import MedicationDetailsScreen from "@src/screens/medication/MedicationDetailsScreen";
import MeasurementDetailsScreen from "@src/screens/measurements/MeasurementDetailsScreen";
import PathologyDetailsScreen from "@src/screens/pathology/PathologyDetailsScreen";
import { FallOccurrenceScreen } from "@src/screens/fallOccurrence/FallOccurrenceScreen";
import { SosOccurrenceScreen } from "@src/screens/sosOccurrence/SosOccurrenceScreen";
import { ElderlyMeasurementsComponent, ElderlyMeasurementsArgs } from "@components/screens/ElderlyMeasurementsComponent";
import ElderlyCalendarScreen from "@src/screens/elderly/ElderlyCalendarScreen";
import ElderlyMedicationsListScreen from "@src/screens/elderly/ElderlyMedicationsListScreen";
import ElderlyPathologiesListScreen from "@src/screens/elderly/ElderlyPathologiesListScreen";
import ElderlyFallsListScreen from "@src/screens/elderly/ElderlyFallsListScreen";
import ElderlyWoundTrackingScreen from "@src/screens/elderly/ElderlyWoundTrackingScreen";
import ElderlyMeasurementsListScreen from "@src/screens/elderly/ElderlyMeasurementsListScreen";
import ElderlySOSListScreen from "@src/screens/elderly/ElderlySOSListScreen";
import { getScreenOptionsWithNavigation } from "@src/utils/navigationHelper";
import { useTranslation } from "@src/localization/hooks/useTranslation";
import React from "react";

export type ElderlyProfileStackParamList = {
  ElderlyHomepage: undefined;
  MedicationDetails: {
    medicationId: number;
  };
  MeasurementDetails: {
    measurementId: number;
  };
  PathologyDetails: {
    pathologyId: number;
  };
  FallOccurrenceScreen: {
    occurrenceId: number;
  };
  SosOccurrenceScreen: {
    occurrenceId: number;
  };
  ElderlyMeasurements: ElderlyMeasurementsArgs;
  ElderlyCalendar: {
    elderlyId: number;
    elderlyName?: string;
  };
  ElderlyMedicationsList: {
    elderlyId: number;
  };
  ElderlyPathologiesList: {
    elderlyId: number;
  };
  ElderlyFallsList: {
    elderlyId: number;
  };
  ElderlyWoundTrackingScreen: {
    elderlyId: number;
  };
  ElderlyMeasurementsList: {
    elderlyId: number;
  };
  ElderlySOSList: {
    elderlyId: number;
  };
};

const Stack = createNativeStackNavigator<ElderlyProfileStackParamList>();

export const ElderlyProfileStackNavigator = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={({ navigation }) => ({
      ...getScreenOptionsWithNavigation(navigation),
      headerLargeTitle: false,
      headerTransparent: false,
    })}>
      <Stack.Screen
        name='ElderlyHomepage'
        component={ElderlyHomepageScreen}
        options={{
          title: t('elderly.profile'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='MedicationDetails'
        component={MedicationDetailsScreen}
        options={{ title: t('medication.title') }}
      />
      <Stack.Screen
        name='MeasurementDetails'
        component={MeasurementDetailsScreen}
        options={{ title: t('measurements.measurementDetails') }}
      />
      <Stack.Screen
        name='PathologyDetails'
        component={PathologyDetailsScreen}
        options={{ title: t('pathology.title') }}
      />
      <Stack.Screen
        name='FallOccurrenceScreen'
        component={FallOccurrenceScreen}
        options={{ title: t('fallOccurrence.title') }}
      />
      <Stack.Screen
        name='SosOccurrenceScreen'
        component={SosOccurrenceScreen}
        options={{ title: t('sosOccurrence.title') }}
      />
      <Stack.Screen
        name='ElderlyMeasurements'
        component={ElderlyMeasurementsComponent}
        options={{ title: t('measurements.title') }}
      />
      <Stack.Screen
        name='ElderlyCalendar'
        component={ElderlyCalendarScreen}
        options={({ route }) => ({ title: t('navigation.calendar') })}
      />
      <Stack.Screen
        name='ElderlyMedicationsList'
        component={ElderlyMedicationsListScreen}
        options={{ title: t('navigation.medicationDetails') }}
      />
      <Stack.Screen
        name='ElderlyPathologiesList'
        component={ElderlyPathologiesListScreen}
        options={{ title: t('navigation.pathologyDetails') }}
      />
      <Stack.Screen
        name='ElderlyFallsList'
        component={ElderlyFallsListScreen}
        options={{ title: t('navigation.fallOccurrence') }}
      />
      <Stack.Screen
        name='ElderlyWoundTrackingScreen'
        component={ElderlyWoundTrackingScreen}
        options={{ title: t('woundTracking.title') }}
      />
      <Stack.Screen
        name='ElderlyMeasurementsList'
        component={ElderlyMeasurementsListScreen}
        options={{ title: t('measurements.title') }}
      />
      <Stack.Screen
        name='ElderlySOSList'
        component={ElderlySOSListScreen}
        options={{ title: t('sosOccurrence.title') }}
      />
    </Stack.Navigator>
  );
};
