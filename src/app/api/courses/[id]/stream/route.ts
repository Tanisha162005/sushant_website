import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'Streaming is disabled on this platform. Courses are download-only. Please use the secure download endpoint for individual lesson MP4 files.',
    },
    { status: 400 }
  );
}
