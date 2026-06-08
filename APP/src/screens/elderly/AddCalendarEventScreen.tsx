import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CalendarEventType, CreateCalendarEventRequest, ExternalProfessional, UserRole } from 'moveplus-shared';
import { calendarEventApi } from '@src/api/endpoints/calendarEvents';
import { institutionApi } from '@src/api/endpoints/institution';
import { externalProfessionalApi } from '@src/api/endpoints/externalProfessionals';
import { timeOffApi, StaffTimeOffWithUser } from '@src/api/endpoints/timeOff';
import { staffScheduleApi, StaffScheduleSummary } from '@src/api/endpoints/staffSchedule';
import { useAuthStore } from '@src/stores/authStore';
import { api } from '@src/services/ApiService';
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
  // External professional selection:
  //   externalProfessionalId > 0  → existing saved external (preferred)
  //   externalProfessionalId === NEW_EXTERNAL_VALUE → user is filling in a new one
  externalProfessionalId: number | null;
  // Fields for creating a new external professional inline:
  newExternalName: string;
  newExternalSpecialty: string;
  newExternalPhone: string;
};

const EXTERNAL_VALUE = -1;        // sentinel for assignedToId: "external" mode
const NEW_EXTERNAL_VALUE = -2;    // sentinel for externalProfessionalId: "create new"

const AddCalendarEventScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { elderlyId, editEvent, selectedDate, prefillType } = route.params ?? {};
  const { handleError, handleSuccess, handleValidationError } = useErrorHandler();
  const { user } = useAuthStore();
  const userRole = user?.user?.role;
  const isAdminOrProgrammer = userRole === UserRole.INSTITUTION_ADMIN || userRole === UserRole.PROGRAMMER;
  const isStaff = isAdminOrProgrammer || userRole === UserRole.CLINICIAN || userRole === UserRole.CAREGIVER;
  const isEditing = !!editEvent;
  const [loading, setLoading] = useState(false);
  const [clinicians, setClinicians] = useState<{ label: string; value: number }[]>([]);
  const [caregivers, setCaregivers] = useState<{ label: string; value: number }[]>([]);
  const [savedExternals, setSavedExternals] = useState<ExternalProfessional[]>([]);
  const [institutionTimeOffs, setInstitutionTimeOffs] = useState<StaffTimeOffWithUser[]>([]);
  const [institutionSchedules, setInstitutionSchedules] = useState<StaffScheduleSummary[]>([]);

  const initISO = editEvent
    ? new Date(editEvent.startDate).toISOString()
    : selectedDate ?? new Date().toISOString();

  // Determine initial external professional id for edit mode
  const initExternalId = (): number | null => {
    if (!editEvent) return null;
    if (editEvent.externalProfessionalId) return editEvent.externalProfessionalId;
    if (editEvent.externalProfessionalName) return NEW_EXTERNAL_VALUE; // legacy free-text → treat as "new"
    return null;
  };

  const [form, setForm] = useState<EventForm>({
    type: editEvent?.type ?? prefillType ?? null,
    title: editEvent?.title ?? '',
    description: editEvent?.description ?? '',
    date: toDateStr(initISO),
    startTime: editEvent ? toTimeDate(new Date(editEvent.startDate).toISOString()) : toTimeDate(initISO),
    endTime: editEvent?.endDate ? toTimeDate(new Date(editEvent.endDate).toISOString()) : null,
    allDay: editEvent?.allDay ?? false,
    location: editEvent?.location ?? '',
    assignedToId: (editEvent?.externalProfessionalId || editEvent?.externalProfessionalName)
      ? EXTERNAL_VALUE
      : editEvent?.assignedToId ?? null,
    externalProfessionalId: initExternalId(),
    newExternalName: editEvent?.externalProfessionalName ?? '',
    newExternalSpecialty: '',
    newExternalPhone: '',
  });

  useEffect(() => {
    institutionApi.getInstitutionUsers().then(res => {
      const data = res.data;
      setClinicians((data.clinicians ?? []).map(c => ({ label: `${c.name} (${t('members.clinician')})`, value: c.userId })));
      setCaregivers((data.caregivers ?? []).map(c => ({ label: `${c.name} (${t('members.caregiver')})`, value: c.userId })));
    }).catch(() => {});

    externalProfessionalApi.list().then(res => {
      setSavedExternals(res.data ?? []);
    }).catch(() => {});

    if (isStaff) {
      api.get('time-off/institution', { _silentError: true } as any)
        .then((r: any) => setInstitutionTimeOffs(r.data?.data ?? []))
        .catch(() => {});

      api.get('staff-schedules/institution', { _silentError: true } as any)
        .then((r: any) => setInstitutionSchedules(r.data?.data ?? []))
        .catch(() => {});
    }
  }, [t, isAdminOrProgrammer]);

  const isClinicalType = form.type ? CLINICAL_TYPES.includes(form.type) : false;
  const isExternal = form.assignedToId === EXTERNAL_VALUE;
  const isNewExternal = isExternal && form.externalProfessionalId === NEW_EXTERNAL_VALUE;
  const isExistingExternal = isExternal && form.externalProfessionalId !== null && form.externalProfessionalId !== NEW_EXTERNAL_VALUE && form.externalProfessionalId > 0;

  // Returns true when the staff member is NOT available for the event date/time:
  //  1. Has an approved time-off covering the event date
  //  2. Their schedule doesn't include that weekday
  //  3. If the event has a specific start time, it falls outside their work hours
  const isOnTimeOff = (userId: number): boolean => {
    if (!form.date) return false;
    const evDate = new Date(form.date);

    // Check 1: approved time-off
    const onLeave = institutionTimeOffs.some(to =>
      to.user.id === userId &&
      new Date(to.startDate) <= evDate &&
      new Date(to.endDate) >= evDate
    );
    if (onLeave) return true;

    // Check 2 & 3: work schedule
    const summary = institutionSchedules.find(s => s.userId === userId);
    if (summary?.schedule) {
      const { workDays, startTime, endTime } = summary.schedule;
      const jsDay = evDate.getDay();
      const isoDay = jsDay === 0 ? 7 : jsDay;
      if (!workDays.includes(isoDay)) return true;  // doesn't work that weekday

      // Check time only when event is not all-day and has a startTime
      if (!form.allDay && form.startTime) {
        const evH = form.startTime.getHours();
        const evM = form.startTime.getMinutes();
        const evMins = evH * 60 + evM;
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        const startMins = sh * 60 + sm;
        const endMins   = eh * 60 + em;
        const inShift = startMins < endMins
          ? evMins >= startMins && evMins < endMins          // normal shift
          : evMins >= startMins || evMins < endMins;         // overnight shift
        if (!inShift) return true;
      }
    }

    return false;
  };

  const tagTimeOff = (items: { label: string; value: number }[]) =>
    items.filter(item => !isOnTimeOff(item.value));

  useEffect(() => {
    if (form.assignedToId && form.assignedToId !== EXTERNAL_VALUE && isOnTimeOff(form.assignedToId)) {
      setForm(prev => ({ ...prev, assignedToId: null }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.date, form.startTime, form.allDay]);

  const externalOption = { label: `(${t('calendar.external')}) ${t('calendar.externalProfessional')}`, value: EXTERNAL_VALUE };

  // Clinical events: only clinicians; non-clinical events: admins + caregivers (no clinicians)
  const responsibleOptions = isClinicalType
    ? [...tagTimeOff(clinicians), externalOption]
    : [...tagTimeOff(caregivers), externalOption];

  // Dropdown options for saved external professionals + "Add new" option
  const externalProfessionalOptions = [
    { label: `+ ${t('calendar.addNewExternal')}`, value: NEW_EXTERNAL_VALUE },
    ...savedExternals.map(ep => ({
      label: ep.specialty ? `${ep.name} (${ep.specialty})` : ep.name,
      value: ep.id,
    })),
  ];

  const eventTypeOptions = Object.values(CalendarEventType)
    .map(v => ({ label: t(`calendar.types.${v}` as any), value: v }));

  const update = (key: keyof EventForm, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleTypeChange = (v: CalendarEventType) => {
    setForm(prev => ({ ...prev, type: v, assignedToId: null, externalProfessionalId: null, newExternalName: '', newExternalSpecialty: '', newExternalPhone: '' }));
  };

  const handleAssignedToChange = (v: number) => {
    if (v !== EXTERNAL_VALUE) {
      setForm(prev => ({ ...prev, assignedToId: v, externalProfessionalId: null, newExternalName: '', newExternalSpecialty: '', newExternalPhone: '' }));
    } else {
      setForm(prev => ({ ...prev, assignedToId: EXTERNAL_VALUE }));
    }
  };

  const handleSubmit = async () => {
    if (!form.type) return handleValidationError(t('calendar.typeRequired'));
    if (!form.title.trim()) return handleValidationError(t('calendar.titleRequired'));
    if (!form.date) return handleValidationError(t('calendar.startDateRequired'));
    if (!form.allDay && !form.endTime) return handleValidationError(t('calendar.endTimeRequired'));
    if (!form.allDay && form.startTime && form.endTime) {
      const startMins = form.startTime.getHours() * 60 + form.startTime.getMinutes();
      const endMins = form.endTime.getHours() * 60 + form.endTime.getMinutes();
      if (endMins <= startMins) return handleValidationError(t('calendar.endTimeBeforeStart'));
    }

    // Professional is required for all event types
    if (!form.assignedToId) return handleValidationError(t('calendar.professionalRequired'));
    if (isExternal && !form.externalProfessionalId) return handleValidationError(t('calendar.selectExternalRequired'));
    if (isNewExternal && !form.newExternalName.trim()) return handleValidationError(t('calendar.externalNameRequired'));

    setLoading(true);
    try {
      // If "new external", create the external professional first
      let resolvedExternalProfessionalId: number | undefined;
      if (isNewExternal) {
        const created = await externalProfessionalApi.create({
          name: form.newExternalName.trim(),
          specialty: form.newExternalSpecialty.trim() || null,
          phone: form.newExternalPhone.trim() || null,
        });
        resolvedExternalProfessionalId = created.data.id;
      } else if (isExistingExternal) {
        resolvedExternalProfessionalId = form.externalProfessionalId!;
      }

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
        externalProfessionalId: resolvedExternalProfessionalId ?? undefined,
        externalProfessionalName: undefined,
      };

      if (isEditing) {
        // Mudamos para chamada direta da API para enviar o _silentError e calar o terminal
        await api.put(`calendar-events/${editEvent.id}`, payload, { _silentError: true } as any);
        handleSuccess(t('calendar.eventUpdated'));
      } else {
        // Mudamos para chamada direta da API para enviar o _silentError e calar o terminal
        await api.post(`calendar-events/elderly/${elderlyId}`, payload, { _silentError: true } as any);
        handleSuccess(t('calendar.eventAdded'));
      }

      navigation.goBack();
    } catch (err: any) {
      const status = err.response?.status;
      const serverMessage = err.response?.data?.message;

      // Se for erro controlado do utilizador (gama 400), ativa a notificação bonita e não suja o terminal
      if (status >= 400 && status < 500 && serverMessage) {
        return handleValidationError(serverMessage);
      }

      // Se for um erro crítico 500, o terminal avisa-te normalmente
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
            onValueChange={handleAssignedToChange}
            required
          />

          {/* External professional section — shown when external option is selected */}
          {isExternal && (
            <>
              <FormDropdown
                title={t('calendar.selectExternalProfessional')}
                placeholder={t('calendar.selectOrAddExternal')}
                value={form.externalProfessionalId}
                options={externalProfessionalOptions}
                onValueChange={v => update('externalProfessionalId', v)}
                required
              />

              {/* Fields shown only when creating a NEW external professional */}
              {isNewExternal && (
                <>
                  <FormTextInput
                    title={t('calendar.externalName')}
                    value={form.newExternalName}
                    onChangeText={v => update('newExternalName', v)}
                    placeholder={t('calendar.externalNamePlaceholder')}
                    required
                  />
                  <FormTextInput
                    title={t('calendar.externalSpecialty')}
                    value={form.newExternalSpecialty}
                    onChangeText={v => update('newExternalSpecialty', v)}
                    placeholder={t('calendar.externalSpecialtyPlaceholder')}
                  />
                  <FormTextInput
                    title={t('calendar.externalPhone')}
                    value={form.newExternalPhone}
                    onChangeText={v => update('newExternalPhone', v)}
                    placeholder={t('calendar.externalPhonePlaceholder')}
                    keyboardType="phone-pad"
                  />
                </>
              )}
            </>
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
