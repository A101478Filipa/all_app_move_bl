import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Measurement, MeasurementType, UserRole } from 'moveplus-shared';
import { MeasurementOverviewComponent } from '@components/MeasurementOverviewComponent';
import { useElderlyDetailsStore } from '@src/stores/elderlyDetailsStore';
import { useAuthStore } from '@src/stores/authStore';
import { groupMeasurements } from '@src/utils/chartsHelper';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import ScreenState from '@src/constants/screenState';

type Props = NativeStackScreenProps<any, 'ElderlyMeasurementsList'>;

const ElderlyMeasurementsListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { elderlyId } = route.params;
  const { t } = useTranslation();
  const { elderly, state, refreshElderly } = useElderlyDetailsStore();
  const { user } = useAuthStore();

  const canAdd = user && [
    UserRole.INSTITUTION_ADMIN, UserRole.CAREGIVER, UserRole.CLINICIAN, UserRole.PROGRAMMER,
  ].includes(user.user.role as UserRole);

  useEffect(() => {
    if (canAdd) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.push('AddMeasurement', { elderlyId })}
            style={{ padding: Spacing.xs_4, marginRight: Spacing.xs_4 }}
          >
            <MaterialIcons name="add" size={24} color={Color.primary} />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, canAdd, elderlyId]);

  const measurements: Measurement[] = elderly?.measurements ?? [];
  const grouped = groupMeasurements(measurements);
  const types = Object.keys(grouped) as MeasurementType[];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={state === ScreenState.REFRESHING}
            onRefresh={() => refreshElderly(elderlyId)}
          />
        }
      >
        {types.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="favorite" size={48} color={Color.Gray.v300} />
            <Text style={styles.emptyText}>{t('measurements.noMeasurements')}</Text>
          </View>
        ) : (
          types.map(type => (
            <MeasurementOverviewComponent
              key={type}
              elderlyId={elderlyId}
              measurementType={type}
              measurements={grouped[type]!}
              navigation={navigation}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default ElderlyMeasurementsListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  content: {
    ...spacingStyles.screenScrollContainer,
    gap: Spacing.sm_8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl_32,
    gap: Spacing.sm_8,
  },
  emptyText: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
});
