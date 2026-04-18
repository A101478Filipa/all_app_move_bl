import { TimelineActivity, TimelineActivityType } from 'moveplus-shared';
import { getMeasurementTypeLabel } from './measurementHelper';
import { TFunction } from 'i18next';

export interface TimelineActivityContent {
  title: string;
  description: string;
}

export const getTimelineActivityContent = (
  activity: TimelineActivity,
  t: TFunction
): TimelineActivityContent => {
  const elderlyName = activity.elderly?.name || t('timeline.unknownPatient');
  const userName = activity.user?.name || t('timeline.unknownUser');

  switch (activity.type) {
    case TimelineActivityType.FALL_OCCURRENCE:
      const isHandled = activity.metadata?.isHandled;
      const handlerName = activity.user?.name || t('timeline.unknownUser');
      return {
        title: isHandled ? t('timeline.fallHandled') : t('timeline.fallOccurrence'),
        description: isHandled
          ? `${handlerName} ${t('timeline.fallHandledDescription')}`
          : `${elderlyName} ${t('timeline.fallOccurrenceDescription')}`
      };

    case TimelineActivityType.MEASUREMENT_ADDED:
      const measurementTypeRaw = activity.metadata?.measurementType;
      const measurementType = measurementTypeRaw
        ? getMeasurementTypeLabel(measurementTypeRaw, t)
        : t('timeline.unknownMeasurement');
      const value = activity.metadata?.value || t('common.notApplicable');
      const unit = activity.metadata?.unit || '';
      const valueWithUnit = `${value}${unit ? ` ${unit}` : ''}`;
      return {
        title: t('timeline.measurementAdded'),
        description: `${measurementType} ${t('timeline.measurementAddedDescription')} ${elderlyName}: ${valueWithUnit}`
      };

    case TimelineActivityType.MEDICATION_ADDED:
      const medicationName = activity.metadata?.medicationName || t('timeline.unknownMedication');
      return {
        title: t('timeline.medicationAdded'),
        description: `${medicationName} ${t('timeline.medicationAddedDescription')} ${elderlyName}`
      };

    case TimelineActivityType.MEDICATION_UPDATED:
      const updatedMedicationName = activity.metadata?.medicationName || t('timeline.unknownMedication');
      return {
        title: t('timeline.medicationUpdated'),
        description: `${updatedMedicationName} ${t('timeline.medicationUpdatedDescription')} ${elderlyName}`
      };

    case TimelineActivityType.PATHOLOGY_ADDED:
      const pathologyName = activity.metadata?.pathologyName || t('timeline.unknownCondition');
      return {
        title: t('timeline.pathologyAdded'),
        description: `${pathologyName} ${t('timeline.pathologyAddedDescription')} ${elderlyName}`
      };

    case TimelineActivityType.USER_ADDED:
      const userRole = activity.user?.role || 'UNKNOWN';
      const localizedRole = t(`userRole.${userRole.toLowerCase()}`);
      return {
        title: t('timeline.userAdded'),
        description: `${userName} ${t('timeline.userAddedDescription')} ${localizedRole}`
      };

    case TimelineActivityType.USER_UPDATED:
      const updatedUserRole = activity.user?.role || 'UNKNOWN';
      const localizedUpdatedRole = t(`userRole.${updatedUserRole.toLowerCase()}`);
      return {
        title: t('timeline.userUpdated'),
        description: `${userName} ${t('timeline.userUpdatedDescription')} ${localizedUpdatedRole}`
      };

    case TimelineActivityType.SOS_OCCURRENCE:
      const sosHandled = activity.metadata?.isHandled;
      const sosHandlerName = activity.user?.name || t('timeline.unknownUser');
      return {
        title: sosHandled ? t('timeline.sosHandled') : t('timeline.sosOccurrence'),
        description: sosHandled
          ? `${sosHandlerName} ${t('timeline.sosHandledDescription')}`
          : `${elderlyName} ${t('timeline.sosOccurrenceDescription')}`
      };

    case TimelineActivityType.CALENDAR_EVENT_ADDED: {
      const eventTitle = activity.metadata?.eventTitle || t('timeline.unknownActivity');
      const eventType = activity.metadata?.eventType || '';
      return {
        title: t('timeline.calendarEventAdded'),
        description: `${eventTitle} — ${elderlyName}`
      };
    }

    default:
      return {
        title: t('timeline.unknownActivity'),
        description: t('timeline.unknownActivityDescription')
      };
  }
};