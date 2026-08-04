import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/r2-upload';
import { R2_BUCKET_NAME } from '@/lib/r2';

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
    return NextResponse.json(
      {
        success: false,
        bucket: R2_BUCKET_NAME,
        error: message,
        details,
      },
      { status: 500 }
    );
  }
}
