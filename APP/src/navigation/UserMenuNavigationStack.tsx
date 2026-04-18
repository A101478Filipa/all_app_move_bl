import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserMenuScreen from '@screens/user/UserMenuScreen';
import UserSettingsScreen from '@screens/user/UserSettingsScreen';
import InstitutionTimelineScreen from '@screens/institution/InstitutionTimelineScreen';
import InstitutionDetailsScreen from '@screens/institution/InstitutionDetailsScreen';
import { FallOccurrenceScreen } from "@src/screens/fallOccurrence/FallOccurrenceScreen";
import ElderlyDetailsScreen from "@src/screens/elderly/ElderlyDetailsScreen";
import CaregiverDetailsScreen from "@screens/caregiver/CaregiverDetailsScreen";
import InstitutionAdminDetailsScreen from "@screens/admin/AdminDetailsScreen";
import MedicationDetailsScreen from "@src/screens/medication/MedicationDetailsScreen";
import MeasurementDetailsScreen from "@src/screens/measurements/MeasurementDetailsScreen";
import PathologyDetailsScreen from "@src/screens/pathology/PathologyDetailsScreen";
import DataAccessRequestsScreen from "@src/screens/dataAccessRequest/DataAccessRequestsScreen";
import InstitutionInvitationsScreen from "@src/screens/invitation/InstitutionInvitationsScreen";
import { NotificationCenterStack } from "@src/navigation/NotificationCenterStack";
import { getScreenOptionsWithNavigation } from "@src/utils/navigationHelper";
import { useTranslation } from 'react-i18next';

export type UserMenuStackParamList = {
  UserMenu: undefined;
  UserSettings: undefined;
  NotificationCenter: undefined;
  InstitutionTimeline: undefined;
  InstitutionDetails: undefined;
  UserAdditionalInfo: undefined;
  DataAccessRequests: {
    filter: 'APPROVED' | 'PENDING';
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
  MeasurementDetails: {
    measurementId: number;
  };
  PathologyDetails: {
    pathologyId: number;
  };
  InstitutionInvitations: {
    institutionId: number;
  };
};

const Stack = createNativeStackNavigator<UserMenuStackParamList>();

export const UserMenuNavigationStack = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => getScreenOptionsWithNavigation(navigation)}
    >
      <Stack.Screen
        name="UserMenu"
        component={UserMenuScreen}
        options={{
          title: t('menu.title'),
          headerLeft: undefined,
        }}
      />

      <Stack.Screen
        name="UserSettings"
        component={UserSettingsScreen}
        options={{
          title: t('settings.title'),
        }}
      />
      <Stack.Screen
        name="NotificationCenter"
        component={NotificationCenterStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InstitutionTimeline"
        component={InstitutionTimelineScreen}
        options={{
          title: t('menu.institutionTimeline'),
        }}
      />
      <Stack.Screen
        name="InstitutionDetails"
        component={InstitutionDetailsScreen}
        options={{
          title: t('menu.institutionDetails'),
        }}
      />
      <Stack.Screen
        name="DataAccessRequests"
        component={DataAccessRequestsScreen}
        options={({ route }) => ({
          title: route.params.filter === 'APPROVED'
            ? t('dataAccessRequest.approvedRequests')
            : t('dataAccessRequest.pendingRequests'),
        })}
      />
      <Stack.Screen
        name="FallOccurrenceScreen"
        component={FallOccurrenceScreen}
        options={{
          title: t('navigation.fallOccurrenceDetails'),
        }}
      />
      <Stack.Screen
        name="ElderlyDetails"
        component={ElderlyDetailsScreen}
        options={({ route }) => ({
          title: route.params.name,
        })}
      />
      <Stack.Screen
        name="CaregiverDetails"
        component={CaregiverDetailsScreen}
        options={({ route }) => ({
          title: route.params.name,
        })}
      />
      <Stack.Screen
        name="InstitutionAdminDetails"
        component={InstitutionAdminDetailsScreen}
        options={({ route }) => ({
          title: route.params.name,
        })}
      />
      <Stack.Screen
        name="MedicationDetails"
        component={MedicationDetailsScreen}
        options={{
          title: t('navigation.medicationDetails'),
        }}
      />
      <Stack.Screen
        name="MeasurementDetails"
        component={MeasurementDetailsScreen}
        options={{
          title: t('navigation.measurementDetails'),
        }}
      />
      <Stack.Screen
        name="PathologyDetails"
        component={PathologyDetailsScreen}
        options={{
          title: t('navigation.pathologyDetails'),
        }}
      />
      <Stack.Screen
        name="InstitutionInvitations"
        component={InstitutionInvitationsScreen}
        options={{
          title: t('invitation.invitationsTitle'),
        }}
      />
    </Stack.Navigator>
  );
};
