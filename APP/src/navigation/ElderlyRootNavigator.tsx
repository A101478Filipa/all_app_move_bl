import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigatorScreenParams } from "@react-navigation/core";
import { Color } from "@src/styles/colors";
import { MaterialIcons } from '@expo/vector-icons';
import { UserMenuNavigationStack, UserMenuStackParamList } from "@navigation/UserMenuNavigationStack";
import { ElderlyProfileStackNavigator, ElderlyProfileStackParamList } from "@navigation/ElderlyProfileStackNavigator";
import { ElderlyDashboardNavigationStack, ElderlyDashboardNavigationStackParamList } from "@navigation/ElderlyDashboardNavigationStack";
import { Border } from "@src/styles/borders";
import { MaterialTabBarIcon, TabBarLabel } from "@src/utils/tabBarHelper";
import { View } from "react-native";
import { shadowStyles } from "@src/styles/shadow";
import React, { useCallback } from 'react';
import { useIncidentConfirmationStore } from '@src/stores/incidentConfirmationStore';
import IncidentConfirmationModal from '@components/IncidentConfirmationModal';
import { confirmAndSendIncident, cancelIncident } from '@src/services/accelerometerService';
import Toast from 'react-native-toast-message';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export type ElderlyTabsParamList = {
  DashboardTab: NavigatorScreenParams<ElderlyDashboardNavigationStackParamList>;
  ProfileTab: NavigatorScreenParams<ElderlyProfileStackParamList>;
  MenuTab: NavigatorScreenParams<UserMenuStackParamList>;
};

const Tab = createBottomTabNavigator<ElderlyTabsParamList>();

export const ElderlyRootNavigator = () => {
  const { t } = useTranslation();
  const { isModalVisible, pendingIncident } = useIncidentConfirmationStore();

  const handleIncidentConfirm = useCallback(async () => {
    await confirmAndSendIncident();
    Toast.show({
      type: 'success',
      text1: t('incidentConfirmation.alertSent'),
      text2: t('incidentConfirmation.caregiversNotified'),
    });
  }, [t]);

  const handleIncidentCancel = useCallback(() => {
    cancelIncident();
    Toast.show({
      type: 'info',
      text1: t('incidentConfirmation.alertCancelled'),
      text2: t('incidentConfirmation.gladYouAreOk'),
    });
  }, [t]);

  return(
    <View style={{ flex: 1, backgroundColor: Color.Background.subtle }}>
      <Tab.Navigator
        screenOptions={{
          headerShadowVisible: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: Color.white,
            borderTopEndRadius: Border.lg_16,
            borderTopStartRadius: Border.lg_16,
            ...shadowStyles.tabBarShadow,
          },
        }}
      >
        <Tab.Screen
          name='DashboardTab'
          component={ElderlyDashboardNavigationStack}
          options={{
            title: t('navigation.dashboard'),
            headerShown: false,
            tabBarIcon: ({ focused }) => <MaterialTabBarIcon iconName="dashboard" focused={focused} />,
            tabBarLabel: ({ focused, children }) => <TabBarLabel name={children} focused={focused}/>,
          }}
        />
        <Tab.Screen
          name='ProfileTab'
          component={ElderlyProfileStackNavigator}
          options={{
            title: t('navigation.profile'),
            headerShown: false,
            tabBarIcon: ({ focused }) => (<FontAwesome name="heartbeat" size={22} color={focused ? Color.Cyan.v400 : Color.gray1}/>),
            tabBarLabel: ({ focused, children }) => <TabBarLabel name={children} focused={focused}/>,
          }}
        />
        <Tab.Screen
          name='MenuTab'
          component={UserMenuNavigationStack}
          options={{
            title: t('navigation.menu'),
            headerShown: false,
            tabBarIcon: ({ focused }) => <MaterialTabBarIcon iconName="person" focused={focused} />,
            tabBarLabel: ({ focused, children }) => <TabBarLabel name={children} focused={focused}/>,
          }}
        />
      </Tab.Navigator>

      {/* Global Incident Confirmation Modal - Shows on any screen */}
      <IncidentConfirmationModal
        visible={isModalVisible}
        incidentType={pendingIncident?.type || 'fall'}
        onConfirm={handleIncidentConfirm}
        onCancel={handleIncidentCancel}
      />
    </View>
  )
};
