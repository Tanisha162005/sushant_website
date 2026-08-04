import { NextRequest, NextResponse } from 'next/server';
import { MOCK_COURSES } from '@/lib/mockDb';
import { AssetRepository } from '@/repositories/asset.repository';
import { deleteFile } from '@/lib/r2-upload';
import { logger } from '@/lib/logger';

const assetRepo = new AssetRepository();

// DELETE a course and clean up associated R2 objects
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Find course and delete DB asset records / R2 objects
    try {
      const assets = await assetRepo.findByCourseId(id);
      for (const asset of assets) {
        try {
          await deleteFile(asset.objectKey);
        } catch (r2Err) {
          logger.warn(`Failed to delete R2 object ${asset.objectKey}:`, r2Err);
        }
      }
      await assetRepo.deleteByCourseId(id);
    } catch (dbErr) {
      logger.warn('DB asset cleanup fallback during presentation mode:', dbErr);
    }

    const index = MOCK_COURSES.findIndex(c => c.id === id);
    if (index !== -1) {
      const course = MOCK_COURSES[index];
      // Clean up R2 objects referenced directly on mock course if any
      if (course.downloadUrl && !course.downloadUrl.startsWith('/')) {
        try { await deleteFile(course.downloadUrl); } catch {}
      }
      if (course.imageUrl && !course.imageUrl.startsWith('/') && !course.imageUrl.startsWith('http')) {
        try { await deleteFile(course.imageUrl); } catch {}
      }
      MOCK_COURSES.splice(index, 1);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting course:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete course' }, { status: 500 });
  }
}

// PUT update a course
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const index = MOCK_COURSES.findIndex(c => c.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
    }

    MOCK_COURSES[index] = {
      ...MOCK_COURSES[index],
      ...body,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ success: true, data: MOCK_COURSES[index] });
  } catch (error) {
    logger.error('Error updating course:', error);
    return NextResponse.json({ success: false, message: 'Failed to update course' }, { status: 500 });
  }
}
