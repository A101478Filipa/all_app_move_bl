import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Color } from "@src/styles/colors";
import { MaterialIcons } from '@expo/vector-icons';
import { UserMenuNavigationStack, UserMenuStackParamList } from "@navigation/UserMenuNavigationStack";
import { Border } from "@styles/borders";
import { InstitutionMembersNavigationStack, InstitutionMembersNavigationStackParamList } from "@navigation/InstitutionMembersNavigationStack";
import { MaterialTabBarIcon, TabBarLabel } from "@utils/tabBarHelper";
import { NavigatorScreenParams } from "@react-navigation/core";
import { InstitutionDashboardNavigationStack, InstitutionDashboardNavigationStackParamList } from "@navigation/InstitutionDashboardNavigationStack";
import { View } from "react-native";
import { shadowStyles } from "@styles/shadow";
import { useTranslation } from "@src/localization/hooks/useTranslation";

export type CaregiverTabsParamList = {
  InstitutionDashboardTab: NavigatorScreenParams<InstitutionDashboardNavigationStackParamList>;
  InstitutionMembersTab: NavigatorScreenParams<InstitutionMembersNavigationStackParamList>;
  MenuTab: NavigatorScreenParams<UserMenuStackParamList>;
};

const Tab = createBottomTabNavigator<CaregiverTabsParamList>();

export const CaregiverRootNavigator = () => {
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: Color.Background.subtle, pointerEvents: 'box-none' }}>
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
          name='InstitutionDashboardTab'
          component={InstitutionDashboardNavigationStack}
          options={{
            title: t('dashboard.title'),
            headerShown: false,
            tabBarIcon: ({ focused }) => <MaterialTabBarIcon iconName="dashboard" focused={focused} />,
            tabBarLabel: ({ focused }) => <TabBarLabel name={t('dashboard.title')} focused={focused} />,
          }}
        />
        <Tab.Screen
          name='InstitutionMembersTab'
          component={InstitutionMembersNavigationStack}
          options={{
            title: t('members.title'),
            headerShown: false,
            tabBarIcon: ({ focused }) => <MaterialTabBarIcon iconName="group" focused={focused} />,
            tabBarLabel: ({ focused }) => <TabBarLabel name={t('members.title')} focused={focused} />,
          }}
        />
        <Tab.Screen
          name='MenuTab'
          component={UserMenuNavigationStack}
          options={{
            title: t('menu.title'),
            headerShown: false,
            tabBarIcon: ({ focused }) => <MaterialTabBarIcon iconName="person" focused={focused} />,
            tabBarLabel: ({ focused, children }) => <TabBarLabel name={children} focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </View>
  )
};