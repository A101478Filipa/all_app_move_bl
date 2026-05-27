import React, { useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, SectionList, SafeAreaView, TouchableOpacity, Modal } from 'react-native';
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
import { ClinicianDashboardNavigationStackParamList } from '@navigation/ClinicianDashboardNavigationStack';
import { useInstitutionTimelineStore } from '@src/stores';
import { useFocusEffect } from '@react-navigation/core';
import { useCallback } from 'react';
import TimelineActivityCard from '@src/components/TimelineActivityCard';
import { fallOccurrenceApi } from '@src/api/endpoints/fallOccurrences';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';
import dayjs from 'dayjs';

// MARK: Types
type Props = NativeStackScreenProps<InstitutionDashboardNavigationStackParamList, 'InstitutionDashboardScreen'> |
             NativeStackScreenProps<ClinicianDashboardNavigationStackParamList, 'InstitutionTimelineScreen'>;

type NavigationProp = {
  push: (screen: string, params?: any) => void;
};

// MARK: Screen
const InstitutionTimelineScreen: React.FC<Props> = ({ navigation }) => {
  const { sections, fetch, refresh, state, filterMode, filterDate, setFilter, clearFilter } = useInstitutionTimelineStore();
  const { handleError } = useErrorHandler();
  const { t } = useTranslation();
  const defaultStyles = useDefaultStyles();

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'day' | 'month'>('day');
  const [tempDate, setTempDate] = useState(dayjs());
  const [monthPickerYear, setMonthPickerYear] = useState(dayjs().year());

  const PT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentYear = dayjs().year();
  const currentMonth = dayjs().month(); // 0-indexed

  const openPicker = (mode: 'day' | 'month') => {
    setPickerMode(mode);
    const existing = filterMode === mode && filterDate ? dayjs(filterDate) : dayjs();
    setTempDate(existing);
    setMonthPickerYear(existing.year());
    setShowPicker(true);
  };

  const confirmDayPicker = () => {
    setFilter(tempDate.format('YYYY-MM-DD'), 'day');
    setShowPicker(false);
  };

  const selectMonth = (monthIndex: number) => {
    const value = `${monthPickerYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    setFilter(value, 'month');
    setShowPicker(false);
  };

  const formatFilterLabel = () => {
    if (!filterDate || !filterMode) return '';
    if (filterMode === 'day') return dayjs(filterDate).format('DD/MM/YYYY');
    return dayjs(filterDate + '-01').format('MM/YYYY');
  };

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
        {formatFriendlyDate(section.title, t, false)}
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
      {/* Filter bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, filterMode === 'day' && styles.filterChipActive]}
          onPress={() => openPicker('day')}
        >
          <MaterialIcons name="calendar-today" size={14} color={filterMode === 'day' ? Color.white : Color.Gray.v500} />
          <Text style={[styles.filterChipText, filterMode === 'day' && styles.filterChipTextActive]}>
            {filterMode === 'day' ? formatFilterLabel() : t('timeline.filterByDay')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterMode === 'month' && styles.filterChipActive]}
          onPress={() => openPicker('month')}
        >
          <MaterialIcons name="date-range" size={14} color={filterMode === 'month' ? Color.white : Color.Gray.v500} />
          <Text style={[styles.filterChipText, filterMode === 'month' && styles.filterChipTextActive]}>
            {filterMode === 'month' ? formatFilterLabel() : t('timeline.filterByMonth')}
          </Text>
        </TouchableOpacity>

        {filterMode && (
          <TouchableOpacity style={styles.clearButton} onPress={clearFilter}>
            <MaterialIcons name="close" size={18} color={Color.Gray.v500} />
          </TouchableOpacity>
        )}
      </View>

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

      {/* Day Picker Modal */}
      {pickerMode === 'day' && (
        <Modal transparent visible={showPicker} animationType="fade" onRequestClose={() => setShowPicker(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.calendarContainer}>
              <DateTimePicker
                mode="single"
                date={tempDate.toDate()}
                maxDate={new Date()}
                onChange={(params) => setTempDate(dayjs(params.date))}
                styles={{
                  ...defaultStyles,
                  selected: { backgroundColor: Color.primary, borderRadius: 100 },
                  selected_label: { color: '#fff', fontWeight: 'bold' },
                  today: { borderColor: Color.primary, borderWidth: 1, borderRadius: 100 },
                }}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.modalBtn}>
                  <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmDayPicker} style={styles.modalBtn}>
                  <Text style={styles.confirmText}>{t('common.confirm')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Month Picker Modal */}
      {pickerMode === 'month' && (
        <Modal transparent visible={showPicker} animationType="fade" onRequestClose={() => setShowPicker(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
            <TouchableOpacity activeOpacity={1} style={styles.monthPickerContainer}>
              {/* Year selector */}
              <View style={styles.yearRow}>
                <TouchableOpacity onPress={() => setMonthPickerYear(y => y - 1)} style={styles.yearArrow}>
                  <MaterialIcons name="chevron-left" size={28} color={Color.Gray.v500} />
                </TouchableOpacity>
                <Text style={styles.yearLabel}>{monthPickerYear}</Text>
                <TouchableOpacity
                  onPress={() => setMonthPickerYear(y => y + 1)}
                  style={styles.yearArrow}
                  disabled={monthPickerYear >= currentYear}
                >
                  <MaterialIcons name="chevron-right" size={28} color={monthPickerYear >= currentYear ? Color.Gray.v200 : Color.Gray.v500} />
                </TouchableOpacity>
              </View>

              {/* Month grid */}
              <View style={styles.monthGrid}>
                {PT_MONTHS.map((name, index) => {
                  const isFuture = monthPickerYear === currentYear && index > currentMonth;
                  const isActive = filterMode === 'month' && filterDate === `${monthPickerYear}-${String(index + 1).padStart(2, '0')}`;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.monthCell, isActive && styles.monthCellActive, isFuture && styles.monthCellDisabled]}
                      onPress={() => !isFuture && selectMonth(index)}
                      disabled={isFuture}
                    >
                      <Text style={[styles.monthCellText, isActive && styles.monthCellTextActive, isFuture && styles.monthCellTextDisabled]}>
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.modalBtn}>
                  <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

// MARK: Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_8,
    gap: Spacing.sm_8,
    backgroundColor: Color.Background.subtle,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm_12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Color.Gray.v300,
    backgroundColor: Color.white,
  },
  filterChipActive: {
    backgroundColor: Color.primary,
    borderColor: Color.primary,
  },
  filterChipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
  },
  filterChipTextActive: {
    color: Color.white,
  },
  clearButton: {
    marginLeft: 'auto',
    padding: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: Color.white,
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    width: '90%',
    alignItems: 'center',
  },
  monthPickerContainer: {
    backgroundColor: Color.white,
    borderRadius: Border.md_12,
    padding: Spacing.md_16,
    width: '85%',
    alignItems: 'center',
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.md_16,
  },
  yearArrow: {
    padding: Spacing.sm_8,
  },
  yearLabel: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl_20,
    color: Color.black,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: Spacing.sm_8,
  },
  monthCell: {
    width: '30%',
    paddingVertical: Spacing.sm_12,
    borderRadius: Border.sm_8,
    borderWidth: 1,
    borderColor: Color.Gray.v200,
    alignItems: 'center',
    backgroundColor: Color.white,
  },
  monthCellActive: {
    backgroundColor: Color.primary,
    borderColor: Color.primary,
  },
  monthCellDisabled: {
    backgroundColor: Color.Background.subtle,
    borderColor: Color.Gray.v200,
  },
  monthCellText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodysmall_14,
    color: Color.Gray.v500,
  },
  monthCellTextActive: {
    color: Color.white,
    fontFamily: FontFamily.bold,
  },
  monthCellTextDisabled: {
    color: Color.Gray.v300,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: Spacing.sm_8,
    gap: Spacing.md_16,
  },
  modalBtn: {
    padding: Spacing.sm_8,
  },
  cancelText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodymedium_16,
    color: Color.Gray.v500,
  },
  confirmText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodymedium_16,
    color: Color.primary,
  },
});

export default InstitutionTimelineScreen;
