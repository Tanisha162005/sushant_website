import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses, payments, courseAssets, courseLessons } from '@/db/schema';
import { eq, and, asc, inArray } from 'drizzle-orm';
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
    if (purchasedCourses.length === 0) {
      return NextResponse.json({ success: true, data: [] }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      });
    }

    const courseIds = purchasedCourses.map(c => c.id);

    // Fetch all lessons and assets in 2 queries instead of 2 * N queries
    const [allLessons, allAssets] = await Promise.all([
      db
        .select()
        .from(courseLessons)
        .where(inArray(courseLessons.courseId, courseIds))
        .orderBy(asc(courseLessons.displayOrder)),
      db
        .select()
        .from(courseAssets)
        .where(inArray(courseAssets.courseId, courseIds)),
    ]);

    // Enrich each course with lessons and assets
    const enriched = purchasedCourses.map((course) => {
      const lessons = allLessons.filter(l => l.courseId === course.id);
      const assets = allAssets.filter(a => a.courseId === course.id);

      return {
        ...course,
        imageUrl: course.imageUrl
          ? (course.imageUrl.startsWith('http')
            ? course.imageUrl
            : `/api/courses/${course.id}/thumbnail`)
          : null,
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
    });

    return NextResponse.json({ success: true, data: enriched }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (error) {
    console.error('Error fetching purchased courses:', error);
    return NextResponse.json({ success: false, data: [] }, { 
      status: 500,
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  }
}
