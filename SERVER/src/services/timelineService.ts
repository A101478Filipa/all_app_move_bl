import { TimelineActivityType } from '@prisma/client';
import { createTimelineActivity } from '../modules/timeline/timelineController';
import { Measurement } from 'moveplus-shared';

export class TimelineService {
  static async createFallOccurrenceActivity(
    institutionId: number,
    fallOccurrence: any,
    isHandled: boolean = false
  ) {
    await createTimelineActivity(
      institutionId,
      TimelineActivityType.FALL_OCCURRENCE,
      fallOccurrence.elderlyId,
      fallOccurrence.handlerUserId,
      fallOccurrence.id,
      {
        isHandled,
        injuryStatus: fallOccurrence.injured,
        isFalseAlarm: fallOccurrence.isFalseAlarm || false
      }
    );
  }

  static async createMeasurementActivity(
    institutionId: number,
    measurement: any,
    elderlyName: string,
    measuredByName?: string
  ) {
    await createTimelineActivity(
      institutionId,
      TimelineActivityType.MEASUREMENT_ADDED,
      measurement.elderlyId,
      measurement.measuredById,
      measurement.id,
      {
        measurementType: measurement.type,
        value: measurement.value,
        unit: measurement.unit,
        notes: measurement.notes
      }
    );
  }

  static async createMedicationActivity(
    institutionId: number,
    medication: any,
    elderlyName: string,
    registeredByName: string,
    isUpdate: boolean = false
  ) {
    await createTimelineActivity(
      institutionId,
      isUpdate ? TimelineActivityType.MEDICATION_UPDATED : TimelineActivityType.MEDICATION_ADDED,
      medication.elderlyId,
      medication.registeredById,
      medication.id,
      {
        medicationName: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency
      }
    );
  }

  static async createPathologyActivity(
    institutionId: number,
    pathology: any,
    elderlyName: string,
    registeredByName: string
  ) {
    await createTimelineActivity(
      institutionId,
      TimelineActivityType.PATHOLOGY_ADDED,
      pathology.elderlyId,
      pathology.registeredById,
      pathology.id,
      {
        pathologyName: pathology.name,
        diagnosisSite: pathology.diagnosisSite
      }
    );
  }

  static async createUserActivity(
    institutionId: number,
    user: any,
    userName: string,
    isUpdate: boolean = false
  ) {
    await createTimelineActivity(
      institutionId,
      isUpdate ? TimelineActivityType.USER_UPDATED : TimelineActivityType.USER_ADDED,
      user.role === 'ELDERLY' ? user.id : undefined,
      undefined,
      user.id,
      {
        userRole: user.role,
        userType: user.role
      }
    );
  }
}