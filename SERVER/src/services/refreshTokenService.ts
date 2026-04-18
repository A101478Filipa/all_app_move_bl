import prisma from '../prisma';
import { generateRefreshToken, verifyRefreshToken, createRefreshTokenExpiry } from '../utils/generateToken';

export class RefreshTokenService {
  /**
   * Create and store a refresh token for a user
   */
  static async createRefreshToken(userId: number): Promise<string> {
    const token = generateRefreshToken(userId);
    const expiresAt = createRefreshTokenExpiry();

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Verify and validate a refresh token
   */
  static async validateRefreshToken(token: string): Promise<{ userId: number } | null> {
    try {
      const decoded = verifyRefreshToken(token);

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!storedToken) {
        return null;
      }

      if (storedToken.expiresAt < new Date()) {
        await this.revokeRefreshToken(token);
        return null;
      }

      return { userId: storedToken.userId };
    } catch (error) {
      console.error('Error validating refresh token:', error);
      return null;
    }
  }

  /**
   * Revoke a specific refresh token
   */
  static async revokeRefreshToken(token: string): Promise<void> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: { token },
      });

      if (result.count === 0) {
        console.log('Token not found for revocation (already expired or deleted):', token);
      }
    } catch (error) {
      console.error('Error revoking refresh token:', error);
    }
  }

  /**
   * Revoke all refresh tokens for a user (useful for logout all devices)
   */
  static async revokeAllUserTokens(userId: number): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Clean up expired tokens (should be run periodically)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Get all active refresh tokens for a user (for admin purposes)
   */
  static async getUserTokens(userId: number): Promise<any[]> {
    return await prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }
}