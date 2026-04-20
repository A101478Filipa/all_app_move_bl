import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ClinicianDashboardScreen from "@screens/clinician/ClinicianDashboardScreen";
import ElderlyDetailsScreen from "@src/screens/elderly/ElderlyDetailsScreen";
import InstitutionTimelineScreen from "@src/screens/institution/InstitutionTimelineScreen";
import ProfessionalCalendarScreen from "@src/screens/professional/ProfessionalCalendarScreen";
import MedicationDetailsScreen from "@src/screens/medication/MedicationDetailsScreen";
import MeasurementDetailsScreen from "@src/screens/measurements/MeasurementDetailsScreen";
import PathologyDetailsScreen from "@src/screens/pathology/PathologyDetailsScreen";
import { FallOccurrenceScreen } from "@src/screens/fallOccurrence/FallOccurrenceScreen";
import DataAccessRequestsScreen from "@src/screens/dataAccessRequest/DataAccessRequestsScreen";
import { ElderlyMeasurementsComponent, ElderlyMeasurementsArgs } from "@components/screens/ElderlyMeasurementsComponent";
import { NotificationCenterStack } from "@src/navigation/NotificationCenterStack";
import ElderlyCalendarScreen from "@src/screens/elderly/ElderlyCalendarScreen";
import AddCalendarEventScreen from "@src/screens/elderly/AddCalendarEventScreen";
import SelectElderlyScreen from "@src/screens/elderly/SelectElderlyScreen";
import ElderlyMedicationsListScreen from "@src/screens/elderly/ElderlyMedicationsListScreen";
import ElderlyPathologiesListScreen from "@src/screens/elderly/ElderlyPathologiesListScreen";
import ElderlyFallsListScreen from "@src/screens/elderly/ElderlyFallsListScreen";
import ElderlyMeasurementsListScreen from "@src/screens/elderly/ElderlyMeasurementsListScreen";
import ElderlySOSListScreen from "@src/screens/elderly/ElderlySOSListScreen";
import { getScreenOptionsWithNavigation } from "@src/utils/navigationHelper";
import { useTranslation } from "@src/localization/hooks/useTranslation";
import React from "react";
import { DashboardCustomHeader } from "@components/DashboardCustomHeader";
import { Color } from "@src/styles/colors";
import { CalendarEvent } from "moveplus-shared";

export type ClinicianDashboardNavigationStackParamList = {
  ClinicianDashboardScreen: undefined;
  NotificationCenter: undefined;
  DataAccessRequests: {
    filter: 'APPROVED' | 'PENDING';
  };
  SelectElderlyScreen: {
    calendarMode?: boolean;
    selectedDate?: string;
  } | undefined;
  ElderlyDetails: {
    name: string;
    elderlyId: number;
  };
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
  ElderlyMeasurements: ElderlyMeasurementsArgs;
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
  ElderlyMeasurementsList: {
    elderlyId: number;
  };
  ElderlySOSList: {
    elderlyId: number;
  };
  ProfessionalCalendar: {
    userId: number;
    professionalName?: string;
    isAdmin?: boolean;
  };
  InstitutionTimelineScreen: undefined;
};

const Stack = createNativeStackNavigator<ClinicianDashboardNavigationStackParamList>();

export const ClinicianDashboardNavigationStack = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={({ navigation }) => ({
      ...getScreenOptionsWithNavigation(navigation),
      headerLargeTitle: false,
      headerTransparent: false,
    })}>
      <Stack.Screen
        name='ClinicianDashboardScreen'
        component={ClinicianDashboardScreen}
        options={{
          headerTitle: () => <DashboardCustomHeader />,
          headerLeft: undefined,
          headerStyle: {
            backgroundColor: Color.Background.subtle,
          },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name='NotificationCenter'
        component={NotificationCenterStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='DataAccessRequests'
        component={DataAccessRequestsScreen}
        options={({ route }) => ({
          title: route.params.filter === 'APPROVED'
            ? t('dataAccessRequest.approvedRequests')
            : t('dataAccessRequest.pendingRequests'),
        })}
      />
      <Stack.Screen
        name='SelectElderlyScreen'
        component={SelectElderlyScreen}
        options={{ title: t('navigation.selectPatient') }}
      />
      <Stack.Screen
        name='ElderlyDetails'
        component={ElderlyDetailsScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <Stack.Screen
        name='MedicationDetails'
        component={MedicationDetailsScreen}
        options={{ title: t('navigation.medicationDetails') }}
      />
      <Stack.Screen
        name='MeasurementDetails'
        component={MeasurementDetailsScreen}
        options={{ title: t('navigation.measurementDetails') }}
      />
      <Stack.Screen
        name='PathologyDetails'
        component={PathologyDetailsScreen}
        options={{ title: t('navigation.pathologyDetails') }}
      />
      <Stack.Screen
        name='FallOccurrenceScreen'
        component={FallOccurrenceScreen}
        options={{ title: t('navigation.fallOccurrence') }}
      />
      <Stack.Screen
        name='ElderlyMeasurements'
        component={ElderlyMeasurementsComponent}
        options={{ title: t('navigation.measurements') }}
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
        name='ProfessionalCalendar'
        component={ProfessionalCalendarScreen}
        options={({ route }) => ({ title: route.params?.professionalName ? `${route.params.professionalName} · ${t('navigation.calendar')}` : t('navigation.calendar') })}
      />
      <Stack.Screen
        name='InstitutionTimelineScreen'
        component={InstitutionTimelineScreen}
        options={{ title: t('navigation.fallTimeline') }}
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
