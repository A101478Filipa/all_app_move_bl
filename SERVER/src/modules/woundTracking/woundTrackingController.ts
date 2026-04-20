import prisma from "../../prisma";
import { sendSuccess, sendError } from "../../utils/apiResponse";
import { UserRole } from "moveplus-shared";
import { DataAccessRequestStatus } from "@prisma/client";

const woundTrackingInclude = {
  createdByUser: { select: { id: true } },
};

const latestTrackingInclude = {
  orderBy: { createdAt: 'desc' as const },
  take: 1,
  include: woundTrackingInclude,
};

// GET /fall-occurrences/:occurrenceId/wound-tracking
export const getFallWoundTrackings = async (req, res) => {
  const occurrenceId = Number(req.params.occurrenceId);
  const { role, institutionId, userId } = req.user;

  try {
    const occurrence = await prisma.fallOccurrence.findUnique({
      where: { id: occurrenceId },
      include: { elderly: true },
    });

    if (!occurrence) return sendError(res, 'Fall occurrence not found', 404);

    const hasAccess =
      role === UserRole.PROGRAMMER ||
      occurrence.elderly.institutionId === institutionId ||
      (role === UserRole.CLINICIAN && await checkClinicianAccess(userId, occurrence.elderly.id));

    if (!hasAccess) return sendError(res, 'Forbidden', 403);

    const trackings = await prisma.woundTracking.findMany({
      where: { fallOccurrenceId: occurrenceId },
      include: woundTrackingInclude,
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, trackings, 'Wound trackings fetched');
  } catch (e) {
    console.error('Error fetching fall wound trackings:', e);
    return sendError(res, 'Internal server error', 500);
  }
};

// POST /fall-occurrences/:occurrenceId/wound-tracking
export const addFallWoundTracking = async (req, res) => {
  const occurrenceId = Number(req.params.occurrenceId);
  const { notes } = req.body;
  const isResolved = req.body.isResolved === 'true' || req.body.isResolved === true;

  try {
    const occurrence = await prisma.fallOccurrence.findUnique({
      where: { id: occurrenceId },
      include: { elderly: true },
    });

    if (!occurrence) return sendError(res, 'Fall occurrence not found', 404);
    if (occurrence.elderly.institutionId !== req.user.institutionId) {
      return sendError(res, 'Forbidden', 403);
    }
    if (!notes?.trim() && !req.file && !isResolved) {
      return sendError(res, 'Add notes, a photo, or mark the wound as resolved', 400);
    }

    const tracking = await prisma.woundTracking.create({
      data: {
        fallOccurrenceId: occurrenceId,
        createdByUserId: req.user.userId,
        notes: notes?.trim() || null,
        photoUrl: req.file ? req.file.filename : null,
        isResolved,
      } as any,
      include: woundTrackingInclude,
    });

    return sendSuccess(res, tracking, 'Wound tracking added', 201);
  } catch (e) {
    console.error('Error adding fall wound tracking:', e);
    return sendError(res, 'Internal server error', 500);
  }
};

// GET /sos-occurrences/:occurrenceId/wound-tracking
export const getSosWoundTrackings = async (req, res) => {
  const occurrenceId = Number(req.params.occurrenceId);
  const { role, institutionId, userId } = req.user;

  try {
    const occurrence = await prisma.sosOccurrence.findUnique({
      where: { id: occurrenceId },
      include: { elderly: true },
    });

    if (!occurrence) return sendError(res, 'SOS occurrence not found', 404);

    const hasAccess =
      role === UserRole.PROGRAMMER ||
      occurrence.elderly.institutionId === institutionId ||
      (role === UserRole.CLINICIAN && await checkClinicianAccess(userId, occurrence.elderly.id));

    if (!hasAccess) return sendError(res, 'Forbidden', 403);

    const trackings = await prisma.woundTracking.findMany({
      where: { sosOccurrenceId: occurrenceId },
      include: woundTrackingInclude,
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, trackings, 'Wound trackings fetched');
  } catch (e) {
    console.error('Error fetching SOS wound trackings:', e);
    return sendError(res, 'Internal server error', 500);
  }
};

// POST /sos-occurrences/:occurrenceId/wound-tracking
export const addSosWoundTracking = async (req, res) => {
  const occurrenceId = Number(req.params.occurrenceId);
  const { notes } = req.body;
  const isResolved = req.body.isResolved === 'true' || req.body.isResolved === true;

  try {
    const occurrence = await prisma.sosOccurrence.findUnique({
      where: { id: occurrenceId },
      include: { elderly: true },
    });

    if (!occurrence) return sendError(res, 'SOS occurrence not found', 404);
    if (occurrence.elderly.institutionId !== req.user.institutionId) {
      return sendError(res, 'Forbidden', 403);
    }
    if (!notes?.trim() && !req.file && !isResolved) {
      return sendError(res, 'Add notes, a photo, or mark the wound as resolved', 400);
    }

    const tracking = await prisma.woundTracking.create({
      data: {
        sosOccurrenceId: occurrenceId,
        createdByUserId: req.user.userId,
        notes: notes?.trim() || null,
        photoUrl: req.file ? req.file.filename : null,
        isResolved,
      } as any,
      include: woundTrackingInclude,
    });

    return sendSuccess(res, tracking, 'Wound tracking added', 201);
  } catch (e) {
    console.error('Error adding SOS wound tracking:', e);
    return sendError(res, 'Internal server error', 500);
  }
};

// GET /elderly/:elderlyId/wound-tracking
export const getElderlyWoundTrackings = async (req, res) => {
  const elderlyId = Number(req.params.elderlyId);
  const { role, institutionId, userId } = req.user;

  try {
    const elderly = await prisma.elderly.findUnique({ where: { id: elderlyId } });
    if (!elderly) return sendError(res, 'Elderly not found', 404);

    const hasAccess =
      role === UserRole.PROGRAMMER ||
      elderly.institutionId === institutionId ||
      (role === UserRole.CLINICIAN && await checkClinicianAccess(userId, elderlyId));

    if (!hasAccess) return sendError(res, 'Forbidden', 403);

    let trackings;
    try {
      trackings = await prisma.woundTracking.findMany({
        where: {
          OR: [
            { elderlyId },
            { fallOccurrence: { elderlyId } },
            { sosOccurrence: { elderlyId } },
          ],
        },
        include: woundTrackingInclude,
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      // Fallback: elderlyId column may not exist yet, query without it
      trackings = await prisma.woundTracking.findMany({
        where: {
          OR: [
            { fallOccurrence: { elderlyId } },
            { sosOccurrence: { elderlyId } },
          ],
        },
        include: woundTrackingInclude,
        orderBy: { createdAt: 'desc' },
      });
    }

    return sendSuccess(res, trackings, 'Wound trackings fetched');
  } catch (e) {
    console.error('Error fetching elderly wound trackings:', e);
    return sendError(res, 'Internal server error', 500);
  }
};

// POST /elderly/:elderlyId/wound-tracking
export const addElderlyWoundTracking = async (req, res) => {
  const elderlyId = Number(req.params.elderlyId);
  const { notes } = req.body;
  const isResolved = req.body.isResolved === 'true' || req.body.isResolved === true;

  try {
    const elderly = await prisma.elderly.findUnique({ where: { id: elderlyId } });
    if (!elderly) return sendError(res, 'Elderly not found', 404);

    const { role, institutionId: userInstitutionId, userId } = req.user;
    const hasAccess =
      role === UserRole.PROGRAMMER ||
      elderly.institutionId === userInstitutionId ||
      (role === UserRole.CLINICIAN && await checkClinicianAccess(userId, elderlyId));

    if (!hasAccess) return sendError(res, 'Forbidden', 403);

    if (!notes?.trim() && !req.file && !isResolved) {
      return sendError(res, 'Add notes, a photo, or mark the wound as resolved', 400);
    }

    const tracking = await prisma.woundTracking.create({
      data: {
        elderlyId,
        createdByUserId: req.user.userId,
        notes: notes?.trim() || null,
        photoUrl: req.file ? req.file.filename : null,
        isResolved,
      } as any,
      include: woundTrackingInclude,
    });

    return sendSuccess(res, tracking, 'Wound tracking added', 201);
  } catch (e) {
    console.error('Error adding elderly wound tracking:', e);
    return sendError(res, 'Internal server error', 500);
  }
};

// DELETE /wound-tracking/:trackingId
export const deleteWoundTracking = async (req, res) => {
  const trackingId = Number(req.params.trackingId);

  try {
    const tracking = await prisma.woundTracking.findUnique({
      where: { id: trackingId },
      include: {
        fallOccurrence: { include: { elderly: true } },
        sosOccurrence:  { include: { elderly: true } },
        elderly:        true,
      },
    });

    if (!tracking) return sendError(res, 'Wound tracking not found', 404);

    const institutionId =
      tracking.fallOccurrence?.elderly.institutionId ??
      tracking.sosOccurrence?.elderly.institutionId ??
      tracking.elderly?.institutionId;

    if (institutionId !== req.user.institutionId) return sendError(res, 'Forbidden', 403);

    await prisma.woundTracking.delete({ where: { id: trackingId } });
    return sendSuccess(res, null, 'Wound tracking deleted');
  } catch (e) {
    console.error('Error deleting wound tracking:', e);
    return sendError(res, 'Internal server error', 500);
  }
};

export const getInstitutionWoundOverview = async (req, res) => {
  const { role, institutionId, userId } = req.user;

  try {
    if (!institutionId && role !== UserRole.PROGRAMMER) {
      return sendError(res, 'Institution id not found on the request', 400);
    }

    let allowedElderlyIds: number[] | undefined;

    if (role === UserRole.CLINICIAN) {
      allowedElderlyIds = await getApprovedClinicianElderlyIds(userId);
      if (!allowedElderlyIds.length) {
        return sendSuccess(res, { openCount: 0, resolvedCount: 0, cases: [] }, 'Institution wound overview fetched');
      }
    }

    const elderlyWhere = {
      institutionId,
      ...(allowedElderlyIds ? { id: { in: allowedElderlyIds } } : {}),
    };

    const [fallOccurrences, sosOccurrences] = await Promise.all([
      prisma.fallOccurrence.findMany({
        where: {
          elderly: elderlyWhere,
          injured: true,
          isFalseAlarm: false,
        },
        include: {
          elderly: { include: { user: { select: { avatarUrl: true } } } },
          woundTrackings: latestTrackingInclude,
        },
        orderBy: { date: 'desc' },
      }),
      prisma.sosOccurrence.findMany({
        where: {
          elderly: elderlyWhere,
          injured: true,
          isFalseAlarm: false,
        },
        include: {
          elderly: { include: { user: { select: { avatarUrl: true } } } },
          woundTrackings: latestTrackingInclude,
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    const cases = [
      ...fallOccurrences.map((occurrence) => buildWoundCase('fall', occurrence)),
      ...sosOccurrences.map((occurrence) => buildWoundCase('sos', occurrence)),
    ].sort((left, right) => {
      if (left.isResolved !== right.isResolved) {
        return Number(left.isResolved) - Number(right.isResolved);
      }

      return new Date(right.referenceDate).getTime() - new Date(left.referenceDate).getTime();
    });

    return sendSuccess(res, {
      openCount: cases.filter((item) => !item.isResolved).length,
      resolvedCount: cases.filter((item) => item.isResolved).length,
      cases,
    }, 'Institution wound overview fetched');
  } catch (e) {
    console.error('Error fetching institution wound overview:', e);
    return sendError(res, 'Internal server error', 500);
  }
};

async function checkClinicianAccess(userId: number, elderlyId: number): Promise<boolean> {
  const clinician = await prisma.clinician.findUnique({ where: { userId } });
  if (!clinician) return false;
  const req = await prisma.dataAccessRequest.findUnique({
    where: { clinicianId_elderlyId: { clinicianId: clinician.id, elderlyId } },
  });
  return req?.status === DataAccessRequestStatus.APPROVED;
}

async function getApprovedClinicianElderlyIds(userId: number): Promise<number[]> {
  const clinician = await prisma.clinician.findUnique({ where: { userId } });
  if (!clinician) return [];

  const requests = await prisma.dataAccessRequest.findMany({
    where: {
      clinicianId: clinician.id,
      status: DataAccessRequestStatus.APPROVED,
    },
    select: { elderlyId: true },
  });

  return requests.map((request) => request.elderlyId);
}

function buildWoundCase(occurrenceType: 'fall' | 'sos', occurrence: any) {
  const latestTracking = occurrence.woundTrackings?.[0] ?? null;

  return {
    occurrenceType,
    occurrenceId: occurrence.id,
    occurrenceDate: occurrence.date,
    referenceDate: latestTracking?.createdAt ?? occurrence.date,
    isResolved: latestTracking?.isResolved ?? false,
    injuryDescription: occurrence.injuryDescription ?? null,
    measuresTaken: occurrence.measuresTaken ?? null,
    latestTracking,
    elderly: {
      id: occurrence.elderly.id,
      name: occurrence.elderly.name,
      avatarUrl: occurrence.elderly.user?.avatarUrl ?? null,
    },
  };
}
