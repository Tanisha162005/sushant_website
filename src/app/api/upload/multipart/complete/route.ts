import { NextRequest, NextResponse } from 'next/server';
import { completeMultipartUpload } from '@/lib/r2-upload';
import { handleApiError } from '@/lib/api-error';
import { FileValidationError, DownloadAuthorizationError } from '@/lib/r2-errors';
import { AssetRepository } from '@/repositories/asset.repository';
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';

const assetRepo = new AssetRepository();

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
    const { objectKey, uploadId, parts, courseId, filename, mimeType, size, assetType, checksum } = body;

    if (!objectKey || !uploadId || !Array.isArray(parts) || !filename || !mimeType || typeof size !== 'number' || !assetType) {
      throw new FileValidationError('Missing required fields: objectKey, uploadId, parts, filename, mimeType, size, assetType');
    }

    const { etag } = await completeMultipartUpload(objectKey, uploadId, parts);

    let assetRecord = null;
    if (courseId) {
      try {
        assetRecord = await assetRepo.create({
          courseId,
          filename,
          objectKey,
          mimeType,
          size,
          assetType,
          etag,
          checksum: checksum || null,
        });
      } catch (dbErr) {
        console.warn('[Multipart Complete API] Database record creation skipped or failed:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        objectKey,
        filename,
        mimeType,
        size,
        assetType,
        etag,
        assetRecord,
      },
    }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
