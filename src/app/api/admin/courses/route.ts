import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { randomUUID } from 'crypto';
import { MOCK_COURSES } from '@/lib/mockDb';
import { uploadFile } from '@/lib/r2-upload';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET all courses
export async function GET() {
  try {
    return NextResponse.json({ success: true, data: MOCK_COURSES });
  } catch (error) {
    logger.error('Error fetching courses:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST create a new course using R2 object keys or R2 upload
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = parseInt(formData.get('price') as string, 10); // in paise
    const originalPrice = formData.get('originalPrice') ? parseInt(formData.get('originalPrice') as string, 10) : null;
    const category = formData.get('category') as string || null;
    const status = (formData.get('status') as string) || 'draft';

    // R2 Object Keys passed from direct/server R2 uploads
    let downloadUrl = (formData.get('zipObjectKey') as string) || null;
    let imageUrl = (formData.get('thumbnailObjectKey') as string) || (formData.get('imageUrl') as string) || null;

    const zipFile = formData.get('zipFile') as File | null;
    const imageFile = formData.get('imageFile') as File | null;

    if (!title || !description || isNaN(price)) {
      return NextResponse.json({ success: false, message: 'Title, description, and price are required' }, { status: 400 });
    }

    const courseSlug = title.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Handle ZIP file upload to R2 if provided directly via FormData
    if (zipFile && zipFile.size > 0 && !downloadUrl) {
      const bytes = await zipFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const res = await uploadFile(buffer, courseSlug, zipFile.name, zipFile.type || 'application/zip');
      downloadUrl = res.objectKey;
    }

    // Handle Image file upload to R2 if provided directly via FormData
    if (imageFile && imageFile.size > 0 && !imageUrl) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const res = await uploadFile(buffer, courseSlug, imageFile.name, imageFile.type || 'image/jpeg');
      imageUrl = res.objectKey;
    }

    const newCourse = {
      id: randomUUID(),
      title,
      description,
      price,
      originalPrice,
      category,
      status: status as 'draft' | 'published' | 'archived',
      downloadUrl,
      imageUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      await db.insert(courses).values({
        id: newCourse.id,
        title: newCourse.title,
        description: newCourse.description,
        price: newCourse.price,
        originalPrice: newCourse.originalPrice,
        category: newCourse.category,
        status: newCourse.status,
        downloadUrl: newCourse.downloadUrl,
        imageUrl: newCourse.imageUrl,
      });
    } catch (dbErr) {
      logger.warn('[Course API] DB insert fallback to memory:', dbErr);
    }

    MOCK_COURSES.push(newCourse);

    return NextResponse.json({ success: true, data: newCourse }, { status: 201 });
  } catch (error) {
    logger.error('Error creating course:', error);
    return NextResponse.json({ success: false, message: 'Failed to create course' }, { status: 500 });
  }
}
