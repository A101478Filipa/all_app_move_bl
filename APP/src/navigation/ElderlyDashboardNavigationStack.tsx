import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ElderlyDashboardScreen from "@screens/elderly/ElderlyDashboardScreen";
import MedicationDetailsScreen from "@src/screens/medication/MedicationDetailsScreen";
import MeasurementDetailsScreen from "@src/screens/measurements/MeasurementDetailsScreen";
import PathologyDetailsScreen from "@src/screens/pathology/PathologyDetailsScreen";
import { FallOccurrenceScreen } from "@src/screens/fallOccurrence/FallOccurrenceScreen";
import { ElderlyMeasurementsComponent, ElderlyMeasurementsArgs } from "@components/screens/ElderlyMeasurementsComponent";
import { NotificationCenterStack } from "@src/navigation/NotificationCenterStack";
import { getScreenOptionsWithNavigation } from "@src/utils/navigationHelper";
import { useTranslation } from "@src/localization/hooks/useTranslation";
import React from "react";
import { DashboardCustomHeader } from "@components/DashboardCustomHeader";
import { Color } from "@src/styles/colors";

export type ElderlyDashboardNavigationStackParamList = {
  ElderlyDashboardScreen: undefined;
  NotificationCenter: undefined;
  MedicationDetails: {
    medicationId: number;
  };
  MeasurementDetails: {
    measurementId: number;
  };
  PathologyDetails: {
    pathologyId: number;
  };
  FallOccurrenceScreen: {
    occurrenceId: number;
  };
  ElderlyMeasurements: ElderlyMeasurementsArgs;
};

const Stack = createNativeStackNavigator<ElderlyDashboardNavigationStackParamList>();

export const ElderlyDashboardNavigationStack = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={({ navigation }) => ({
      ...getScreenOptionsWithNavigation(navigation),
      headerLargeTitle: false,
      headerTransparent: false,
    })}>
      <Stack.Screen
        name='ElderlyDashboardScreen'
        component={ElderlyDashboardScreen}
        options={{
          headerTitle: () => <DashboardCustomHeader />,
          headerLeft: undefined,
          headerStyle: {
            backgroundColor: Color.Background.subtle,
          },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name='NotificationCenter'
        component={NotificationCenterStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='MedicationDetails'
        component={MedicationDetailsScreen}
        options={{ title: t('medication.title') }}
      />
      <Stack.Screen
        name='MeasurementDetails'
        component={MeasurementDetailsScreen}
        options={{ title: t('measurements.measurementDetails') }}
      />
      <Stack.Screen
        name='PathologyDetails'
        component={PathologyDetailsScreen}
        options={{ title: t('pathology.title') }}
      />
      <Stack.Screen
        name='FallOccurrenceScreen'
        component={FallOccurrenceScreen}
        options={{ title: t('fallOccurrence.title') }}
      />
      <Stack.Screen
        name='ElderlyMeasurements'
        component={ElderlyMeasurementsComponent}
        options={{ title: t('measurements.title') }}
      />
    </Stack.Navigator>
  );
};
