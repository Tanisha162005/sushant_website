import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PasswordResetRepository } from '@/repositories/password-reset.repository';
import { logger } from '@/lib/logger';

const resetRepo = new PasswordResetRepository();

const ADMIN_ROLES = ['super_admin', 'admin', 'support', 'content_manager', 'finance_manager'];
const PASSWORD_MIN_LENGTH = 6;

export async function POST(req: NextRequest) {
  try {
    const { token, password, confirmPassword } = await req.json();

    // Validate inputs
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, message: 'This password reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Password is required.' },
        { status: 400 }
      );
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { success: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.` },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    // Hash the supplied token and look it up
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await resetRepo.findValidToken(tokenHash);

    if (!resetRecord) {
      logger.info('Invalid or expired admin reset token attempt');
      return NextResponse.json(
        { success: false, message: 'This password reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify the user still exists AND is still an admin
    const dbUsers = await db.select().from(users).where(eq(users.id, resetRecord.userId)).limit(1);
    const adminUser = dbUsers[0];

    if (!adminUser || !ADMIN_ROLES.includes(adminUser.role)) {
      return NextResponse.json(
        { success: false, message: 'This password reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password + set passwordChangedAt (does NOT modify role or permissions)
    await db.update(users).set({
      password: hashedPassword,
      passwordChangedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(users.id, adminUser.id));

    // Mark this token as used
    await resetRepo.markTokenUsed(resetRecord.id);

    // Invalidate all other reset tokens for this admin
    await resetRepo.invalidateAllForUser(adminUser.id);

    logger.info('Admin password reset completed', { userId: adminUser.id, role: adminUser.role });

    // Clear admin_token cookie to force re-login
    const response = NextResponse.json(
      { success: true, message: 'Your password has been reset successfully. Please log in with your new password.' },
      { status: 200 }
    );
    response.cookies.delete('admin_token');

    return response;
  } catch (error) {
    logger.error('Admin reset password error');
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
