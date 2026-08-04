import { NextRequest, NextResponse } from 'next/server';
import { LessonRepository } from '@/repositories/lesson.repository';
import { deleteFile } from '@/lib/r2-upload';
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

// PUT /api/admin/courses/[id]/lessons/[lessonId] — Update lesson metadata or replace video
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    await verifyAdminAuth(req);
    const { lessonId } = await params;
    const body = await req.json();

    const existing = await lessonRepo.findById(lessonId);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Lesson not found' }, { status: 404 });
    }

    // If replacing video, delete old R2 object
    if (body.videoKey && body.videoKey !== existing.videoKey) {
      try {
        await deleteFile(existing.videoKey);
        logger.info(`[Lesson] Deleted old R2 video: ${existing.videoKey}`);
      } catch (r2Err) {
        logger.warn(`[Lesson] Failed to delete old R2 video ${existing.videoKey}:`, r2Err);
      }
    }

    const updated = await lessonRepo.update(lessonId, {
      title: body.title,
      description: body.description,
      videoKey: body.videoKey,
      duration: body.duration,
      fileSize: body.fileSize,
      displayOrder: body.displayOrder,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Error updating lesson:', error);
    const msg = error instanceof Error ? error.message : 'Failed to update lesson';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

// DELETE /api/admin/courses/[id]/lessons/[lessonId] — Delete lesson + R2 object
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    await verifyAdminAuth(req);
    const { lessonId } = await params;

    const existing = await lessonRepo.findById(lessonId);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Lesson not found' }, { status: 404 });
    }

    // Delete R2 video object
    try {
      await deleteFile(existing.videoKey);
      logger.info(`[Lesson] Deleted R2 video: ${existing.videoKey}`);
    } catch (r2Err) {
      logger.warn(`[Lesson] Failed to delete R2 video ${existing.videoKey}:`, r2Err);
    }

    await lessonRepo.delete(lessonId);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting lesson:', error);
    const msg = error instanceof Error ? error.message : 'Failed to delete lesson';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
