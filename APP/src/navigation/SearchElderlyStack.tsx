import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import SearchElderlyScreen from '@screens/clinician/SearchElderlyScreen';
import ElderlyDetailsScreen from '@screens/elderly/ElderlyDetailsScreen';
import AddMedicationScreen from '@screens/medication/AddMedicationScreen';
import MedicationDetailsScreen from '@screens/medication/MedicationDetailsScreen';
import EditMedicationScreen from '@screens/medication/EditMedicationScreen';
import AddMeasurementScreen from '@screens/measurements/AddMeasurementScreen';
import MeasurementDetailsScreen from '@screens/measurements/MeasurementDetailsScreen';
import AddPathologyScreen from '@screens/medication/AddPathologyScreen';
import PathologyDetailsScreen from '@screens/pathology/PathologyDetailsScreen';
import EditPathologyScreen from '@screens/pathology/EditPathologyScreen';
import FallOccurrenceScreen from '@screens/fallOccurrence/FallOccurrenceScreen';
import { ElderlyMeasurementsComponent, ElderlyMeasurementsArgs } from '@components/screens/ElderlyMeasurementsComponent';
import ElderlyCalendarScreen from '@src/screens/elderly/ElderlyCalendarScreen';
import AddCalendarEventScreen from '@src/screens/elderly/AddCalendarEventScreen';
import ElderlyMedicationsListScreen from '@src/screens/elderly/ElderlyMedicationsListScreen';
import ElderlyPathologiesListScreen from '@src/screens/elderly/ElderlyPathologiesListScreen';
import ElderlyFallsListScreen from '@src/screens/elderly/ElderlyFallsListScreen';
import ElderlyWoundTrackingScreen from '@src/screens/elderly/ElderlyWoundTrackingScreen';
import ElderlyMeasurementsListScreen from '@src/screens/elderly/ElderlyMeasurementsListScreen';
import ElderlySOSListScreen from '@src/screens/elderly/ElderlySOSListScreen';
import SosOccurrenceScreen from '@src/screens/sosOccurrence/SosOccurrenceScreen';
import { getScreenOptionsWithNavigation } from '@src/utils/navigationHelper';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { Pathology, Medication, MeasurementType, CalendarEvent } from 'moveplus-shared';

export type SearchElderlyStackParamList = {
  SearchElderly: undefined;
  ElderlyDetails: { elderlyId: number };
  AddMedication: { elderlyId: number };
  MedicationDetails: { medicationId: number };
  EditMedication: { medication: Medication; elderlyId: number };
  AddMeasurement: { elderlyId: number; prefillType?: MeasurementType };
  MeasurementDetails: { measurementId: number };
  ElderlyMeasurements: ElderlyMeasurementsArgs;
  AddPathology: { elderlyId: number };
  PathologyDetails: { pathologyId: number };
  EditPathology: { pathology: Pathology; elderlyId: number };
  FallOccurrenceScreen: { fallOccurrenceId: number };
  ElderlyCalendar: {
    elderlyId: number;
    elderlyName?: string;
  };
  AddCalendarEvent: {
    elderlyId: number;
    editEvent?: CalendarEvent;
    selectedDate?: string;
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
  SosOccurrenceScreen: {
    occurrenceId: number;
  };
};

const Stack = createNativeStackNavigator<SearchElderlyStackParamList>();

export const SearchElderlyStack = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={({ navigation }) => getScreenOptionsWithNavigation(navigation)}>
      <Stack.Screen
        name="SearchElderly"
        component={SearchElderlyScreen}
        options={{
          title: t('navigation.searchElderly'),
        }}
      />
      <Stack.Screen
        name="ElderlyDetails"
        component={ElderlyDetailsScreen}
        options={{
          title: t('navigation.patientDetails'),
        }}
      />
      <Stack.Screen
        name="MedicationDetails"
        component={MedicationDetailsScreen}
        options={{
          title: t('medication.title'),
        }}
      />
      <Stack.Screen
        name="MeasurementDetails"
        component={MeasurementDetailsScreen}
        options={{
          title: t('measurements.title'),
        }}
      />
      <Stack.Screen
        name="ElderlyMeasurements"
        component={ElderlyMeasurementsComponent}
        options={{
          title: t('measurements.title'),
        }}
      />
      <Stack.Screen
        name="PathologyDetails"
        component={PathologyDetailsScreen}
        options={{
          title: t('pathology.title'),
        }}
      />
      <Stack.Screen
        name="EditPathology"
        component={EditPathologyScreen}
        options={{
          title: t('navigation.editPathology'),
        }}
      />
      <Stack.Screen
        name="FallOccurrenceScreen"
        component={FallOccurrenceScreen}
        options={{
          title: t('fallOccurrence.title'),
        }}
      />
      <Stack.Screen
        name='ElderlyCalendar'
        component={ElderlyCalendarScreen}
        options={{ title: t('navigation.calendar') }}
      />
      <Stack.Screen
        name='AddCalendarEvent'
        component={AddCalendarEventScreen}
        options={({ route }) => ({
          title: route.params?.editEvent
            ? t('navigation.editCalendarEvent')
            : t('navigation.addCalendarEvent'),
        })}
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
      <Stack.Screen
        name='SosOccurrenceScreen'
        component={SosOccurrenceScreen}
        options={{ title: t('sosOccurrence.title') }}
      />
    </Stack.Navigator>
  );
};
