import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses, payments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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

    // Join payments and courses to get purchased courses for this user
    const userPurchases = await db
      .select({
        course: courses
      })
      .from(payments)
      .innerJoin(courses, eq(payments.courseId, courses.id))
      .where(and(eq(payments.userId, userId), eq(payments.status, 'successful')));

    // Extract just the course objects
    const purchasedCourses = userPurchases.map(p => p.course);

    return NextResponse.json({ success: true, data: purchasedCourses });
  } catch (error) {
    console.error('Error fetching purchased courses:', error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
