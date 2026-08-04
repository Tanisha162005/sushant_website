import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { AssetRepository } from '@/repositories/asset.repository';
import { LessonRepository } from '@/repositories/lesson.repository';
import { deleteFile } from '@/lib/r2-upload';
import { logger } from '@/lib/logger';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const assetRepo = new AssetRepository();
const lessonRepo = new LessonRepository();

async function verifyAdminAuth(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  if (!token) throw new Error('Unauthorized');
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;
    if (!['super_admin', 'admin', 'content_manager'].includes(role)) {
      throw new Error('Forbidden');
    }
  } catch {
    throw new Error('Unauthorized admin request');
  }
}

// DELETE a course and clean up associated R2 objects and lessons
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdminAuth(req);
    const { id } = await params;
    
    // 1. Find and delete R2 objects for all course assets (thumbnail, pdf, zip)
    try {
      const assets = await assetRepo.findByCourseId(id);
      for (const asset of assets) {
        try {
          await deleteFile(asset.objectKey);
          logger.info(`[Course Delete] Cleaned up R2 asset: ${asset.objectKey}`);
        } catch (r2Err) {
          logger.warn(`Failed to delete R2 asset ${asset.objectKey}:`, r2Err);
        }
      }
      await assetRepo.deleteByCourseId(id);
    } catch (err) {
      logger.warn('Error cleaning up course assets during delete:', err);
    }

    // 2. Find and delete R2 objects for all lessons
    try {
      const lessons = await lessonRepo.findByCourseId(id);
      for (const lesson of lessons) {
        try {
          await deleteFile(lesson.videoKey);
          logger.info(`[Course Delete] Cleaned up R2 lesson video: ${lesson.videoKey}`);
        } catch (r2Err) {
          logger.warn(`Failed to delete R2 lesson video ${lesson.videoKey}:`, r2Err);
        }
      }
    } catch (err) {
      logger.warn('Error cleaning up course lesson videos during delete:', err);
    }

    // 3. Delete course record from PostgreSQL (cascades to related tables)
    const result = await db
      .delete(courses)
      .where(eq(courses.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ success: false, message: 'Course not found in database' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting course:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete course';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}

// PUT update a course status or metadata
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdminAuth(req);
    const { id } = await params;
    const body = await req.json();

    // Prevent passing invalid fields directly into db set
    const { status, title, description, price, originalPrice, category } = body;
    const updatePayload: Record<string, unknown> = { updatedAt: new Date() };

    if (status !== undefined) updatePayload.status = status;
    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (price !== undefined) updatePayload.price = price;
    if (originalPrice !== undefined) updatePayload.originalPrice = originalPrice;
    if (category !== undefined) updatePayload.category = category;

    const result = await db
      .update(courses)
      .set(updatePayload)
      .where(eq(courses.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error) {
    logger.error('Error updating course:', error);
    const message = error instanceof Error ? error.message : 'Failed to update course';
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
