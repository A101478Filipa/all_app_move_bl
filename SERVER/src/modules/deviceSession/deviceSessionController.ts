import prisma from '../../prisma';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { UserRole, DEVICE_SESSION_BYTES_PER_SAMPLE, DEVICE_SESSION_DEFAULT_SAMPLE_RATE_HZ } from 'moveplus-shared';

const STAFF_ROLES = [UserRole.CAREGIVER, UserRole.INSTITUTION_ADMIN, UserRole.CLINICIAN, UserRole.PROGRAMMER];

const canViewSession = async (req, elderlyId: number) => {
  const user = req.user;
  if (!user) return false;
  if (user.role === UserRole.PROGRAMMER) return true;
  const elderly = await prisma.elderly.findUnique({
    where: { id: elderlyId },
    select: { id: true, institutionId: true, userId: true },
  });
  if (!elderly) return false;
  if (user.role === UserRole.ELDERLY) return user.userId === elderly.userId;
  return STAFF_ROLES.includes(user.role) && user.institutionId === elderly.institutionId;
};

const SESSION_LIST_SELECT = {
  id: true,
  elderlyId: true,
  createdById: true,
  fileName: true,
  collectionType: true,
  collectionCode: true,
  trialNumber: true,
  sampleRateHz: true,
  sampleCount: true,
  fileSizeBytes: true,
  durationSeconds: true,
  startedAt: true,
  endedAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, username: true, email: true } },
} as const;

// POST /api/elderly/:elderlyId/device-sessions   (multipart: file=payload + JSON fields)
export const createDeviceSession = async (req, res) => {
  try {
    const elderlyId = Number(req.params.elderlyId);
    if (!Number.isFinite(elderlyId)) return sendError(res, 'Invalid elderly id', 400);

    if (!req.file || !req.file.buffer) {
      return sendError(res, 'Missing payload file (multipart field "payload")', 400);
    }
    if (!STAFF_ROLES.includes(req.user.role)) {
      return sendError(res, 'Forbidden', 403);
    }

    const allowed = await canViewSession(req, elderlyId);
    if (!allowed) return sendError(res, 'Forbidden', 403);

    const buf: Buffer = req.file.buffer;
    const fileSizeBytes = buf.length;
    if (fileSizeBytes === 0) return sendError(res, 'Empty payload', 400);
    if (fileSizeBytes % DEVICE_SESSION_BYTES_PER_SAMPLE !== 0) {
      return sendError(res, `Payload size ${fileSizeBytes} is not a multiple of ${DEVICE_SESSION_BYTES_PER_SAMPLE}`, 400);
    }
    const sampleCount = fileSizeBytes / DEVICE_SESSION_BYTES_PER_SAMPLE;

    const fileName       = String(req.body.fileName ?? '').trim();
    const collectionType = String(req.body.collectionType ?? '').trim();
    const collectionCode = String(req.body.collectionCode ?? '').trim().toUpperCase();
    const trialNumber    = parseInt(req.body.trialNumber, 10);
    const sampleRateHz   = parseInt(req.body.sampleRateHz, 10) || DEVICE_SESSION_DEFAULT_SAMPLE_RATE_HZ;
    const startedAt      = new Date(req.body.startedAt);
    const endedAt        = new Date(req.body.endedAt);
    const durationSeconds = Number.parseFloat(req.body.durationSeconds);
    const notes          = req.body.notes ? String(req.body.notes).slice(0, 500) : null;

    if (!fileName || !collectionType || !collectionCode) {
      return sendError(res, 'fileName, collectionType and collectionCode are required', 400);
    }
    if (!Number.isFinite(trialNumber) || trialNumber < 1) {
      return sendError(res, 'trialNumber must be a positive integer', 400);
    }
    if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
      return sendError(res, 'Invalid startedAt/endedAt', 400);
    }
    if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
      return sendError(res, 'Invalid durationSeconds', 400);
    }

    const created = await prisma.deviceSession.create({
      data: {
        elderlyId,
        createdById: req.user.userId,
        fileName,
        collectionType,
        collectionCode,
        trialNumber,
        sampleRateHz,
        sampleCount,
        fileSizeBytes,
        durationSeconds,
        startedAt,
        endedAt,
        notes,
        payload: new Uint8Array(buf),
      },
      select: SESSION_LIST_SELECT,
    });

    return sendSuccess(res, created, 'Device session stored', 201);
  } catch (err) {
    console.error('createDeviceSession error', err);
    return sendError(res, 'Internal server error', 500);
  }
};

// GET /api/elderly/:elderlyId/device-sessions
export const listDeviceSessionsForElderly = async (req, res) => {
  try {
    const elderlyId = Number(req.params.elderlyId);
    if (!Number.isFinite(elderlyId)) return sendError(res, 'Invalid elderly id', 400);
    const allowed = await canViewSession(req, elderlyId);
    if (!allowed) return sendError(res, 'Forbidden', 403);

    const sessions = await prisma.deviceSession.findMany({
      where: { elderlyId },
      orderBy: { startedAt: 'desc' },
      select: SESSION_LIST_SELECT,
    });
    return sendSuccess(res, sessions, 'OK');
  } catch (err) {
    console.error('listDeviceSessionsForElderly error', err);
    return sendError(res, 'Internal server error', 500);
  }
};

// GET /api/device-sessions/:id
export const getDeviceSession = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, 'Invalid id', 400);

    const session = await prisma.deviceSession.findUnique({
      where: { id },
      select: SESSION_LIST_SELECT,
    });
    if (!session) return sendError(res, 'Not found', 404);
    const allowed = await canViewSession(req, session.elderlyId);
    if (!allowed) return sendError(res, 'Forbidden', 403);

    return sendSuccess(res, session, 'OK');
  } catch (err) {
    console.error('getDeviceSession error', err);
    return sendError(res, 'Internal server error', 500);
  }
};

// GET /api/device-sessions/:id/raw  (binary download)
export const downloadDeviceSessionRaw = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, 'Invalid id', 400);

    const session = await prisma.deviceSession.findUnique({
      where: { id },
      select: { id: true, elderlyId: true, fileName: true, payload: true, fileSizeBytes: true },
    });
    if (!session) return sendError(res, 'Not found', 404);
    const allowed = await canViewSession(req, session.elderlyId);
    if (!allowed) return sendError(res, 'Forbidden', 403);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', String(session.fileSizeBytes));
    res.setHeader('Content-Disposition', `attachment; filename="${session.fileName}.bin"`);
    return res.end(Buffer.from(session.payload));
  } catch (err) {
    console.error('downloadDeviceSessionRaw error', err);
    return sendError(res, 'Internal server error', 500);
  }
};

// GET /api/device-sessions/:id/csv   (CSV generated from binary)
export const downloadDeviceSessionCsv = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, 'Invalid id', 400);

    const session = await prisma.deviceSession.findUnique({
      where: { id },
      select: { id: true, elderlyId: true, fileName: true, sampleRateHz: true, payload: true },
    });
    if (!session) return sendError(res, 'Not found', 404);
    const allowed = await canViewSession(req, session.elderlyId);
    if (!allowed) return sendError(res, 'Forbidden', 403);

    const csv = bufferToCsv(Buffer.from(session.payload), session.sampleRateHz);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${session.fileName}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error('downloadDeviceSessionCsv error', err);
    return sendError(res, 'Internal server error', 500);
  }
};

/**
 * GET /api/device-sessions/:id/samples?from=&to=&max=
 *
 * Returns a JSON array of samples optionally decimated to at most `max`
 * points (default 500). Used by the chart screen so we don't ship 100 Hz × N
 * seconds to a mobile device.
 */
export const getDeviceSessionSamples = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, 'Invalid id', 400);

    const session = await prisma.deviceSession.findUnique({
      where: { id },
      select: { id: true, elderlyId: true, sampleRateHz: true, sampleCount: true, payload: true },
    });
    if (!session) return sendError(res, 'Not found', 404);
    const allowed = await canViewSession(req, session.elderlyId);
    if (!allowed) return sendError(res, 'Forbidden', 403);

    const total = session.sampleCount;
    const from = clamp(parseInt(req.query.from as string, 10) || 0, 0, total);
    const to   = clamp(parseInt(req.query.to as string, 10) || total, from, total);
    const max  = clamp(parseInt(req.query.max as string, 10) || 500, 10, 5000);

    const samples = decimateSamples(Buffer.from(session.payload), session.sampleRateHz, from, to, max);
    return sendSuccess(res, {
      sampleRateHz: session.sampleRateHz,
      totalSamples: total,
      from,
      to,
      returned: samples.length,
      samples,
    }, 'OK');
  } catch (err) {
    console.error('getDeviceSessionSamples error', err);
    return sendError(res, 'Internal server error', 500);
  }
};

// DELETE /api/device-sessions/:id
export const deleteDeviceSession = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return sendError(res, 'Invalid id', 400);

    const session = await prisma.deviceSession.findUnique({
      where: { id },
      select: { id: true, elderlyId: true, createdById: true },
    });
    if (!session) return sendError(res, 'Not found', 404);

    const allowedToView = await canViewSession(req, session.elderlyId);
    if (!allowedToView) return sendError(res, 'Forbidden', 403);

    const isCreator = req.user.userId === session.createdById;
    const isAdmin   = req.user.role === UserRole.INSTITUTION_ADMIN || req.user.role === UserRole.PROGRAMMER;
    if (!isCreator && !isAdmin) {
      return sendError(res, 'Only the creator or an institution admin can delete this session', 403);
    }

    await prisma.deviceSession.delete({ where: { id } });
    return sendSuccess(res, { id }, 'Deleted');
  } catch (err) {
    console.error('deleteDeviceSession error', err);
    return sendError(res, 'Internal server error', 500);
  }
};

// ---------- helpers ----------
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function decimateSamples(payload: Buffer, sampleRateHz: number, from: number, to: number, max: number) {
  const range = to - from;
  if (range <= 0) return [];
  const step = Math.max(1, Math.ceil(range / max));
  const out: Array<{
    i: number; t: number;
    ax: number; ay: number; az: number;
    gx: number; gy: number; gz: number;
  }> = [];
  for (let i = from; i < to; i += step) {
    const offset = i * DEVICE_SESSION_BYTES_PER_SAMPLE;
    out.push({
      i,
      t: i / sampleRateHz,
      ax: payload.readFloatLE(offset + 0),
      ay: payload.readFloatLE(offset + 4),
      az: payload.readFloatLE(offset + 8),
      gx: payload.readFloatLE(offset + 12),
      gy: payload.readFloatLE(offset + 16),
      gz: payload.readFloatLE(offset + 20),
    });
  }
  return out;
}

function bufferToCsv(payload: Buffer, sampleRateHz: number): string {
  const total = Math.floor(payload.length / DEVICE_SESSION_BYTES_PER_SAMPLE);
  const lines: string[] = ['t_seconds,ax,ay,az,gx,gy,gz'];
  for (let i = 0; i < total; i++) {
    const off = i * DEVICE_SESSION_BYTES_PER_SAMPLE;
    const t  = (i / sampleRateHz).toFixed(4);
    const ax = payload.readFloatLE(off + 0);
    const ay = payload.readFloatLE(off + 4);
    const az = payload.readFloatLE(off + 8);
    const gx = payload.readFloatLE(off + 12);
    const gy = payload.readFloatLE(off + 16);
    const gz = payload.readFloatLE(off + 20);
    lines.push(`${t},${ax},${ay},${az},${gx},${gy},${gz}`);
  }
  return lines.join('\n');
}
