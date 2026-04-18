import jwt from 'jsonwebtoken';
import { UserRole } from 'moveplus-shared';
import { AuthenticatedUser } from '../constants/AuthenticatedUser';

export const generateAccessToken = (userId: number, role: UserRole, institutionId?: number): string => {
  const payload: AuthenticatedUser = { userId, role, institutionId }

  const secret = process.env.JWT_ACCESS_TOKEN_SECRET;
  if (!secret) throw Error('Missing JWT_ACCESS_TOKEN_SECRET environment variable')

  return jwt.sign(
    payload,
    secret,
    { expiresIn: '1h' }
  );
};

export const generateRefreshToken = (userId: number): string => {
  const payload = { userId }

  const secret = process.env.JWT_REFRESH_TOKEN_SECRET;
  if (!secret) throw Error('Missing JWT_REFRESH_TOKEN_SECRET environment variable')

  return jwt.sign(
    payload,
    secret,
    { expiresIn: '7d' }
  );
};

export const verifyAccessToken = (token: string): AuthenticatedUser => {
  const secret = process.env.JWT_ACCESS_TOKEN_SECRET;
  if (!secret) throw Error('Missing JWT_ACCESS_TOKEN_SECRET environment variable');

  return jwt.verify(token, secret) as AuthenticatedUser;
};

export const verifyRefreshToken = (token: string): { userId: number } => {
  const secret = process.env.JWT_REFRESH_TOKEN_SECRET;
  if (!secret) throw Error('Missing JWT_REFRESH_TOKEN_SECRET environment variable');

  return jwt.verify(token, secret) as { userId: number };
};

export const createRefreshTokenExpiry = (): Date => {
  const expiryTime = new Date();
  expiryTime.setDate(expiryTime.getDate() + 7);
  return expiryTime;
};