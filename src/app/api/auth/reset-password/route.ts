import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { UserRepository } from '@/repositories/user.repository';
import { PasswordResetRepository } from '@/repositories/password-reset.repository';
import { logger } from '@/lib/logger';

const userRepo = new UserRepository();
const resetRepo = new PasswordResetRepository();

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
      logger.info('Invalid or expired reset token attempt');
      return NextResponse.json(
        { success: false, message: 'This password reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify the user still exists
    const user = await userRepo.findById(resetRecord.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'This password reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password with bcrypt (matching existing registration flow)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password + set passwordChangedAt
    await userRepo.updatePassword(user.id, hashedPassword);

    // Mark this token as used (single-use enforcement)
    await resetRepo.markTokenUsed(resetRecord.id);

    // Invalidate all other reset tokens for this user
    await resetRepo.invalidateAllForUser(user.id);

    logger.info('Password reset completed', { userId: user.id });

    // Clear user_token cookie to force re-login with new password
    const response = NextResponse.json(
      { success: true, message: 'Your password has been reset successfully. Please log in with your new password.' },
      { status: 200 }
    );
    response.cookies.delete('user_token');

    return response;
  } catch (error) {
    logger.error('Reset password error');
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
