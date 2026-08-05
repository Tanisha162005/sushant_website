import { NextResponse } from 'next/server';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET published courses for the public frontend
export async function GET() {
  try {
    const publishedDbCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.status, 'published'));

    // Transform imageUrl from R2 object keys to proxy URLs
    const coursesWithThumbnails = publishedDbCourses.map((course) => ({
      ...course,
      imageUrl: course.imageUrl
        ? (course.imageUrl.startsWith('http')
          ? course.imageUrl
          : `/api/courses/${course.id}/thumbnail`)
        : null,
    }));

    return NextResponse.json({ success: true, data: coursesWithThumbnails });

  } catch (error) {
    logger.error('Error fetching public courses from DB:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch courses', data: [] }, { status: 500 });
  }
}
