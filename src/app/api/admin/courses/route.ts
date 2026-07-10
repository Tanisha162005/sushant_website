import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// GET all courses
export async function GET() {
  try {
    const allCourses = await db.select().from(courses).orderBy(courses.createdAt);
    return NextResponse.json({ success: true, data: allCourses });
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

    const newCourse = await db.insert(courses).values({
      title,
      description,
      price,
      originalPrice,
      category,
      status: status as 'draft' | 'published' | 'archived',
      downloadUrl,
    }).returning();

    return NextResponse.json({ success: true, data: newCourse[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ success: false, message: 'Failed to create course' }, { status: 500 });
  }
}
