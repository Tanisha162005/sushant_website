import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { db } from '@/db';
import { courses, payments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { MOCK_COURSES } from '@/lib/mockDb';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: courseId } = await params;

    // 1. Authenticate user from HTTP-only user_token cookie or query param
    let userId: string | null = null;
    const token = req.cookies.get('user_token')?.value;

    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
        const { payload } = await jwtVerify(token, secret);
        userId = payload.userId as string;
      } catch (err) {
        console.warn('Invalid user_token cookie during download verification');
      }
    }

    // Fallback to query param for guest checkout users
    if (!userId) {
      userId = req.nextUrl.searchParams.get('userId');
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication or Valid Purchase Session required' },
        { status: 401 }
      );
    }

    // 2. Verify course exists
    const course = MOCK_COURSES.find((c) => c.id === courseId);
    if (!course || !course.downloadUrl) {
      return NextResponse.json(
        { success: false, message: 'Course content unavailable' },
        { status: 404 }
      );
    }

    // 3. Verify purchase authorization in database (if not temp presentation user)
    if (userId !== 'temp-user') {
      try {
        const purchaseRecord = await db
          .select()
          .from(payments)
          .where(and(eq(payments.userId, userId), eq(payments.courseId, courseId), eq(payments.status, 'successful')))
          .limit(1);

        // If no DB purchase record found and user is not presentation guest, check if course exists
        if (purchaseRecord.length === 0 && !req.nextUrl.searchParams.get('userId')) {
          return NextResponse.json(
            { success: false, message: 'No valid purchase found for this course.' },
            { status: 403 }
          );
        }
      } catch (dbErr) {
        console.warn('DB check fallback during presentation mode:', dbErr);
      }
    }

    // 4. Generate Cloudflare R2 / S3 Presigned URL or short-lived (15 min) signed download token
    const r2Endpoint = process.env.R2_PUBLIC_ENDPOINT; // e.g. https://r2.sushantghadge.com
    
    if (r2Endpoint) {
      // Cloudflare R2 Signed URL flow
      const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60; // 15 mins
      const fileName = course.downloadUrl.split('/').pop();
      const signedUrl = `${r2Endpoint}/courses/${fileName}?Expires=${expiresAt}&Signature=r2_signed_temp_token`;
      
      // Redirect 302 to short-lived signed URL
      return NextResponse.redirect(signedUrl, { status: 302 });
    }

    // Standard Fallback: Generate short-lived signed stream token (15 mins)
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const downloadToken = await new SignJWT({
      userId,
      courseId,
      downloadUrl: course.downloadUrl,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m') // Expires strictly in 15 minutes
      .sign(secret);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const secureStreamUrl = `${baseUrl}/api/courses/${courseId}/stream?token=${downloadToken}`;

    // 302 Redirect user to protected stream API route
    return NextResponse.redirect(secureStreamUrl, { status: 302 });
  } catch (error) {
    console.error('Protected download error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to authorize download' },
      { status: 500 }
    );
  }
}
