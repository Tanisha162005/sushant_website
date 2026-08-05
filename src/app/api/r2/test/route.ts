import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/r2-upload';
import { getR2BucketName } from '@/lib/r2';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

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

/**
 * Dev/Admin test endpoint to verify Cloudflare R2 connection.
 * GET /api/r2/test
 */
export async function GET(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    const result = await testConnection();
    return NextResponse.json({
      success: true,
      bucket: result.bucket,
    });
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.message === 'Forbidden' ? 403 : 401 });
    }

    const isProd = process.env.NODE_ENV === 'production';
    const message = isProd
      ? 'Failed to verify storage connection.'
      : (error instanceof Error ? error.message : 'Unknown R2 connection error');
    const details = isProd
      ? null
      : ((error as { details?: unknown })?.details || null);
    let bucketName = isProd ? 'hidden' : 'unknown';
    if (!isProd) {
      try {
        bucketName = getR2BucketName();
      } catch { /* ignore env error */ }
    }

    return NextResponse.json(
      {
        success: false,
        bucket: bucketName,
        error: message,
        details,
      },
      { status: 500 }
    );
  }
}
