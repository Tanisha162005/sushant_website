import { NextResponse } from 'next/server';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET published courses for the public frontend
export async function GET() {
  try {
    const publishedCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.status, 'published'));
      
    return NextResponse.json({ success: true, data: publishedCourses });
  } catch (error) {
    console.error('Error fetching public courses:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}
