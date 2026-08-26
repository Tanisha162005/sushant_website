import { db } from '@/db';
import { passwordResetTokens } from '@/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';

export class PasswordResetRepository {
  /**
   * Store a hashed reset token. Invalidates all previous unused tokens for the same user.
   */
  async createToken(userId: string, tokenHash: string, expiresAt: Date) {
    // Invalidate any previous unused tokens for this user
    await this.invalidateAllForUser(userId);

    const result = await db.insert(passwordResetTokens).values({
      userId,
      tokenHash,
      expiresAt,
    }).returning();
    return result[0];
  }

  /**
   * Find a valid (not expired, not used) token by its hash.
   */
  async findValidToken(tokenHash: string) {
    const now = new Date();
    const result = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          gt(passwordResetTokens.expiresAt, now),
          isNull(passwordResetTokens.usedAt)
        )
      )
      .limit(1);
    return result[0] || null;
  }

  /**
   * Mark a token as used (single-use enforcement).
   */
  async markTokenUsed(tokenId: string) {
    await db.update(passwordResetTokens).set({
      usedAt: new Date(),
    }).where(eq(passwordResetTokens.id, tokenId));
  }

  /**
   * Invalidate all unused tokens for a user (called on new reset request or successful reset).
   */
  async invalidateAllForUser(userId: string) {
    await db.update(passwordResetTokens).set({
      usedAt: new Date(),
    }).where(
      and(
        eq(passwordResetTokens.userId, userId),
        isNull(passwordResetTokens.usedAt)
      )
    );
  }
}
