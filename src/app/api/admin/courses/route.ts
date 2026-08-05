import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { uploadFile } from '@/lib/r2-upload';
import { AssetRepository } from '@/repositories/asset.repository';
import { LessonRepository } from '@/repositories/lesson.repository';
import { logger } from '@/lib/logger';
import { desc } from 'drizzle-orm';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const assetRepo = new AssetRepository();
const lessonRepo = new LessonRepository();

async function verifyAdminAuth(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('Unauthorized');
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;
    if (!['super_admin', 'admin', 'content_manager', 'support', 'finance_manager'].includes(role)) {
      throw new Error('Forbidden');
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'Forbidden') throw err;
    throw new Error('Unauthorized');
  }
}

// GET all courses (admin)
export async function GET(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
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
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.message === 'Forbidden' ? 403 : 401 });
    }
    logger.error('Error fetching courses:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST create a new course along with staged lesson MP4 videos
export async function POST(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
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

    // Process staged lesson MP4 videos created directly during course creation
    const lessonsJson = formData.get('lessons') as string | null;
    if (lessonsJson) {
      try {
        const parsedLessons = JSON.parse(lessonsJson);
        if (Array.isArray(parsedLessons)) {
          for (let i = 0; i < parsedLessons.length; i++) {
            const item = parsedLessons[i];
            if (item && item.title && item.videoKey) {
              await lessonRepo.create({
                courseId: newCourse.id,
                title: item.title,
                description: item.description || null,
                videoKey: item.videoKey,
                duration: item.duration ? Math.round(Number(item.duration)) : null,
                fileSize: item.fileSize ? Number(item.fileSize) : null,
                displayOrder: item.displayOrder || i + 1,
              });
              logger.info(`[Course Creation] Staged lesson '${item.title}' attached to course ${newCourse.id}`);
            }
          }
        }
      } catch (lErr) {
        logger.error('Error inserting staged lessons during course creation:', lErr);
      }
    }

    return NextResponse.json({ success: true, data: newCourse }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.message === 'Forbidden' ? 403 : 401 });
    }
    logger.error('Error creating course:', error);
    return NextResponse.json({ success: false, message: 'Failed to create course' }, { status: 500 });
  }
}
