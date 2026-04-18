import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '@src/screens/authentication/WelcomeScreen';
import LoginScreen from '@src/screens/authentication/LoginScreen';
import RegisterScreen from "@src/screens/authentication/RegisterScreen";
import ClinicianRegistrationScreen from "@src/screens/authentication/ClinicianRegistrationScreen";
import { InvitationRegistrationScreen } from "@src/screens/authentication/InvitationRegistrationScreen";
import { CompleteProfileScreen } from "@src/screens/authentication/CompleteProfileScreen";
import { UserRole } from 'moveplus-shared';

export type LoginStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ClinicianRegistration: undefined;
  InvitationRegistration: undefined;
  CompleteProfile: {
    userId: number;
    role: UserRole;
    institutionId?: number;
    email: string;
    username: string;
    password: string;
  };
};

const Stack = createNativeStackNavigator<LoginStackParamList>();

export const LoginNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ClinicianRegistration" component={ClinicianRegistrationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="InvitationRegistration" component={InvitationRegistrationScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default LoginNavigator;
