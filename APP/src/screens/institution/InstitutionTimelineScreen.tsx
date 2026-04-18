import React from 'react';
import { View, Text, StyleSheet, RefreshControl, SectionList, SafeAreaView } from 'react-native';
import { TimelineActivity, TimelineActivityType } from 'moveplus-shared';
import { ActivityIndicatorOverlay } from '@components/ActivityIndicatorOverlay';
import { Color } from '@src/styles/colors';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { FontFamily, FontSize } from '@src/styles/fonts';
import ScreenState from '@src/constants/screenState';
import { formatFriendlyDate } from '@src/utils/Date';
import { shadowStyles } from '@src/styles/shadow';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { InstitutionDashboardNavigationStackParamList } from '../../navigation/InstitutionDashboardNavigationStack';
import { UserMenuStackParamList } from '@navigation/UserMenuNavigationStack';
import { useInstitutionTimelineStore } from '@src/stores';
import { useFocusEffect } from '@react-navigation/core';
import { useCallback } from 'react';
import TimelineActivityCard from '@src/components/TimelineActivityCard';
import { fallOccurrenceApi } from '@src/api/endpoints/fallOccurrences';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import { useTranslation } from '@src/localization/hooks/useTranslation';

// MARK: Types
type Props = NativeStackScreenProps<InstitutionDashboardNavigationStackParamList, 'InstitutionDashboardScreen'> |
             NativeStackScreenProps<UserMenuStackParamList, 'InstitutionTimeline'>;

type NavigationProp = {
  push: (screen: string, params?: any) => void;
};

// MARK: Screen
const InstitutionTimelineScreen: React.FC<Props> = ({ navigation }) => {
  const { sections, fetch, refresh, state } = useInstitutionTimelineStore();
  const { handleError } = useErrorHandler();
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [])
  );

  const onPress = useCallback(
    async (item: TimelineActivity) => {
      try {
        const nav = navigation as any;

        switch (item.type) {
          case TimelineActivityType.FALL_OCCURRENCE:
            if (item.relatedId) {
              nav.push('FallOccurrenceScreen', { occurrenceId: item.relatedId });
            }
            break;

          case TimelineActivityType.MEASUREMENT_ADDED:
            if (item.relatedId) {
              nav.push('MeasurementDetails', {
                measurementId: item.relatedId
              });
            } else if (item.elderlyId) {
              nav.push('ElderlyDetails', {
                elderlyId: item.elderlyId,
                name: item.elderly?.name || 'Patient Details'
              });
            }
            break;

          case TimelineActivityType.MEDICATION_ADDED:
          case TimelineActivityType.MEDICATION_UPDATED:
            if (item.relatedId) {
              nav.push('MedicationDetails', {
                medicationId: item.relatedId
              });
            } else if (item.elderlyId) {
              nav.push('ElderlyDetails', {
                elderlyId: item.elderlyId,
                name: item.elderly?.name || 'Patient Details'
              });
            }
            break;

          case TimelineActivityType.PATHOLOGY_ADDED:
            if (item.relatedId) {
              nav.push('PathologyDetails', {
                pathologyId: item.relatedId
              });
            } else if (item.elderlyId) {
              nav.push('ElderlyDetails', {
                elderlyId: item.elderlyId,
                name: item.elderly?.name || 'Patient Details'
              });
            }
            break;

          case TimelineActivityType.USER_ADDED:
          case TimelineActivityType.USER_UPDATED:
            if (item.relatedId && item.user?.role) {
              const userRole = item.user.role;
              if (userRole === 'ELDERLY' && item.relatedId) {
                nav.push('ElderlyDetails', {
                  elderlyId: item.relatedId,
                  name: item.user.name || 'Patient Details'
                });
              } else if (userRole === 'CAREGIVER' && item.relatedId) {
                nav.push('CaregiverDetails', {
                  caregiverId: item.relatedId,
                  name: item.user.name || 'Caregiver Details'
                });
              } else if (userRole === 'INSTITUTION_ADMIN' && item.relatedId) {
                nav.push('InstitutionAdminDetails', {
                  adminId: item.relatedId,
                  name: item.user.name || 'Admin Details'
                });
              }
            }
            break;

          case TimelineActivityType.SOS_OCCURRENCE:
            if (item.relatedId) {
              nav.push('SosOccurrenceScreen', { occurrenceId: item.relatedId });
            }
            break;

          case TimelineActivityType.CALENDAR_EVENT_ADDED:
            if (item.elderlyId) {
              nav.push('ElderlyCalendar', {
                elderlyId: item.elderlyId,
                elderlyName: item.elderly?.name,
              });
            }
            break;

          default:
            console.log('No handler implemented for timeline activity type:', item.type);
            break;
        }
      } catch (error) {
        console.error('Error handling timeline activity press:', error);
        handleError(error, 'Unable to navigate to details. Please try again.');
      }
    }, [navigation, handleError]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string } }) => (
      <Text style={styles.sectionHeader}>
        {formatFriendlyDate(section.title, t)}
      </Text>
    ), [t]
  );

  const renderItem = useCallback(
    ({ item }: { item: TimelineActivity }) => (
      <TimelineActivityCard item={item} onPress={onPress} />
    ), [onPress]
  );

  if (state === ScreenState.LOADING) {
    return <ActivityIndicatorOverlay/>
  }

  if (state === ScreenState.ERROR) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{t('timeline.errorLoadingData')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior='automatic'
        refreshControl={
          <RefreshControl refreshing={state === ScreenState.REFRESHING} onRefresh={refresh} />
        }
        keyExtractor={(item) => item.id.toString()} // TODO: Review this since there will be more than one data type
        renderItem={renderItem}
        sections={sections}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          state === ScreenState.IDLE ? <Text style={styles.emptyText}>{t('timeline.noTimelineActivities')}</Text> : null
        }
      />
    </View>
  );
};

// MARK: Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  list: {
    flexGrow: 1,
    padding: Spacing.md_16,
  },
  card: {
    flex: 1,
    backgroundColor: Color.white,
    padding: Spacing.sm_8,
    marginBottom: Spacing.md_16,
    borderRadius: Border.lg_16,
    ...shadowStyles.cardShadow,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodylarge_18,
    color: Color.Gray.v400,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodylarge_18,
    color: Color.Error.default,
    textAlign: 'center',
  },
  sectionHeader: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodylarge_18,
    color: Color.Gray.v500,
    marginVertical: Spacing.md_16,
  },
});

export default InstitutionTimelineScreen;
