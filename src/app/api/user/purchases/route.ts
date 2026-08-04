import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses, payments, courseAssets, courseLessons } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('user_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, data: [] }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    if (!userId) {
      return NextResponse.json({ success: false, data: [] }, { status: 401 });
    }

    // Get purchased courses
    const userPurchases = await db
      .select({ course: courses })
      .from(payments)
      .innerJoin(courses, eq(payments.courseId, courses.id))
      .where(and(eq(payments.userId, userId), eq(payments.status, 'successful')));

    const purchasedCourses = userPurchases.map(p => p.course);

    // Enrich each course with lessons and assets
    const enriched = await Promise.all(
      purchasedCourses.map(async (course) => {
        const [lessons, assets] = await Promise.all([
          db
            .select()
            .from(courseLessons)
            .where(eq(courseLessons.courseId, course.id))
            .orderBy(asc(courseLessons.displayOrder)),
          db
            .select()
            .from(courseAssets)
            .where(eq(courseAssets.courseId, course.id)),
        ]);

        return {
          ...course,
          lessons: lessons.map(l => ({
            id: l.id,
            title: l.title,
            description: l.description,
            duration: l.duration,
            fileSize: l.fileSize,
            displayOrder: l.displayOrder,
          })),
          assets: assets
            .filter(a => a.assetType === 'pdf' || a.assetType === 'zip')
            .map(a => ({
              assetType: a.assetType,
              filename: a.filename,
              size: a.size,
            })),
        };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error fetching purchased courses:', error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
