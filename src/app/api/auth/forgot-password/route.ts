import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { UserRepository } from '@/repositories/user.repository';
import { PasswordResetRepository } from '@/repositories/password-reset.repository';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const userRepo = new UserRepository();
const resetRepo = new PasswordResetRepository();

const RESET_TOKEN_EXPIRY_MINUTES = 30;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sushantghadge.com';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: true, message: 'If an account exists with this email, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Rate limit by email (5 per 15 min)
    const emailRL = await rateLimit(`forgot-pw:email:${cleanEmail}`, 5, 900);
    if (!emailRL.success) {
      // Still return generic message to avoid enumeration
      return NextResponse.json(
        { success: true, message: 'If an account exists with this email, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    // Rate limit by IP (10 per 15 min)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const ipRL = await rateLimit(`forgot-pw:ip:${ip}`, 10, 900);
    if (!ipRL.success) {
      return NextResponse.json(
        { success: true, message: 'If an account exists with this email, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    // Generic response for all cases (email enumeration protection)
    const genericResponse = NextResponse.json(
      { success: true, message: 'If an account exists with this email, a password reset link has been sent.' },
      { status: 200 }
    );

    // Look up user
    const user = await userRepo.findByEmail(cleanEmail);

    if (!user) {
      // Add artificial delay to match timing of the success path
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      logger.info('Password reset requested for non-existent email');
      return genericResponse;
    }

    // Generate cryptographically secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Store hashed token with expiry
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
    await resetRepo.createToken(user.id, tokenHash, expiresAt);

    // Build reset URL (only rawToken goes to the user, never the hash)
    const resetUrl = `${APP_URL}/reset-password?token=${rawToken}`;

    // Send email (non-blocking — if it fails, we log but still return generic response)
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      expiresInMinutes: RESET_TOKEN_EXPIRY_MINUTES,
    });

    if (!emailResult.success) {
      logger.error('Failed to send password reset email', { userId: user.id });
    } else {
      logger.info('Password reset initiated', { userId: user.id });
    }

    return genericResponse;
  } catch (error) {
    logger.error('Forgot password error');
    return NextResponse.json(
      { success: true, message: 'If an account exists with this email, a password reset link has been sent.' },
      { status: 200 }
    );
  }
}
