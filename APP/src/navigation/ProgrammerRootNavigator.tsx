import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Color } from "@src/styles/colors";
import ProgrammerHomepageScreen from "../screens/programmer/ProgrammerHomepageScreen";
import { MaterialIcons } from '@expo/vector-icons';
import { UserMenuNavigationStack, UserMenuStackParamList } from "@navigation/UserMenuNavigationStack";
import { Border } from "@src/styles/borders";
import { InstitutionListNavigationStack, InstitutionListNavigationStackParamList } from "./InstitutionListNavigationStack";
import { MaterialTabBarIcon, TabBarLabel } from "@src/utils/tabBarHelper";
import { NavigatorScreenParams } from "@react-navigation/core";
import { View } from "react-native";
import { shadowStyles } from "@src/styles/shadow";
import { useTranslation } from "@src/localization/hooks/useTranslation";

export type ProgrammerTabsParamList = {
  HomepageTab: undefined;
  InstitutionListTab: NavigatorScreenParams<InstitutionListNavigationStackParamList>;
  MenuTab: NavigatorScreenParams<UserMenuStackParamList>;
};

const Tab = createBottomTabNavigator<ProgrammerTabsParamList>();

export const ProgrammerRootNavigator = () => {
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
          name='HomepageTab'
          component={ProgrammerHomepageScreen}
          options={{
            title: t('navigation.profile'),
            tabBarIcon: ({ focused }) => <MaterialTabBarIcon iconName="home" focused={focused} />,
            tabBarLabel: ({ focused, children }) => <TabBarLabel name={children} focused={focused}/>,
          }}
        />
        <Tab.Screen
          name='InstitutionListTab'
          component={InstitutionListNavigationStack}
          options={{
            title: t('navigation.institutions'),
            headerShown: false,
            tabBarIcon: ({ focused }) => <MaterialTabBarIcon iconName="menu" focused={focused} />,
            tabBarLabel: ({ focused }) => <TabBarLabel name={t('navigation.institutions')} focused={focused}/>,
          }}
        />
        <Tab.Screen
          name='MenuTab'
          component={UserMenuNavigationStack}
          options={{
            title: t('navigation.menu'),
            headerShown: false,
            tabBarIcon: ({ focused }) => <MaterialTabBarIcon iconName="business" focused={focused} />,
            tabBarLabel: ({ focused, children }) => <TabBarLabel name={children} focused={focused}/>,
          }}
          />
      </Tab.Navigator>
    </View>
  )
};
