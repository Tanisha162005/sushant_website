import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { readFile } from 'fs/promises';
import path from 'path';
import { MOCK_COURSES } from '@/lib/mockDb';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: courseId } = await params;
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Signed download token is missing or expired.' },
        { status: 403 }
      );
    }

    // Verify 15-minute short-lived download token signature & expiration
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    let payload;
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'Signed download token has expired (15m limit) or is invalid.' },
        { status: 403 }
      );
    }

    if (payload.courseId !== courseId) {
      return NextResponse.json(
        { success: false, message: 'Download token course mismatch.' },
        { status: 403 }
      );
    }

    const course = MOCK_COURSES.find((c) => c.id === courseId);
    if (!course || !course.downloadUrl) {
      return NextResponse.json(
        { success: false, message: 'Course content file not found.' },
        { status: 404 }
      );
    }

    const fileName = course.downloadUrl.split('/').pop();
    if (!fileName) {
      return NextResponse.json({ success: false, message: 'Invalid file reference' }, { status: 500 });
    }

    const filePath = path.join(process.cwd(), 'uploads', 'courses', fileName);

    try {
      const fileBuffer = await readFile(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${course.title.replace(/[^a-zA-Z0-9]/g, '_')}_course.zip"`,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    } catch {
      return NextResponse.json(
        { success: false, message: 'Course file not found on server storage.' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Stream download error:', error);
    return NextResponse.json({ success: false, message: 'Stream failed' }, { status: 500 });
  }
}
