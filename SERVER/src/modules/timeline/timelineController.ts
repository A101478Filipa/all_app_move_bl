import { Response } from 'express';
import { AuthenticatedRequest } from '../../constants/AuthenticatedRequest';
import prisma from '../../prisma';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { TimelineActivityType } from '@prisma/client';

// TODO: Paginate request
export const indexInstitutionTimeline = async (req: AuthenticatedRequest, res: Response) => {
  const institutionId = req.params.institutionId
    ? Number(req.params.institutionId)
    : Number(req.user.institutionId);

  if (!institutionId) {
    return sendError(res, 'Institution id not found on the request', 400);
  }

  try {
    // Fetch standard timeline activities
    const activities = await prisma.timelineActivity.findMany({
      where: { institutionId },
      include: {
        elderly: {
          select: {
            id: true,
            name: true,
            medicalId: true,
          }
        },
        user: {
          include: {
            caregiver: { select: { name: true } },
            elderly: { select: { name: true } },
            institutionAdmin: { select: { name: true } },
            clinician: { select: { name: true } },
            programmer: { select: { name: true } },
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const enrichedActivities = activities.map(activity => {
      const { user, ...activityData } = activity;
      let enrichedUser = null;

      if (user) {
        const userName =
          user.caregiver?.name ||
          user.elderly?.name ||
          user.institutionAdmin?.name ||
          user.clinician?.name ||
          user.programmer?.name ||
          'Unknown User';

        enrichedUser = {
          id: user.id,
          name: userName,
          role: user.role,
        };
      }

      return {
        ...activityData,
        user: enrichedUser,
      };
    });

    // Fetch SOS occurrences for this institution
    const sosOccurrences = await prisma.sosOccurrence.findMany({
      where: {
        elderly: {
          institutionId,
        }
      },
      include: {
        elderly: {
          select: {
            id: true,
            name: true,
            medicalId: true,
          }
        },
        handler: {
          select: {
            id: true,
            role: true,
            caregiver: { select: { name: true } },
            institutionAdmin: { select: { name: true } },
            clinician: { select: { name: true } },
            programmer: { select: { name: true } },
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 50,
    });

    const sosActivities = sosOccurrences.map(sos => {
      const handlerName = sos.handler
        ? (sos.handler.caregiver?.name || sos.handler.institutionAdmin?.name || sos.handler.clinician?.name || sos.handler.programmer?.name || 'Unknown')
        : null;

      return {
        id: -(sos.id + 10000), // synthetic negative id to avoid collision
        institutionId,
        type: 'SOS_OCCURRENCE' as any,
        elderlyId: sos.elderlyId,
        userId: sos.handlerUserId ?? null,
        relatedId: sos.id,
        metadata: {
          isHandled: !!sos.handlerUserId,
          handlerName,
          notes: sos.notes,
        },
        createdAt: sos.date,
        elderly: sos.elderly
          ? { id: sos.elderly.id, name: sos.elderly.name, medicalId: sos.elderly.medicalId }
          : null,
        user: sos.handler
          ? { id: sos.handler.id, name: handlerName ?? 'Unknown', role: sos.handler.role }
          : null,
      };
    });

    // Fetch calendar events for this institution
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: {
        elderly: {
          institutionId,
        }
      },
      include: {
        elderly: {
          select: {
            id: true,
            name: true,
            medicalId: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            role: true,
            caregiver: { select: { name: true } },
            institutionAdmin: { select: { name: true } },
            clinician: { select: { name: true } },
            programmer: { select: { name: true } },
          }
        },
      },
      orderBy: { startDate: 'desc' },
      take: 50,
    });

    const calendarActivities = calendarEvents.map(ev => {
      const createdByName = ev.createdBy
        ? (ev.createdBy.caregiver?.name || ev.createdBy.institutionAdmin?.name || ev.createdBy.clinician?.name || ev.createdBy.programmer?.name || 'Unknown')
        : null;

      return {
        id: -(ev.id + 20000), // synthetic negative id to avoid collision
        institutionId,
        type: 'CALENDAR_EVENT_ADDED' as any,
        elderlyId: ev.elderlyId,
        userId: ev.createdById,
        relatedId: ev.id,
        metadata: {
          eventType: ev.type,
          eventTitle: ev.title,
          allDay: ev.allDay,
          location: ev.location,
          elderlyId: ev.elderlyId,
        },
        createdAt: ev.startDate,
        elderly: ev.elderly
          ? { id: ev.elderly.id, name: ev.elderly.name, medicalId: ev.elderly.medicalId }
          : null,
        user: ev.createdBy
          ? { id: ev.createdBy.id, name: createdByName ?? 'Unknown', role: ev.createdBy.role }
          : null,
      };
    });

    // Merge all activity streams and sort by date descending
    const allActivities = [...enrichedActivities, ...sosActivities, ...calendarActivities]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 150);

    sendSuccess(res, allActivities);
  } catch (error) {
    console.error('Error fetching timeline activities:', error);
    sendError(res, 'Failed to fetch timeline activities', 500);
  }
};

export const createTimelineActivity = async (
  institutionId: number,
  type: TimelineActivityType,
  elderlyId?: number,
  userId?: number,
  relatedId?: number,
  metadata?: Record<string, any>
) => {
  try {
    return await prisma.timelineActivity.create({
      data: {
        institutionId,
        type,
        elderlyId,
        userId,
        relatedId,
        metadata,
      },
    });
  } catch (error) {
    console.error('Error creating timeline activity:', error);
    throw error;
  }
};