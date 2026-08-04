import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, shouldUsePresignedUpload } from '@/lib/r2-upload';
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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const courseSlug = (formData.get('courseSlug') as string) || (formData.get('courseId') as string) || 'default-course';
    const courseId = formData.get('courseId') as string || null;
    const assetTypeInput = formData.get('assetType') as 'thumbnail' | 'video' | 'pdf' | 'zip' | null;

    if (!file) {
      throw new FileValidationError('No file provided in form data');
    }

    if (shouldUsePresignedUpload(file.type)) {
      throw new FileValidationError(
        `Large file type "${file.type}" must be uploaded via presigned URL (/api/upload/presign)`
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadFile(buffer, courseSlug, file.name, file.type);

    let assetRecord = null;
    if (courseId && assetTypeInput) {
      try {
        assetRecord = await assetRepo.create({
          courseId,
          filename: file.name,
          objectKey: result.objectKey,
          mimeType: result.mimeType,
          size: result.size,
          assetType: assetTypeInput,
          etag: result.etag,
          checksum: result.checksum,
        });
      } catch (dbErr) {
        console.warn('[Upload API] Database record creation skipped or failed:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        objectKey: result.objectKey,
        filename: file.name,
        mimeType: result.mimeType,
        size: result.size,
        etag: result.etag,
        checksum: result.checksum,
        assetRecord,
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
