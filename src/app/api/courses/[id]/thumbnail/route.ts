import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateSignedDownloadUrl } from '@/lib/r2-upload';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/courses/[id]/thumbnail
 * 
 * Generates a signed R2 download URL for the course thumbnail
 * and redirects to it. Thumbnails are cached for 1 hour.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db
      .select({ imageUrl: courses.imageUrl })
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1);

    const course = result[0];

    if (!course || !course.imageUrl) {
      return NextResponse.json(
        { success: false, message: 'Thumbnail not found' },
        { status: 404 }
      );
    }

    const objectKey = course.imageUrl;

    // If it's already a full URL (external link), redirect directly
    if (objectKey.startsWith('http://') || objectKey.startsWith('https://')) {
      return NextResponse.redirect(objectKey, { status: 302 });
    }

    // Generate a signed R2 URL (valid for 1 hour)
    const signedUrl = await generateSignedDownloadUrl(objectKey, 3600);

    return NextResponse.redirect(signedUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    logger.error('[Thumbnail] Failed to generate thumbnail URL:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to load thumbnail' },
      { status: 500 }
    );
  }
}
