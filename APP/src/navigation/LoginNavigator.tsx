import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '@src/screens/authentication/WelcomeScreen';
import LoginScreen from '@src/screens/authentication/LoginScreen';
import RegisterScreen from "@src/screens/authentication/RegisterScreen";
import ClinicianRegistrationScreen from "@src/screens/authentication/ClinicianRegistrationScreen";
import { InvitationRegistrationScreen } from "@src/screens/authentication/InvitationRegistrationScreen";
import { CompleteProfileScreen } from "@src/screens/authentication/CompleteProfileScreen";
import ForgotPasswordScreen from "@src/screens/authentication/ForgotPassword";
import CreateNewPasswordScreen from "@src/screens/authentication/CreateNewPassword";
import ExternalAccessScreen from "@src/screens/authentication/ExternalAccessScreen";
import ExternalElderlyProfileScreen from "@src/screens/authentication/ExternalElderlyProfileScreen";
import { ExternalProfileResponse } from '@src/api/endpoints/externalAccess';
import { UserRole } from 'moveplus-shared';
import ElderlyMeasurementsListScreen from "@src/screens/elderly/ElderlyMeasurementsListScreen";
import ElderlyMedicationsListScreen from "@src/screens/elderly/ElderlyMedicationsListScreen";
import ElderlyPathologiesListScreen from "@src/screens/elderly/ElderlyPathologiesListScreen";
import ElderlyFallsListScreen from "@src/screens/elderly/ElderlyFallsListScreen";
import ElderlySOSListScreen from "@src/screens/elderly/ElderlySOSListScreen";
import ElderlyWoundTrackingScreen from "@src/screens/elderly/ElderlyWoundTrackingScreen";
import MedicationDetailsScreen from "@src/screens/medication/MedicationDetailsScreen";
import { useTranslation } from '@src/localization/hooks/useTranslation';


export type LoginStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ClinicianRegistration: undefined;
  InvitationRegistration: undefined;
  ForgotPassword: undefined;
  CreateNewPassword: { email: string; otp?: string };
  CompleteProfile: {
    userId: number;
    role: UserRole;
    institutionId?: number;
    email: string;
    username: string;
    password: string;
  };
  ExternalAccess: undefined;
  ExternalElderlyProfile: { profile: ExternalProfileResponse; token: string };
  ElderlyMeasurementsList: undefined;
  ElderlyMedicationsList: { elderlyId: number, initialData?: any, isExternalToken?: boolean };
  MedicationDetails: { medicationId: number };
  ElderlyPathologiesList: undefined;
  ElderlyFallsList: undefined;
  ElderlySOSList: undefined;
  ElderlyWoundTrackingScreen: undefined;
};

const Stack = createNativeStackNavigator<LoginStackParamList>();

export const LoginNavigator: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Stack.Navigator>
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ClinicianRegistration" component={ClinicianRegistrationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="InvitationRegistration" component={InvitationRegistrationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateNewPassword" component={CreateNewPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ExternalAccess" component={ExternalAccessScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ExternalElderlyProfile" component={ExternalElderlyProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ElderlyMeasurementsList" component={ElderlyMeasurementsListScreen} />
      <Stack.Screen name="MedicationDetails" component={MedicationDetailsScreen} options={{ title: t('medication.details') }} />
      <Stack.Screen name="ElderlyMedicationsList" component={ElderlyMedicationsListScreen} />
      <Stack.Screen name="ElderlyPathologiesList" component={ElderlyPathologiesListScreen} />
      <Stack.Screen name="ElderlyFallsList" component={ElderlyFallsListScreen} />
      <Stack.Screen name="ElderlySOSList" component={ElderlySOSListScreen} />
      <Stack.Screen name="ElderlyWoundTrackingScreen" component={ElderlyWoundTrackingScreen} />
    </Stack.Navigator>
  );
};

export default LoginNavigator;
