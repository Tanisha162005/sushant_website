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

// PUT /api/admin/courses/[id]/lessons/reorder — Batch reorder lessons
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdminAuth(req);
    const { id: courseId } = await params;
    const body = await req.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'orderedIds array is required' },
        { status: 400 }
      );
    }

    const lessons = await lessonRepo.reorder(courseId, orderedIds);
    return NextResponse.json({ success: true, data: lessons });
  } catch (error) {
    logger.error('Error reordering lessons:', error);
    const msg = error instanceof Error ? error.message : 'Failed to reorder lessons';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
