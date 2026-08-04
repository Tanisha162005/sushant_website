import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses, courseLessons, courseAssets } from '@/db/schema';
import { uploadFile } from '@/lib/r2-upload';
import { AssetRepository } from '@/repositories/asset.repository';
import { LessonRepository } from '@/repositories/lesson.repository';
import { logger } from '@/lib/logger';
import { desc, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const assetRepo = new AssetRepository();
const lessonRepo = new LessonRepository();

// GET all courses (admin)
export async function GET() {
  try {
    const allCourses = await db.select().from(courses).orderBy(desc(courses.createdAt));

    // Enrich each course with lesson count
    const enriched = await Promise.all(
      allCourses.map(async (course) => {
        const lessonCount = await lessonRepo.countByCourseId(course.id);
        return { ...course, lessonCount };
      })
    );

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    logger.error('Error fetching courses:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST create a new course
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = parseInt(formData.get('price') as string, 10);
    const originalPrice = formData.get('originalPrice') ? parseInt(formData.get('originalPrice') as string, 10) : null;
    const category = formData.get('category') as string || null;
    const status = (formData.get('status') as string) || 'draft';

    let downloadUrl = (formData.get('zipObjectKey') as string) || null;
    let imageUrl = (formData.get('thumbnailObjectKey') as string) || (formData.get('imageUrl') as string) || null;
    const pdfObjectKey = (formData.get('pdfObjectKey') as string) || null;

    const zipFile = formData.get('zipFile') as File | null;
    const imageFile = formData.get('imageFile') as File | null;

    if (!title || !description || isNaN(price)) {
      return NextResponse.json({ success: false, message: 'Title, description, and price are required' }, { status: 400 });
    }

    const courseSlug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    // Handle direct file uploads to R2
    if (zipFile && zipFile.size > 0 && !downloadUrl) {
      const bytes = await zipFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const res = await uploadFile(buffer, courseSlug, zipFile.name, zipFile.type || 'application/zip');
      downloadUrl = res.objectKey;
    }

    if (imageFile && imageFile.size > 0 && !imageUrl) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const res = await uploadFile(buffer, courseSlug, imageFile.name, imageFile.type || 'image/jpeg');
      imageUrl = res.objectKey;
    }

    const result = await db.insert(courses).values({
      title,
      description,
      price,
      originalPrice,
      category,
      status: status as 'draft' | 'published' | 'archived',
      downloadUrl,
      imageUrl,
    }).returning();

    const newCourse = result[0];

    // Register assets in courseAssets table
    if (imageUrl) {
      try {
        await assetRepo.create({ courseId: newCourse.id, filename: 'thumbnail', objectKey: imageUrl, mimeType: 'image/jpeg', size: 0, assetType: 'thumbnail' });
      } catch { /* ignore */ }
    }
    if (downloadUrl) {
      try {
        await assetRepo.create({ courseId: newCourse.id, filename: 'resources.zip', objectKey: downloadUrl, mimeType: 'application/zip', size: 0, assetType: 'zip' });
      } catch { /* ignore */ }
    }
    if (pdfObjectKey) {
      try {
        await assetRepo.create({ courseId: newCourse.id, filename: 'workbook.pdf', objectKey: pdfObjectKey, mimeType: 'application/pdf', size: 0, assetType: 'pdf' });
      } catch { /* ignore */ }
    }

    return NextResponse.json({ success: true, data: newCourse }, { status: 201 });
  } catch (error) {
    logger.error('Error creating course:', error);
    return NextResponse.json({ success: false, message: 'Failed to create course' }, { status: 500 });
  }
}
