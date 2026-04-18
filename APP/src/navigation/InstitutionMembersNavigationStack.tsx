import { createNativeStackNavigator } from "@react-navigation/native-stack";
import InstitutionMembersScreen from "../screens/institution/InstitutionMembersScreen";
import GenerateInvitationScreen from "../screens/invitation/GenerateInvitationScreen";
import CaregiverDetailsScreen from "@screens/caregiver/CaregiverDetailsScreen";
import ClinicianDetailsScreen from "@screens/clinician/ClinicianDetailsScreen";
import InstitutionAdminDetailsScreen from "@screens/admin/AdminDetailsScreen";
import ElderlyDetailsScreen from "@src/screens/elderly/ElderlyDetailsScreen";
import AddMedicationScreen from "@src/screens/medication/AddMedicationScreen";
import EditMedicationScreen from "@src/screens/medication/EditMedicationScreen";
import MedicationDetailsScreen from "@src/screens/medication/MedicationDetailsScreen";
import MeasurementDetailsScreen from "@src/screens/measurements/MeasurementDetailsScreen";
import PathologyDetailsScreen from "@src/screens/pathology/PathologyDetailsScreen";
import EditPathologyScreen from "@src/screens/pathology/EditPathologyScreen";
import EditElderlyScreen from '@screens/elderly/EditElderlyScreen';
import AddMeasurementScreen from "@src/screens/measurements/AddMeasurementScreen";
import AddPathologyScreen from "@src/screens/medication/AddPathologyScreen";
import RegisterElderlyScreen from "@src/screens/elderly/RegisterElderlyScreen";
import RegisterCaregiverScreen from "@src/screens/caregiver/RegisterCaregiverScreen";
import InstitutionInvitationsScreen from "@src/screens/invitation/InstitutionInvitationsScreen";
import { ElderlyMeasurementsComponent, ElderlyMeasurementsArgs } from "@components/screens/ElderlyMeasurementsComponent";
import ElderlyCalendarScreen from "@src/screens/elderly/ElderlyCalendarScreen";
import AddCalendarEventScreen from "@src/screens/elderly/AddCalendarEventScreen";
import ProfessionalCalendarScreen from "@src/screens/professional/ProfessionalCalendarScreen";
import ElderlyMedicationsListScreen from "@src/screens/elderly/ElderlyMedicationsListScreen";
import ElderlyPathologiesListScreen from "@src/screens/elderly/ElderlyPathologiesListScreen";
import ElderlyFallsListScreen from "@src/screens/elderly/ElderlyFallsListScreen";
import ElderlyMeasurementsListScreen from "@src/screens/elderly/ElderlyMeasurementsListScreen";
import ElderlySOSListScreen from "@src/screens/elderly/ElderlySOSListScreen";
import { getScreenOptionsWithNavigation } from "@src/utils/navigationHelper";
import { Medication, FallOccurrence, Pathology, MeasurementType, UserRole, SosOccurrence, CalendarEvent } from "moveplus-shared";
import { FallOccurrenceScreen } from "@src/screens/fallOccurrence/FallOccurrenceScreen";
import { SosOccurrenceScreen } from "@src/screens/sosOccurrence/SosOccurrenceScreen";
import { useTranslation } from '@src/localization/hooks/useTranslation';

export type InstitutionMembersNavigationStackParamList = {
  InstitutionMembers: {
    institutionId?: number;
    institutionName?: string;
  };
  GenerateInvitation: {
    institutionId: number;
    institutionName?: string;
    invitedRole: UserRole;
  };
  CaregiverDetails: {
    name: string,
    caregiverId: number
  };
  ClinicianDetails: {
    name: string,
    clinicianId: number
  };
  InstitutionAdminDetails: {
    name: string,
    adminId: number
  };
  ElderlyDetails: {
    name: string,
    elderlyId: number
  };
  EditElderly: {
    elderlyId: number;
    name: string;
  };
  ElderlyMeasurements: ElderlyMeasurementsArgs;
  MedicationDetails: {
    medicationId: number;
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
  FallOccurrenceScreen: {
    occurrenceId: number;
  };
  SosOccurrenceScreen: {
    occurrenceId: number;
  };
  EditMedication: {
    medication: Medication;
    elderlyId: number;
  };
  AddMedication: {
    elderlyId: number;
  };
  AddMeasurement: {
    elderlyId: number;
    prefillType?: MeasurementType;
  };
  AddPathology: {
    elderlyId: number;
  };
  RegisterElderly: {
    institutionId?: number;
  };
  RegisterCaregiver: {
    institutionId?: number;
  };
  InstitutionInvitations: {
    institutionId: number;
  };
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
};

const Stack = createNativeStackNavigator<InstitutionMembersNavigationStackParamList>();

export const InstitutionMembersNavigationStack = () => {
  const { t } = useTranslation();
  return(
    <Stack.Navigator screenOptions={({ navigation }) => getScreenOptionsWithNavigation(navigation)}>
      <Stack.Screen
        name="InstitutionMembers"
        component={InstitutionMembersScreen}
        options={({ route }) => ({
          title: route.params?.institutionName || t('members.title'),
          headerLeft: undefined,
        })}
      />
      <Stack.Screen
        name="GenerateInvitation"
        component={GenerateInvitationScreen}
        options={{ title: t('navigation.generateInvitation') }}
      />
      <Stack.Screen
        name="ElderlyDetails"
        component={ElderlyDetailsScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <Stack.Screen
        name="EditElderly"
        component={EditElderlyScreen}
        options={{ title: t('navigation.editElderly') }}
      />
      <Stack.Screen
        name="ElderlyMeasurements"
        component={ElderlyMeasurementsComponent}
        options={{ title: t('measurements.title') }}
      />
      <Stack.Screen
        name="MedicationDetails"
        component={MedicationDetailsScreen}
        options={{ title: t('medication.title') }}
      />
      <Stack.Screen
        name="MeasurementDetails"
        component={MeasurementDetailsScreen}
        options={{ title: t('measurements.title') }}
      />
      <Stack.Screen
        name="PathologyDetails"
        component={PathologyDetailsScreen}
        options={{ title: t('pathology.title') }}
      />
      <Stack.Screen
        name="EditPathology"
        component={EditPathologyScreen}
        options={{ title: t('navigation.editPathology') }}
      />
      <Stack.Screen
        name="FallOccurrenceScreen"
        component={FallOccurrenceScreen}
        options={{ title: t('fallOccurrence.title') }}
      />
      <Stack.Screen
        name="SosOccurrenceScreen"
        component={SosOccurrenceScreen}
        options={{ title: t('sosOccurrence.title') }}
      />
      <Stack.Screen
        name="EditMedication"
        component={EditMedicationScreen}
        options={{ title: t('navigation.editMedication') }}
      />
      <Stack.Screen
        name="CaregiverDetails"
        component={CaregiverDetailsScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <Stack.Screen
        name="ClinicianDetails"
        component={ClinicianDetailsScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <Stack.Screen
        name='ProfessionalCalendar'
        component={ProfessionalCalendarScreen}
        options={({ route }) => ({ title: route.params?.professionalName ? `${route.params.professionalName} · ${t('navigation.calendar')}` : t('navigation.calendar') })}
      />
      <Stack.Screen
        name="InstitutionAdminDetails"
        component={InstitutionAdminDetailsScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <Stack.Screen
        name="AddMedication"
        component={AddMedicationScreen}
        options={{ title: t('navigation.addMedication') }}
      />
      <Stack.Screen
        name="AddMeasurement"
        component={AddMeasurementScreen}
        options={{ title: t('navigation.addMeasurement') }}
      />
      <Stack.Screen
        name="AddPathology"
        component={AddPathologyScreen}
        options={{ title: t('navigation.addMedicalCondition') }}
      />
      <Stack.Screen
        name="RegisterElderly"
        component={RegisterElderlyScreen}
        options={{ title: t('navigation.registerElderly') }}
      />
      <Stack.Screen
        name="RegisterCaregiver"
        component={RegisterCaregiverScreen}
        options={{ title: t('navigation.registerCaregiver') }}
      />
      <Stack.Screen
        name="InstitutionInvitations"
        component={InstitutionInvitationsScreen}
        options={{ title: t('invitation.invitationsTitle') }}
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