import { NextRequest, NextResponse } from 'next/server';
import { LessonRepository } from '@/repositories/lesson.repository';
import { DownloadAuthorizationError } from '@/lib/r2-errors';
import { jwtVerify } from 'jose';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const lessonRepo = new LessonRepository();

async function verifyAdminAuth(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  if (!token) throw new DownloadAuthorizationError('Unauthorized');
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;
    if (!['super_admin', 'admin', 'content_manager'].includes(role)) {
      throw new DownloadAuthorizationError('Forbidden');
    }
  } catch (error) {
    if (error instanceof DownloadAuthorizationError) throw error;
    throw new DownloadAuthorizationError('Invalid admin token');
  }
}

// GET /api/admin/courses/[id]/lessons — List all lessons for a course
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdminAuth(req);
    const { id: courseId } = await params;
    const lessons = await lessonRepo.findByCourseId(courseId);
    return NextResponse.json({ success: true, data: lessons });
  } catch (error) {
    logger.error('Error fetching lessons:', error);
    const msg = error instanceof Error ? error.message : 'Failed to fetch lessons';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// POST /api/admin/courses/[id]/lessons — Create a new lesson
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdminAuth(req);
    const { id: courseId } = await params;
    const body = await req.json();
    const { title, description, videoKey, duration, fileSize } = body;

    if (!title || !videoKey) {
      return NextResponse.json(
        { success: false, message: 'title and videoKey are required' },
        { status: 400 }
      );
    }

    const displayOrder = await lessonRepo.getNextDisplayOrder(courseId);

    const lesson = await lessonRepo.create({
      courseId,
      title,
      description: description || null,
      videoKey,
      duration: duration || null,
      fileSize: fileSize || null,
      displayOrder,
    });

    return NextResponse.json({ success: true, data: lesson }, { status: 201 });
  } catch (error) {
    logger.error('Error creating lesson:', error);
    const msg = error instanceof Error ? error.message : 'Failed to create lesson';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
