// Navigation Types
export type RootStackParamList = {
  LoginStack: any;
  CaregiverTabs: any;
  ElderlyTabs: any;
  InstitutionAdminTabs: any;
  ProgrammerTabs: any;
};

export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: any;
  route: { params: RootStackParamList[T] };
};
