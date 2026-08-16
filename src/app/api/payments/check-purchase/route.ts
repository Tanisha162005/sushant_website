import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { payments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, purchased: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    let userId: string;
    try {
      const { payload } = await jwtVerify(token, secret);
      userId = payload.userId as string;
      if (!userId) throw new Error('Invalid token');
    } catch {
      return NextResponse.json(
        { success: false, purchased: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const courseId = req.nextUrl.searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json(
        { success: false, purchased: false, message: 'courseId is required' },
        { status: 400 }
      );
    }

    const existingPurchase = await db
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          eq(payments.userId, userId),
          eq(payments.courseId, courseId),
          eq(payments.status, 'successful')
        )
      )
      .limit(1);

    return NextResponse.json({
      success: true,
      purchased: existingPurchase.length > 0,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Check purchase error:', error);
    return NextResponse.json(
      { success: false, purchased: false, message: 'Internal server error' },
      { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}
