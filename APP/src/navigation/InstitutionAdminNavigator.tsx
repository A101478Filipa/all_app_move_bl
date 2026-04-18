import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Color } from "@src/styles/colors";
import { MaterialIcons } from '@expo/vector-icons';
import { UserMenuNavigationStack, UserMenuStackParamList } from "@navigation/UserMenuNavigationStack";
import { Border } from "@src/styles/borders";
import { InstitutionMembersNavigationStack, InstitutionMembersNavigationStackParamList } from "./InstitutionMembersNavigationStack";
import { MaterialTabBarIcon, TabBarLabel } from "@src/utils/tabBarHelper";
import { NavigatorScreenParams } from "@react-navigation/core";
import { InstitutionDashboardNavigationStack, InstitutionDashboardNavigationStackParamList } from "./InstitutionDashboardNavigationStack";
import { View } from "react-native";
import { shadowStyles } from "@src/styles/shadow";
import { useTranslation } from '@src/localization/hooks/useTranslation';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

export type InstitutionAdminTabsParamList = {
  InstitutionDashboardTab: NavigatorScreenParams<InstitutionDashboardNavigationStackParamList>;
  InstitutionMembersTab: NavigatorScreenParams<InstitutionMembersNavigationStackParamList>;
  MenuTab: NavigatorScreenParams<UserMenuStackParamList>;
};

const Tab = createBottomTabNavigator<InstitutionAdminTabsParamList>();

export const InstitutionAdminNavigator = () => {
  const { t } = useTranslation();

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
          name='InstitutionDashboardTab'
          component={InstitutionDashboardNavigationStack}
          options={{
            title: t('navigation.institutionDashboard'),
            headerShown: false,
            tabBarIcon: ({ focused }) => <MaterialTabBarIcon iconName="dashboard" focused={focused} />,
            tabBarLabel: ({ focused }) => <TabBarLabel name={t('navigation.dashboard')} focused={focused}/>,
          }}
        />
        <Tab.Screen
          name='InstitutionMembersTab'
          component={InstitutionMembersNavigationStack}
          options={{
            title: t('navigation.institutionMembers'),
            headerShown: false,
            tabBarIcon: ({ focused }) => (<FontAwesome6 name="users" size={22} color={focused ? Color.Cyan.v400 : Color.gray1}/>),
            tabBarLabel: ({ focused }) => <TabBarLabel name={t('members.title')} focused={focused}/>,
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
    </View>
  )
};
