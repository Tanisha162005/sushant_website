import { NextRequest, NextResponse } from 'next/server';
import {
  initiateMultipartUpload,
  createPresignedPartUrl,
  buildObjectKey,
  validateFile,
  getAssetFolder,
} from '@/lib/r2-upload';
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
    const { filename, mimeType, size, courseSlug = 'default-course', chunkSize = 20 * 1024 * 1024 } = body;

    if (!filename || !mimeType || typeof size !== 'number') {
      throw new FileValidationError('Missing required fields: filename, mimeType, size');
    }

    validateFile(mimeType, size);

    const assetFolder = getAssetFolder(mimeType);
    const objectKey = buildObjectKey(courseSlug, assetFolder, filename);

    // Calculate part count (20 MB chunks by default)
    const totalParts = Math.ceil(size / chunkSize);
    const { uploadId } = await initiateMultipartUpload(objectKey, mimeType);

    // Generate presigned PUT URL for each part chunk
    const partUrlsPromises: Promise<string>[] = [];
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      partUrlsPromises.push(createPresignedPartUrl(objectKey, uploadId, partNumber, 7200));
    }

    const partUrls = await Promise.all(partUrlsPromises);

    return NextResponse.json({
      success: true,
      data: {
        uploadId,
        objectKey,
        chunkSize,
        totalParts,
        partUrls,
      },
    }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
