import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NotificationCenterScreen } from '@src/screens/NotificationCenterScreen';
import { FallOccurrenceScreen } from '@src/screens/fallOccurrence/FallOccurrenceScreen';
import DataAccessRequestsScreen from '@src/screens/dataAccessRequest/DataAccessRequestsScreen';
import { getScreenOptionsWithNavigation } from '@src/utils/navigationHelper';
import { useTranslation } from '@src/localization/hooks/useTranslation';

export type NotificationCenterStackParamList = {
  NotificationCenterScreen: undefined;
  FallOccurrenceScreen: {
    occurrenceId: number;
  };
  DataAccessRequests: {
    filter: 'APPROVED' | 'PENDING';
  };
};

const Stack = createNativeStackNavigator<NotificationCenterStackParamList>();

export const NotificationCenterStack = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => getScreenOptionsWithNavigation(navigation)}
    >
      <Stack.Screen
        name="NotificationCenterScreen"
        component={NotificationCenterScreen}
        options={{
          title: '',
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
        name="DataAccessRequests"
        component={DataAccessRequestsScreen}
        options={({ route }) => ({
          title: route.params.filter === 'APPROVED'
            ? t('dataAccessRequest.approvedRequests')
            : t('dataAccessRequest.pendingRequests'),
        })}
      />
    </Stack.Navigator>
  );
};
