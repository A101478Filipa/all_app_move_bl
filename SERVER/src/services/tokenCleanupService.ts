import { RefreshTokenService } from './refreshTokenService';

export class TokenCleanupService {
  private static cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Start periodic cleanup of expired tokens
   * @param intervalHours How often to run cleanup (default: 24 hours)
   */
  static startPeriodicCleanup(intervalHours: number = 24): void {
    if (this.cleanupInterval) {
      return;
    }

    const intervalMs = intervalHours * 60 * 60 * 1000;

    this.cleanupInterval = setInterval(async () => {
      try {
        const deletedCount = await RefreshTokenService.cleanupExpiredTokens();
        console.log(`Cleaned up ${deletedCount} expired refresh tokens`);
      } catch (error) {
        console.error('Error during token cleanup:', error);
      }
    }, intervalMs);

    console.log(`Token cleanup scheduled every ${intervalHours} hours`);
  }

  /**
   * Stop periodic cleanup
   */
  static stopPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('Token cleanup stopped');
    }
  }

  /**
   * Run cleanup immediately
   */
  static async runCleanup(): Promise<number> {
    try {
      const deletedCount = await RefreshTokenService.cleanupExpiredTokens();
      console.log(`Cleaned up ${deletedCount} expired refresh tokens`);
      return deletedCount;
    } catch (error) {
      console.error('Error during manual token cleanup:', error);
      return 0;
    }
  }
}