import { Response, NextFunction, RequestHandler } from "express";
import { AuthenticatedRequest } from "../constants/AuthenticatedRequest";
import { verifyAccessToken } from "../utils/verifyToken";
import { UserRole } from "moveplus-shared";
import prisma from "../prisma";

const getInstitutionIdFromDb = async (userId: number, role: UserRole): Promise<number | undefined> => {
  switch (role) {
    case UserRole.CLINICIAN: {
      const r = await prisma.clinician.findFirst({ where: { userId }, select: { institutionId: true } });
      return r?.institutionId ?? undefined;
    }
    case UserRole.CAREGIVER: {
      const r = await prisma.caregiver.findFirst({ where: { userId }, select: { institutionId: true } });
      return r?.institutionId ?? undefined;
    }
    case UserRole.INSTITUTION_ADMIN: {
      const r = await prisma.institutionAdmin.findFirst({ where: { userId }, select: { institutionId: true } });
      return r?.institutionId ?? undefined;
    }
    case UserRole.ELDERLY: {
      const r = await prisma.elderly.findFirst({ where: { userId }, select: { institutionId: true } });
      return r?.institutionId ?? undefined;
    }
    default:
      return undefined;
  }
};

export const authenticate: RequestHandler = async (req: AuthenticatedRequest, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Authentication token missing' });
    return
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return
  }

  req.user = decoded;

  // If institutionId is missing from the token (stale token issued before profile was linked
  // to an institution), fall back to a DB lookup so the request doesn't fail.
  if (!req.user.institutionId && req.user.role !== UserRole.PROGRAMMER) {
    const institutionId = await getInstitutionIdFromDb(req.user.userId, req.user.role);
    if (institutionId) {
      req.user = { ...req.user, institutionId };
    }
  }

  next();
};

export const authorizeRoles = (requiredRoles: UserRole[]): RequestHandler => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return
    }

    if (!requiredRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden: Insufficient role' });
      return
    }

    next();
  };
};

export const authorizeSameInstitution: RequestHandler = (req: AuthenticatedRequest, res, next) => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return
  }

  if (req.user.role === UserRole.PROGRAMMER) {
    next();
    return
  }

  const requestedInstitutionId = parseInt(req.params.institutionId as string) || req.body.institution_id;

  if (!requestedInstitutionId) {
    next();
    return
  }

  if (req.user.institutionId !== requestedInstitutionId) {
    res.status(403).json({ message: 'Forbidden: You do not belong to this institution' });
    return
  }

  next();
};