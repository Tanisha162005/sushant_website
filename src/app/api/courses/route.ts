import { NextResponse } from 'next/server';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { MOCK_COURSES } from '@/lib/mockDb';

export const dynamic = 'force-dynamic';

// GET published courses for the public frontend
export async function GET() {
  try {
    const publishedDbCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.status, 'published'));
      
    if (publishedDbCourses.length > 0) {
      return NextResponse.json({ success: true, data: publishedDbCourses });
    }
  } catch (error) {
    console.warn('DB public courses query fallback to memory:', error);
  }

  const publishedMock = MOCK_COURSES.filter((c) => c.status === 'published');
  return NextResponse.json({ success: true, data: publishedMock });
}
