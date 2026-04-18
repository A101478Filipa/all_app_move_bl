import { createNativeStackNavigator } from "@react-navigation/native-stack";
import InstitutionDashboardScreen from "../screens/institution/InstitutionDashboardScreen";
import InstitutionTimelineScreen from "../screens/institution/InstitutionTimelineScreen";
import ProfessionalCalendarScreen from "@src/screens/professional/ProfessionalCalendarScreen";
import SelectElderlyScreen from "../screens/elderly/SelectElderlyScreen";
import AddMeasurementScreen from "../screens/measurements/AddMeasurementScreen";
import AddMedicationScreen from "@src/screens/medication/AddMedicationScreen";
import AddPathologyScreen from "@src/screens/medication/AddPathologyScreen";
import { FallOccurrenceScreen } from "@src/screens/fallOccurrence/FallOccurrenceScreen";
import { SosOccurrenceScreen } from "@src/screens/sosOccurrence/SosOccurrenceScreen";
import ElderlyDetailsScreen from "@src/screens/elderly/ElderlyDetailsScreen";
import CaregiverDetailsScreen from "@screens/caregiver/CaregiverDetailsScreen";
import InstitutionAdminDetailsScreen from "@screens/admin/AdminDetailsScreen";
import MedicationDetailsScreen from "@src/screens/medication/MedicationDetailsScreen";
import EditMedicationScreen from "@src/screens/medication/EditMedicationScreen";
import MeasurementDetailsScreen from "@src/screens/measurements/MeasurementDetailsScreen";
import PathologyDetailsScreen from "@src/screens/pathology/PathologyDetailsScreen";
import EditPathologyScreen from "@src/screens/pathology/EditPathologyScreen";
import { ElderlyMeasurementsComponent, ElderlyMeasurementsArgs } from "@components/screens/ElderlyMeasurementsComponent";
import { NotificationCenterStack } from "@src/navigation/NotificationCenterStack";
import ElderlyCalendarScreen from "@src/screens/elderly/ElderlyCalendarScreen";
import AddCalendarEventScreen from "@src/screens/elderly/AddCalendarEventScreen";
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
import { Pathology, Medication, MeasurementType, CalendarEvent, CalendarEventType } from "moveplus-shared";
import BathScheduleScreen from '@src/screens/institution/BathScheduleScreen';
import StaffScheduleManagementScreen from '@src/screens/professional/StaffScheduleManagementScreen';

export type InstitutionDashboardNavigationStackParamList = {
  InstitutionDashboardScreen: undefined;
  NotificationCenter: undefined;
  InstitutionTimelineScreen: undefined;
  SelectElderlyScreen: undefined;
  AddMeasurement: {
    elderlyId: number;
    prefillType?: MeasurementType;
  };
  AddMedication: {
    elderlyId: number;
  };
  AddPathology: {
    elderlyId: number;
  };
  HandleFallOccurrenceScreen: {
    occurrenceId: number;
  };
  FallOccurrenceScreen: {
    occurrenceId: number;
  };
  ElderlyDetails: {
    name: string;
    elderlyId: number;
  };
  CaregiverDetails: {
    name: string;
    caregiverId: number;
  };
  InstitutionAdminDetails: {
    name: string;
    adminId: number;
  };
  MedicationDetails: {
    medicationId: number;
  };
  EditMedication: {
    medication: Medication;
    elderlyId: number;
  };
  MeasurementDetails: {
    measurementId: number;
  };
  PathologyDetails: {
    pathologyId: number;
  };
  EditPathology: {
    pathology: Pathology;
    elderlyId: number;
  };
  ElderlyMeasurements: ElderlyMeasurementsArgs;
  SosOccurrenceScreen: {
    occurrenceId: number;
  };
  ElderlyCalendar: {
    elderlyId: number;
    elderlyName?: string;
  };
  AddCalendarEvent: {
    elderlyId: number;
    editEvent?: CalendarEvent;
    selectedDate?: string;
    prefillType?: CalendarEventType;
  };
  BathSchedule: undefined;
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
  StaffScheduleManagement: {
    userId: number;
    staffName: string;
  };
};

const Stack = createNativeStackNavigator<InstitutionDashboardNavigationStackParamList>();

export const InstitutionDashboardNavigationStack = () => {
  const { t } = useTranslation();

  return(
    <Stack.Navigator screenOptions={({ navigation }) => ({
      ...getScreenOptionsWithNavigation(navigation),
      headerLargeTitle: false,
      headerTransparent: false,
    })}>
      <Stack.Screen
        name='InstitutionDashboardScreen'
        component={InstitutionDashboardScreen}
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
        name='InstitutionTimelineScreen'
        component={InstitutionTimelineScreen}
        options={{
          title: t('navigation.fallTimeline'),
        }}
      />
      <Stack.Screen
        name='SelectElderlyScreen'
        component={SelectElderlyScreen}
        options={{
          title: t('navigation.selectPatient'),
        }}
      />
      <Stack.Screen
        name='AddMeasurement'
        component={AddMeasurementScreen}
        options={{
          title: t('measurements.addMeasurement'),
        }}
      />
      <Stack.Screen
        name='AddMedication'
        component={AddMedicationScreen}
        options={{
          title: t('navigation.addMedication'),
        }}
      />
      <Stack.Screen
        name='AddPathology'
        component={AddPathologyScreen}
        options={{
          title: t('navigation.addMedicalCondition'),
        }}
      />
      <Stack.Screen
        name='FallOccurrenceScreen'
        component={FallOccurrenceScreen}
        options={{ title: t('navigation.fallOccurrence') }}
      />
      <Stack.Screen
        name='SosOccurrenceScreen'
        component={SosOccurrenceScreen}
        options={{ title: t('sosOccurrence.title') }}
      />
      <Stack.Screen
        name='ElderlyDetails'
        component={ElderlyDetailsScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <Stack.Screen
        name='CaregiverDetails'
        component={CaregiverDetailsScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <Stack.Screen
        name='InstitutionAdminDetails'
        component={InstitutionAdminDetailsScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <Stack.Screen
        name='MedicationDetails'
        component={MedicationDetailsScreen}
        options={{ title: t('navigation.medicationDetails') }}
      />
      <Stack.Screen
        name='EditMedication'
        component={EditMedicationScreen}
        options={{ title: t('navigation.editMedication') }}
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
        name='EditPathology'
        component={EditPathologyScreen}
        options={{ title: t('navigation.editPathology') }}
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
      <Stack.Screen
        name='BathSchedule'
        component={BathScheduleScreen}
        options={{ title: t('bath.title') }}
      />
      <Stack.Screen
        name='StaffScheduleManagement'
        component={StaffScheduleManagementScreen}
        options={({ route }) => ({ title: route.params.staffName })}
      />
    </Stack.Navigator>
  );
};