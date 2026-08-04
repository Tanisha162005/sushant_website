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
      
    return NextResponse.json({ success: true, data: publishedDbCourses });
  } catch (error) {
    logger.error('Error fetching public courses from DB:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch courses', data: [] }, { status: 500 });
  }
}
