import { NextRequest, NextResponse } from 'next/server';
import { createPresignedUploadUrl, buildObjectKey, validateFile, getAssetFolder } from '@/lib/r2-upload';
import { handleApiError } from '@/lib/api-error';
import { FileValidationError, DownloadAuthorizationError } from '@/lib/r2-errors';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

async function verifyAdminAuth(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value;
  if (!token) {
    throw new DownloadAuthorizationError('Unauthorized: Admin authentication token missing');
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;
    const adminRoles = ['super_admin', 'admin', 'support', 'content_manager', 'finance_manager'];
    if (!adminRoles.includes(role)) {
      throw new DownloadAuthorizationError('Forbidden: Insufficient privileges');
    }
  } catch (error) {
    if (error instanceof DownloadAuthorizationError) throw error;
    throw new DownloadAuthorizationError('Unauthorized: Invalid admin token');
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdminAuth(req);

    const body = await req.json();
    const { filename, mimeType, size, courseSlug = 'default-course' } = body;

    if (!filename || !mimeType || typeof size !== 'number') {
      throw new FileValidationError('Missing required fields: filename, mimeType, size');
    }

    validateFile(mimeType, size);

    const assetFolder = getAssetFolder(mimeType);
    const objectKey = buildObjectKey(courseSlug, assetFolder, filename);

    // 30 minute expiry for direct upload session
    const { presignedUrl, expiresIn } = await createPresignedUploadUrl(objectKey, mimeType, 1800);

    return NextResponse.json({
      success: true,
      data: {
        presignedUrl,
        objectKey,
        expiresIn,
      },
    }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
