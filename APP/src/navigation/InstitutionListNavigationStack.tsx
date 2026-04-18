import { createNativeStackNavigator } from "@react-navigation/native-stack";
import InstitutionListScreen from "../screens/institution/InstitutionListScreen";
import InstitutionMembersScreen from "../screens/institution/InstitutionMembersScreen";
import AddInstitutionScreen from "../screens/institution/AddInstitutionScreen";
import GenerateInvitationScreen from "../screens/invitation/GenerateInvitationScreen";
import CaregiverDetailsScreen from "@screens/caregiver/CaregiverDetailsScreen";
import InstitutionAdminDetailsScreen from "@screens/admin/AdminDetailsScreen";
import ElderlyDetailsScreen from "@src/screens/elderly/ElderlyDetailsScreen";
import AddMedicationScreen from "@src/screens/medication/AddMedicationScreen";
import EditMedicationScreen from "@src/screens/medication/EditMedicationScreen";
import MedicationDetailsScreen from "@src/screens/medication/MedicationDetailsScreen";
import PathologyDetailsScreen from "@src/screens/pathology/PathologyDetailsScreen";
import EditPathologyScreen from "@src/screens/pathology/EditPathologyScreen";
import AddMeasurementScreen from "@src/screens/measurements/AddMeasurementScreen";
import AddPathologyScreen from "@src/screens/medication/AddPathologyScreen";
import { ElderlyMeasurementsComponent, ElderlyMeasurementsArgs } from "@components/screens/ElderlyMeasurementsComponent";
import ElderlyCalendarScreen from "@src/screens/elderly/ElderlyCalendarScreen";
import AddCalendarEventScreen from "@src/screens/elderly/AddCalendarEventScreen";
import ElderlyMedicationsListScreen from "@src/screens/elderly/ElderlyMedicationsListScreen";
import ElderlyPathologiesListScreen from "@src/screens/elderly/ElderlyPathologiesListScreen";
import ElderlyFallsListScreen from "@src/screens/elderly/ElderlyFallsListScreen";
import ElderlyMeasurementsListScreen from "@src/screens/elderly/ElderlyMeasurementsListScreen";
import ElderlySOSListScreen from "@src/screens/elderly/ElderlySOSListScreen";
import { SosOccurrenceScreen } from "@src/screens/sosOccurrence/SosOccurrenceScreen";
import { getScreenOptionsWithNavigation } from "@src/utils/navigationHelper";
import { Medication, Pathology, MeasurementType, UserRole, CalendarEvent } from "moveplus-shared";
import { useTranslation } from "@src/localization/hooks/useTranslation";

export type InstitutionListNavigationStackParamList = {
  InstitutionList: undefined;
  AddInstitution: undefined;
  GenerateInvitation: {
    institutionId: number;
    institutionName?: string;
    invitedRole: UserRole;
  };
  InstitutionMembers: {
    institutionId: number;
    institutionName: string;
  };
  CaregiverDetails: {
    name: string,
    caregiverId: number
  };
  InstitutionAdminDetails: {
    name: string,
    adminId: number
  };
  ElderlyDetails: {
    name: string,
    elderlyId: number
  };
  ElderlyMeasurements: ElderlyMeasurementsArgs;
  MedicationDetails: {
    medicationId: number;
  };
  PathologyDetails: {
    pathologyId: number;
  };
  EditPathology: {
    pathology: Pathology;
    elderlyId: number;
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
  SosOccurrenceScreen: {
    occurrenceId: number;
  };
};

const Stack = createNativeStackNavigator<InstitutionListNavigationStackParamList>();

export const InstitutionListNavigationStack = () => {
  const { t } = useTranslation();

  return(
    <Stack.Navigator screenOptions={({ navigation }) => getScreenOptionsWithNavigation(navigation)}>
      <Stack.Screen
        name="InstitutionList"
        component={InstitutionListScreen}
        options={{
          title: t('navigation.institutions'),
          headerLeft: undefined,
        }}
      />
      <Stack.Screen
        name="AddInstitution"
        component={AddInstitutionScreen}
        options={{ title: t('navigation.addInstitution') }}
      />
      <Stack.Screen
        name="GenerateInvitation"
        component={GenerateInvitationScreen}
        options={{ title: t('navigation.generateInvitation') }}
      />
      <Stack.Screen
        name="InstitutionMembers"
        component={InstitutionMembersScreen}
        options={({ route }) => ({ title: route.params.institutionName })}
      />
      <Stack.Screen
        name="ElderlyDetails"
        component={ElderlyDetailsScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <Stack.Screen
        name="ElderlyMeasurements"
        component={ElderlyMeasurementsComponent}
        options={{ title: t('navigation.measurements') }}
      />
      <Stack.Screen
        name="MedicationDetails"
        component={MedicationDetailsScreen}
        options={{ title: t('navigation.medicationDetails') }}
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
      <Stack.Screen
        name='SosOccurrenceScreen'
        component={SosOccurrenceScreen}
        options={{ title: t('sosOccurrence.title') }}
      />
    </Stack.Navigator>
  );
};
