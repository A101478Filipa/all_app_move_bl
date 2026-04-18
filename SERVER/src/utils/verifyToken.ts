import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from '../constants/AuthenticatedUser';

export const verifyAccessToken = (token: string): AuthenticatedUser | null => {
  const processedToken = token && token.split(' ').pop();

  try {
    return jwt.verify(processedToken, process.env.JWT_ACCESS_TOKEN_SECRET) as AuthenticatedUser;
  } catch (error) {
    return null;
  };
};

export const verifyRefreshToken = (token: string): AuthenticatedUser | null => {
  const processedToken = token && token.split(' ').pop();

  try {
    return jwt.verify(processedToken, process.env.JWT_REFRESH_TOKEN_SECRET) as AuthenticatedUser;
  } catch (error) {
    return null;
  };
};