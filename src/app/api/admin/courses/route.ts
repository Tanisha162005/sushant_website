import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

import { MOCK_COURSES } from '@/lib/mockDb';

export const dynamic = 'force-dynamic';

// GET all courses
export async function GET() {
  try {
    // Return in-memory courses instead of DB
    return NextResponse.json({ success: true, data: MOCK_COURSES });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST create a new course (with optional ZIP upload)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = parseInt(formData.get('price') as string, 10); // in paise
    const originalPrice = formData.get('originalPrice') ? parseInt(formData.get('originalPrice') as string, 10) : null;
    const category = formData.get('category') as string || null;
    const status = (formData.get('status') as string) || 'draft';
    const zipFile = formData.get('zipFile') as File | null;
    const imageFile = formData.get('imageFile') as File | null;

    if (!title || !description || isNaN(price)) {
      return NextResponse.json({ success: false, message: 'Title, description, and price are required' }, { status: 400 });
    }

    let downloadUrl: string | null = null;

    // Handle ZIP file upload
    if (zipFile && zipFile.size > 0) {
      const uploadDir = path.join(process.cwd(), 'uploads', 'courses');
      await mkdir(uploadDir, { recursive: true });

      const fileExtension = path.extname(zipFile.name) || '.zip';
      const fileName = `${randomUUID()}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      const bytes = await zipFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      downloadUrl = `/api/admin/courses/file/${fileName}`;
    }

    let imageUrl: string | null = null;

    // Handle Image file upload
    if (imageFile && imageFile.size > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'thumbnails');
      await mkdir(uploadDir, { recursive: true });

      const fileExtension = path.extname(imageFile.name) || '.jpg';
      const fileName = `${randomUUID()}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      imageUrl = `/uploads/thumbnails/${fileName}`;
    }

    // MOCK insert instead of DB
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
    
    MOCK_COURSES.push(newCourse);

    return NextResponse.json({ success: true, data: newCourse }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ success: false, message: 'Failed to create course' }, { status: 500 });
  }
}
