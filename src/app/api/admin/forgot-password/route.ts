import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { PasswordResetRepository } from '@/repositories/password-reset.repository';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const resetRepo = new PasswordResetRepository();

const ADMIN_ROLES = ['super_admin', 'admin', 'support', 'content_manager', 'finance_manager'];
const RESET_TOKEN_EXPIRY_MINUTES = 30;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sushantghadge.com';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: true, message: 'If an admin account exists with this email, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Rate limit more aggressively for admin (3 per email per 15 min)
    const emailRL = await rateLimit(`admin-forgot-pw:email:${cleanEmail}`, 3, 900);
    if (!emailRL.success) {
      return NextResponse.json(
        { success: true, message: 'If an admin account exists with this email, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    // Rate limit by IP (5 per 15 min)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';
    const ipRL = await rateLimit(`admin-forgot-pw:ip:${ip}`, 5, 900);
    if (!ipRL.success) {
      return NextResponse.json(
        { success: true, message: 'If an admin account exists with this email, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    const genericResponse = NextResponse.json(
      { success: true, message: 'If an admin account exists with this email, a password reset link has been sent.' },
      { status: 200 }
    );

    // Look up admin user in database
    const dbUsers = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    const adminUser = dbUsers[0];

    if (!adminUser || !ADMIN_ROLES.includes(adminUser.role)) {
      // Not an admin — add artificial delay to match timing
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      logger.info('Admin password reset requested for non-admin email');
      return genericResponse;
    }

    // Generate cryptographically secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Store hashed token with expiry
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
    await resetRepo.createToken(adminUser.id, tokenHash, expiresAt);

    // Build admin reset URL
    const resetUrl = `${APP_URL}/admin/reset-password?token=${rawToken}`;

    // Send email
    const emailResult = await sendPasswordResetEmail({
      to: adminUser.email,
      name: adminUser.name,
      resetUrl,
      expiresInMinutes: RESET_TOKEN_EXPIRY_MINUTES,
    });

    if (!emailResult.success) {
      logger.error('Failed to send admin password reset email', { userId: adminUser.id });
    } else {
      logger.info('Admin password reset initiated', { userId: adminUser.id });
    }

    return genericResponse;
  } catch (error) {
    logger.error('Admin forgot password error');
    return NextResponse.json(
      { success: true, message: 'If an admin account exists with this email, a password reset link has been sent.' },
      { status: 200 }
    );
  }
}
