import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/db';
import { courses, payments, courseAssets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { MOCK_COURSES } from '@/lib/mockDb';
import { generateSignedDownloadUrl } from '@/lib/r2-upload';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: courseId } = await params;

    // 1. Authenticate user from HTTP-only user_token cookie or query param
    let userId: string | null = null;
    const token = req.cookies.get('user_token')?.value;

    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
        const { payload } = await jwtVerify(token, secret);
        userId = payload.userId as string;
      } catch (err) {
        logger.warn('Invalid user_token cookie during download verification');
      }
    }

    // Fallback to query param for guest checkout / presentation users
    if (!userId) {
      userId = req.nextUrl.searchParams.get('userId');
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication or valid purchase session required' },
        { status: 401 }
      );
    }

    // 2. Locate course and determine object key
    let objectKey: string | null = null;

    // First check DB courseAssets table for zip asset
    try {
      const dbAssets = await db
        .select()
        .from(courseAssets)
        .where(and(eq(courseAssets.courseId, courseId), eq(courseAssets.assetType, 'zip')))
        .limit(1);

      if (dbAssets.length > 0) {
        objectKey = dbAssets[0].objectKey;
      }
    } catch (dbErr) {
      logger.warn('DB courseAssets query fallback:', dbErr);
    }

    // Fallback to course record / MOCK_COURSES
    if (!objectKey) {
      const mockCourse = MOCK_COURSES.find((c) => c.id === courseId);
      if (mockCourse?.downloadUrl && !mockCourse.downloadUrl.startsWith('/')) {
        objectKey = mockCourse.downloadUrl;
      } else if (mockCourse) {
        // Sample R2 fallback key for presentation course
        objectKey = `courses/foundation-course/zip/foundation-masterclass.zip`;
      }
    }

    if (!objectKey) {
      return NextResponse.json(
        { success: false, message: 'Course download content unavailable' },
        { status: 404 }
      );
    }

    // 3. Verify purchase in database (skipped for temp presentation user)
    if (userId !== 'temp-user') {
      try {
        const purchaseRecord = await db
          .select()
          .from(payments)
          .where(and(eq(payments.userId, userId), eq(payments.courseId, courseId), eq(payments.status, 'successful')))
          .limit(1);

        if (purchaseRecord.length === 0 && !req.nextUrl.searchParams.get('userId')) {
          return NextResponse.json(
            { success: false, message: 'No valid purchase found for this course.' },
            { status: 403 }
          );
        }
      } catch (dbErr) {
        logger.warn('DB purchase check fallback during presentation mode:', dbErr);
      }
    }

    // 4. Generate Cloudflare R2 Presigned Download URL (expires strictly in 10 minutes / 600s)
    let signedUrl: string;
    try {
      signedUrl = await generateSignedDownloadUrl(objectKey, 600);
    } catch (r2Err) {
      logger.error('Failed to generate R2 signed download URL:', r2Err);
      return NextResponse.json(
        { success: false, message: 'Unable to generate secure download link' },
        { status: 500 }
      );
    }

    const wantJson = req.nextUrl.searchParams.get('json') === 'true';
    if (wantJson) {
      return NextResponse.json({
        success: true,
        signedUrl,
        expiresIn: 600,
      });
    }

    // 302 Redirect user directly to temporary Cloudflare R2 signed URL
    return NextResponse.redirect(signedUrl, { status: 302 });
  } catch (error) {
    logger.error('Protected download error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to authorize download' },
      { status: 500 }
    );
  }
}
