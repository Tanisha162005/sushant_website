import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/db';
import { courses, payments, courseAssets, courseLessons } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateSignedDownloadUrl } from '@/lib/r2-upload';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: courseId } = await params;

    // 1. Authenticate user strictly from verified server session cookie
    let userId: string | null = null;
    const token = req.cookies.get('user_token')?.value || req.cookies.get('accessToken')?.value;

    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
        const { payload } = await jwtVerify(token, secret);
        userId = payload.userId as string;
      } catch {
        logger.warn('Invalid auth token cookie during download verification');
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required. Please log in.' },
        { status: 401 }
      );
    }

    // 2. Verify purchase in PostgreSQL
    try {
      const purchaseRecord = await db
        .select()
        .from(payments)
        .where(and(eq(payments.userId, userId), eq(payments.courseId, courseId), eq(payments.status, 'successful')))
        .limit(1);

      if (purchaseRecord.length === 0) {
        return NextResponse.json(
          { success: false, message: 'No valid purchase found for this course.' },
          { status: 403 }
        );
      }
    } catch (dbErr) {
      logger.warn('DB purchase check error:', dbErr);
      return NextResponse.json(
        { success: false, message: 'Unable to verify course purchase status.' },
        { status: 500 }
      );
    }

    // 3. Determine what to download
    const lessonId = req.nextUrl.searchParams.get('lessonId');
    const assetType = req.nextUrl.searchParams.get('assetType');
    let objectKey: string | null = null;
    let downloadFilename: string | null = null;

    if (lessonId) {
      // Download a specific lesson video
      const lesson = await db
        .select()
        .from(courseLessons)
        .where(and(eq(courseLessons.id, lessonId), eq(courseLessons.courseId, courseId)))
        .limit(1);

      if (lesson.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Lesson not found' },
          { status: 404 }
        );
      }

      objectKey = lesson[0].videoKey;
      downloadFilename = `${lesson[0].title}.mp4`;
    } else if (assetType === 'pdf' || assetType === 'zip') {
      // Download workbook PDF or resources ZIP
      const asset = await db
        .select()
        .from(courseAssets)
        .where(and(eq(courseAssets.courseId, courseId), eq(courseAssets.assetType, assetType)))
        .limit(1);

      if (asset.length === 0) {
        return NextResponse.json(
          { success: false, message: `${assetType.toUpperCase()} asset not found` },
          { status: 404 }
        );
      }

      objectKey = asset[0].objectKey;
      downloadFilename = asset[0].filename;
    } else {
      // Backward compatibility: default to ZIP download
      const zipAsset = await db
        .select()
        .from(courseAssets)
        .where(and(eq(courseAssets.courseId, courseId), eq(courseAssets.assetType, 'zip')))
        .limit(1);

      if (zipAsset.length > 0) {
        objectKey = zipAsset[0].objectKey;
        downloadFilename = zipAsset[0].filename;
      } else {
        // Fallback: check course.downloadUrl for old-style courses
        const courseRecord = await db
          .select()
          .from(courses)
          .where(eq(courses.id, courseId))
          .limit(1);

        if (courseRecord.length > 0 && courseRecord[0].downloadUrl && !courseRecord[0].downloadUrl.startsWith('/')) {
          objectKey = courseRecord[0].downloadUrl;
        }
      }
    }

    if (!objectKey) {
      return NextResponse.json(
        { success: false, message: 'Download content unavailable' },
        { status: 404 }
      );
    }

    // 4. Generate 10-minute presigned R2 download URL
    let signedUrl: string;
    try {
      signedUrl = await generateSignedDownloadUrl(objectKey, 600, {
        filename: downloadFilename,
        forceDownload: true,
      });
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
        filename: downloadFilename,
        expiresIn: 600,
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0'
        }
      });
    }

    return NextResponse.redirect(signedUrl, { status: 302 });
  } catch (error) {
    logger.error('Protected download error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to authorize download' },
      { status: 500 }
    );
  }
}
