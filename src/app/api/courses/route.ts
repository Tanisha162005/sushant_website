import { NextResponse } from 'next/server';
import { MOCK_COURSES } from '@/lib/mockDb';

export const dynamic = 'force-dynamic';

// GET published courses for the public frontend
export async function GET() {
  try {
    const publishedCourses = MOCK_COURSES.filter(c => c.status === 'published');
    return NextResponse.json({ success: true, data: publishedCourses });
  } catch (error) {
    console.error('Error fetching public courses:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}
