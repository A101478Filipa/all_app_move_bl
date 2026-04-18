import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { CaregiverRootNavigator, CaregiverTabsParamList } from '@navigation/CaregiverRootNavigator';
import LoginNavigator, { LoginStackParamList } from '@src/navigation/LoginNavigator';
import { useAuthStore } from '@src/stores/authStore';
import { UserRole } from 'moveplus-shared';
import { navigationRef } from '@src/services/NavigationService';
import { Color } from '@src/styles/colors';
import { ElderlyRootNavigator } from './ElderlyRootNavigator';
import { InstitutionAdminNavigator, InstitutionAdminTabsParamList } from './InstitutionAdminNavigator';
import { ProgrammerRootNavigator, ProgrammerTabsParamList } from './ProgrammerRootNavigator';
import { ClinicianRootNavigator, ClinicianTabsParamList } from './ClinicianRootNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export type RootStackParamList = {
  LoginStack: NavigatorScreenParams<LoginStackParamList>;
  CaregiverTabs: NavigatorScreenParams<CaregiverTabsParamList>;
  InstitutionAdminTabs: NavigatorScreenParams<InstitutionAdminTabsParamList>;
  ProgrammerTabs: NavigatorScreenParams<ProgrammerTabsParamList>;
  ClinicianTabs: NavigatorScreenParams<ClinicianTabsParamList>;
};

const chooseNavigator = (role?: UserRole) => {
  if (!role) {
    return <LoginNavigator />;
  }

  switch (role) {
    case UserRole.CAREGIVER:
      return <CaregiverRootNavigator />;

    case UserRole.ELDERLY:
      return <ElderlyRootNavigator />;

    case UserRole.INSTITUTION_ADMIN:
      return <InstitutionAdminNavigator />;

    case UserRole.CLINICIAN:
      return <ClinicianRootNavigator />;

    case UserRole.PROGRAMMER:
      return <ProgrammerRootNavigator/>;

    case UserRole.UNKNOWN:
    default:
      return <LoginNavigator />;
  }
};

const AppNavigator = () => {
  const { user, loading } = useAuthStore();
  const role = user?.user.role;

  /*
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Color.primary} />
      </View>
    );
  }
    */

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        {chooseNavigator(role)}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Color.Background.white,
  },
});

export default AppNavigator;