import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses, payments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import path from 'path';

// Protected download — verifies payment before serving file
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: courseId } = await params;

    // Get the userId from query params (set by frontend after payment)
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    // 1. Check that a successful payment exists for this user + course
    const [payment] = await db.select()
      .from(payments)
      .where(
        and(
          eq(payments.userId, userId),
          eq(payments.courseId, courseId),
          eq(payments.status, 'successful')
        )
      )
      .limit(1);

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'You have not purchased this course. Please complete payment first.' },
        { status: 403 }
      );
    }

    // 2. Get the course and its download URL
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);

    if (!course || !course.downloadUrl) {
      return NextResponse.json(
        { success: false, message: 'Course content is not available for download yet.' },
        { status: 404 }
      );
    }

    // 3. Extract filename from the downloadUrl and serve the file
    const fileName = course.downloadUrl.split('/').pop();
    if (!fileName) {
      return NextResponse.json({ success: false, message: 'Invalid file reference' }, { status: 500 });
    }

    const filePath = path.join(process.cwd(), 'uploads', 'courses', fileName);

    try {
      const fileBuffer = await readFile(filePath);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${course.title.replace(/[^a-zA-Z0-9]/g, '_')}_course.zip"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } catch (fileErr) {
      return NextResponse.json(
        { success: false, message: 'Course file not found on server.' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ success: false, message: 'Download failed' }, { status: 500 });
  }
}
