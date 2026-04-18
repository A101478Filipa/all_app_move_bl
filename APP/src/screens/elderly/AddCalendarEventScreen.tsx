import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CalendarEventType, CreateCalendarEventRequest } from 'moveplus-shared';
import { calendarEventApi } from '@src/api/endpoints/calendarEvents';
import { institutionApi } from '@src/api/endpoints/institution';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing, spacingStyles } from '@src/styles/spacings';
import { VStack } from '@components/CoreComponents';
import { PrimaryButton } from '@components/ButtonComponents';
import { FormTextInput } from '@components/forms/FormTextInput';
import { FormDateInput } from '@components/forms/FormDateInput';
import { FormTimeInput } from '@components/forms/FormTimeInput';
import { FormDropdown } from '@components/forms/FormDropdown';
import { useErrorHandler } from '@src/hooks/useErrorHandler';
import { useTranslation } from '@src/localization/hooks/useTranslation';

type Props = NativeStackScreenProps<any, 'AddCalendarEvent'>;

const CLINICAL_TYPES = [CalendarEventType.APPOINTMENT, CalendarEventType.PHYSIOTHERAPY, CalendarEventType.NURSING_CARE];

// Extract date string YYYY-MM-DD from ISO
const toDateStr = (iso: string): string => iso.slice(0, 10);

// Extract time as Date object from ISO
const toTimeDate = (iso: string): Date => {
  const d = new Date(iso);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
};

// Combine a YYYY-MM-DD date string with a time Date into a full Date
const combineDateTime = (dateStr: string, time: Date): Date => {
  const d = new Date(dateStr);
  d.setHours(time.getHours());
  d.setMinutes(time.getMinutes());
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
};

type EventForm = {
  type: CalendarEventType | null;
  title: string;
  description: string;
  date: string | null;
  startTime: Date | null;
  endTime: Date | null;
  allDay: boolean;
  location: string;
  assignedToId: number | null;  // -1 = external professional
  externalProfessionalName: string;
};

const EXTERNAL_VALUE = -1;

const AddCalendarEventScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { elderlyId, editEvent, selectedDate, prefillType } = route.params ?? {};
  const { handleError, handleSuccess, handleValidationError } = useErrorHandler();
  const isEditing = !!editEvent;
  const [loading, setLoading] = useState(false);
  const [clinicians, setClinicians] = useState<{ label: string; value: number }[]>([]);
  const [caregivers, setCaregivers] = useState<{ label: string; value: number }[]>([]);
  const [admins, setAdmins] = useState<{ label: string; value: number }[]>([]);

  const initISO = editEvent
    ? new Date(editEvent.startDate).toISOString()
    : selectedDate ?? new Date().toISOString();

  const [form, setForm] = useState<EventForm>({
    type: editEvent?.type ?? prefillType ?? null,
    title: editEvent?.title ?? '',
    description: editEvent?.description ?? '',
    date: toDateStr(initISO),
    startTime: editEvent ? toTimeDate(new Date(editEvent.startDate).toISOString()) : toTimeDate(initISO),
    endTime: editEvent?.endDate ? toTimeDate(new Date(editEvent.endDate).toISOString()) : null,
    allDay: editEvent?.allDay ?? false,
    location: editEvent?.location ?? '',
    assignedToId: editEvent?.externalProfessionalName
      ? EXTERNAL_VALUE
      : editEvent?.assignedToId ?? null,
    externalProfessionalName: editEvent?.externalProfessionalName ?? '',
  });

  useEffect(() => {
    institutionApi.getInstitutionUsers().then(res => {
      const data = res.data;
      setClinicians((data.clinicians ?? []).map(c => ({ label: `${c.name} (${t('members.clinician')})`, value: c.userId })));
      setCaregivers((data.caregivers ?? []).map(c => ({ label: `${c.name} (${t('members.caregiver')})`, value: c.userId })));
      setAdmins((data.admins ?? []).map(c => ({ label: `${c.name} (${t('members.institutionAdmin')})`, value: c.userId })));
    }).catch(() => {});
  }, [t]);

  const isClinicalType = form.type ? CLINICAL_TYPES.includes(form.type) : false;
  const isExternal = form.assignedToId === EXTERNAL_VALUE;

  const externalOption = { label: t('calendar.externalProfessional'), value: EXTERNAL_VALUE };

  // Clinical events: only clinicians; non-clinical events: admins + caregivers (no clinicians)
  const responsibleOptions = isClinicalType
    ? [...clinicians, externalOption]
    : [...admins, ...caregivers, externalOption];

  const eventTypeOptions = Object.values(CalendarEventType)
    .map(v => ({ label: t(`calendar.types.${v}` as any), value: v }));

  const update = (key: keyof EventForm, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleTypeChange = (v: CalendarEventType) => {
    setForm(prev => ({ ...prev, type: v, assignedToId: null, externalProfessionalName: '' }));
  };

  const handleSubmit = async () => {
    if (!form.type) return handleValidationError(t('calendar.typeRequired'));
    if (!form.title.trim()) return handleValidationError(t('calendar.titleRequired'));
    if (!form.date) return handleValidationError(t('calendar.startDateRequired'));
    if (!form.allDay && !form.endTime) return handleValidationError(t('calendar.endTimeRequired'));

    // Professional is required for all event types
    if (!form.assignedToId) return handleValidationError(t('calendar.professionalRequired'));
    if (isExternal && !form.externalProfessionalName.trim()) {
      return handleValidationError(t('calendar.externalNameRequired'));
    }

    setLoading(true);
    try {
      const startDate = form.allDay
        ? new Date(form.date)
        : combineDateTime(form.date, form.startTime ?? new Date());

      const endDate = (!form.allDay && form.endTime)
        ? combineDateTime(form.date, form.endTime)
        : undefined;

      const payload: CreateCalendarEventRequest = {
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        startDate,
        endDate,
        allDay: form.allDay,
        location: form.location.trim() || undefined,
        assignedToId: (!isExternal && form.assignedToId && form.assignedToId > 0) ? form.assignedToId : undefined,
        externalProfessionalName: (isExternal && form.externalProfessionalName.trim())
          ? form.externalProfessionalName.trim()
          : undefined,
      };

      if (isEditing) {
        await calendarEventApi.updateEvent(editEvent.id, payload);
        handleSuccess(t('calendar.eventUpdated'));
      } else {
        await calendarEventApi.createEvent(elderlyId, payload);
        handleSuccess(t('calendar.eventAdded'));
      }

      navigation.goBack();
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={spacingStyles.screenScrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <VStack align="flex-start" spacing={Spacing.md_16}>
          <FormDropdown
            title={t('calendar.eventType')}
            placeholder={t('calendar.selectEventType')}
            value={form.type}
            options={eventTypeOptions}
            onValueChange={handleTypeChange}
            required
          />

          <FormTextInput
            title={t('calendar.eventTitle')}
            value={form.title}
            onChangeText={v => update('title', v)}
            placeholder={t('calendar.eventTitlePlaceholder')}
            required
          />

          <FormDateInput
            title={t('calendar.startDate')}
            value={form.date ?? ''}
            onDateChange={v => update('date', v)}
            placeholder={t('calendar.startDate')}
            required
          />

          {/* All Day toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{t('calendar.allDay')}</Text>
            <Switch
              value={form.allDay}
              onValueChange={v => update('allDay', v)}
              trackColor={{ true: Color.primary }}
              thumbColor={Color.white}
            />
          </View>

          {/* Start / End times — hidden when all day */}
          {!form.allDay && (
            <>
              <FormTimeInput
                title={t('calendar.startTime')}
                value={form.startTime}
                onChange={v => update('startTime', v)}
                required
              />
              <FormTimeInput
                title={t('calendar.endTime')}
                value={form.endTime}
                onChange={v => update('endTime', v)}
                required
              />
            </>
          )}

          <FormTextInput
            title={t('calendar.location')}
            value={form.location}
            onChangeText={v => update('location', v)}
            placeholder={t('calendar.locationPlaceholder')}
          />

          <FormTextInput
            title={t('calendar.description')}
            value={form.description}
            onChangeText={v => update('description', v)}
            placeholder={t('calendar.descriptionPlaceholder')}
            multiline
          />

          {/* Responsible professional — required for all event types */}
          <FormDropdown
            title={t('calendar.assignedResponsible')}
            placeholder={t('calendar.selectResponsible')}
            value={form.assignedToId}
            options={responsibleOptions}
            onValueChange={v => update('assignedToId', v)}
            required
          />

          {/* External professional name — shown only when external option selected */}
          {isExternal && (
            <FormTextInput
              title={t('calendar.externalProfessional')}
              value={form.externalProfessionalName}
              onChangeText={v => update('externalProfessionalName', v)}
              placeholder={t('calendar.externalProfessionalPlaceholder')}
              required
            />
          )}

          <PrimaryButton
            title={isEditing ? t('calendar.editEvent') : t('calendar.addEvent')}
            onPress={handleSubmit}
            loading={loading}
          />
        </VStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddCalendarEventScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.Background.subtle,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.xs_4,
  },
  toggleLabel: {
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.medium,
    color: Color.dark,
  },
});
