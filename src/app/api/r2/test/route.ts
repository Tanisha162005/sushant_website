import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/r2-upload';
import { getR2BucketName } from '@/lib/r2';

export const dynamic = 'force-dynamic';

/**
 * Dev-only test endpoint to verify Cloudflare R2 connection.
 * GET /api/r2/test
 */
export async function GET() {
  try {
    const result = await testConnection();
    return NextResponse.json({
      success: true,
      bucket: result.bucket,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown R2 connection error';
    const details = (error as { details?: unknown })?.details || null;
    let bucketName = 'unknown';
    try {
      bucketName = getR2BucketName();
    } catch { /* ignore env error */ }

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
