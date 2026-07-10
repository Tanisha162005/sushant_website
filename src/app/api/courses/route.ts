import { NextResponse } from 'next/server';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET published courses for the public frontend
export async function GET() {
  try {
    const publishedCourses = await db.select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      price: courses.price,
      originalPrice: courses.originalPrice,
      imageUrl: courses.imageUrl,
      category: courses.category,
      downloadUrl: courses.downloadUrl, // frontend uses this to know if downloads are available
    })
    .from(courses)
    .where(eq(courses.status, 'published'));

    return NextResponse.json({ success: true, data: publishedCourses });
  } catch (error) {
    console.error('Error fetching public courses:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}
