import {
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET_NAME } from './r2';
import {
  R2ConnectionError,
  R2UploadError,
  FileValidationError,
} from './r2-errors';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { logger } from './logger';

// ─── MIME / Size Configuration ──────────────────────────────────────────────

/** Allowed MIME types mapped to their asset type folder */
const MIME_TO_ASSET_FOLDER: Record<string, string> = {
  'image/jpeg': 'images',
  'image/png': 'images',
  'image/webp': 'images',
  'image/gif': 'images',
  'application/pdf': 'pdfs',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'video/mp4': 'videos',
  'video/webm': 'videos',
  'video/quicktime': 'videos',
};

/** Maximum file sizes in bytes per category */
const MAX_FILE_SIZES: Record<string, number> = {
  images: 10 * 1024 * 1024,         // 10 MB
  pdfs: 50 * 1024 * 1024,           // 50 MB
  zip: 5 * 1024 * 1024 * 1024,      // 5 GB
  videos: 5 * 1024 * 1024 * 1024,   // 5 GB
};

/** All allowed MIME types */
export const ALLOWED_MIME_TYPES = Object.keys(MIME_TO_ASSET_FOLDER);

// ─── Filename & Path Utilities ─────────────────────────────────────────────

/**
 * Sanitize a filename by stripping directory traversal sequences,
 * null bytes, control characters, and special characters.
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\0/g, '')              // null bytes
    .replace(/\.\./g, '')            // directory traversal
    .replace(/[/\\]/g, '')           // path separators
    .replace(/[<>:"|?*]/g, '')       // Windows reserved chars
    .replace(/[\x00-\x1f\x7f]/g, '') // control characters
    .trim();
}

/**
 * Extract file extension from a filename (lowercase, with dot).
 * Returns empty string if no extension found.
 */
function getExtension(filename: string): string {
  const sanitized = sanitizeFilename(filename);
  const lastDot = sanitized.lastIndexOf('.');
  if (lastDot === -1 || lastDot === sanitized.length - 1) return '';
  return sanitized.slice(lastDot).toLowerCase();
}

/**
 * Get the asset folder name for a given MIME type.
 * Throws FileValidationError if MIME type is not allowed.
 */
export function getAssetFolder(mimeType: string): string {
  const folder = MIME_TO_ASSET_FOLDER[mimeType];
  if (!folder) {
    throw new FileValidationError(`MIME type "${mimeType}" is not allowed`, {
      allowedTypes: ALLOWED_MIME_TYPES,
    });
  }
  return folder;
}

/**
 * Build an R2 object key with a unique filename.
 * Format: courses/{courseSlug}/{assetFolder}/{uuid}.{ext}
 */
export function buildObjectKey(
  courseSlug: string,
  assetType: string,
  originalFilename: string
): string {
  const ext = getExtension(originalFilename);
  const folder = assetType; // 'images', 'videos', 'pdfs', 'zip'
  const uniqueName = `${randomUUID()}${ext}`;
  const slug = courseSlug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `courses/${slug}/${folder}/${uniqueName}`;
}

// ─── Validation ────────────────────────────────────────────────────────────

/**
 * Validate file MIME type and size.
 * Throws FileValidationError on failure.
 */
export function validateFile(mimeType: string, size: number): void {
  const folder = MIME_TO_ASSET_FOLDER[mimeType];
  if (!folder) {
    throw new FileValidationError(`MIME type "${mimeType}" is not allowed`, {
      allowedTypes: ALLOWED_MIME_TYPES,
    });
  }

  const maxSize = MAX_FILE_SIZES[folder];
  if (size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    const fileMB = Math.round(size / (1024 * 1024));
    throw new FileValidationError(
      `File size ${fileMB} MB exceeds maximum ${maxMB} MB for ${folder}`,
      { maxBytes: maxSize, actualBytes: size, category: folder }
    );
  }
}

/**
 * Determine if a file should use presigned URL upload (large files)
 * or server-side upload (small files).
 */
export function shouldUsePresignedUpload(mimeType: string): boolean {
  const folder = MIME_TO_ASSET_FOLDER[mimeType];
  return folder === 'zip' || folder === 'videos';
}

// ─── Connection Test ───────────────────────────────────────────────────────

/**
 * Verify R2 connection by checking if the bucket exists.
 */
export async function testConnection(): Promise<{ success: boolean; bucket: string }> {
  try {
    await r2Client.send(
      new HeadBucketCommand({ Bucket: R2_BUCKET_NAME })
    );
    return { success: true, bucket: R2_BUCKET_NAME };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new R2ConnectionError(`Failed to connect to R2 bucket "${R2_BUCKET_NAME}"`, {
      originalError: message,
    });
  }
}

// ─── Server-Side Upload (Small Files) ──────────────────────────────────────

/**
 * Upload a file buffer directly to R2 (for images/PDFs ≤50 MB).
 * Computes SHA-256 checksum automatically.
 */
export async function uploadFile(
  buffer: Buffer,
  folder: string,
  originalFilename: string,
  mimeType: string
): Promise<{
  objectKey: string;
  size: number;
  mimeType: string;
  checksum: string;
  etag?: string;
}> {
  validateFile(mimeType, buffer.length);

  const objectKey = buildObjectKey(folder, getAssetFolder(mimeType), originalFilename);
  const checksum = createHash('sha256').update(buffer).digest('hex');

  try {
    const response = await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
        Body: buffer,
        ContentType: mimeType,
        Metadata: {
          'original-filename': sanitizeFilename(originalFilename),
          'sha256-checksum': checksum,
        },
      })
    );

    const etag = response.ETag ? response.ETag.replace(/^"|"$/g, '') : undefined;
    logger.info(`[R2] Uploaded: ${objectKey} (${buffer.length} bytes, ETag: ${etag})`);

    return {
      objectKey,
      size: buffer.length,
      mimeType,
      checksum,
      etag,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[R2] Upload failed for ${objectKey}`, error);
    throw new R2UploadError(`Failed to upload file to R2`, {
      objectKey,
      originalError: message,
    });
  }
}

// ─── Presigned URL Upload (Large Files) ────────────────────────────────────

/**
 * Generate a presigned PUT URL for direct browser-to-R2 upload.
 * Used for ZIP files and videos (>50 MB, up to 5 GB).
 * Default expiry: 30 minutes.
 */
export async function createPresignedUploadUrl(
  objectKey: string,
  mimeType: string,
  expiresInSec: number = 1800
): Promise<{ presignedUrl: string; objectKey: string; expiresIn: number }> {
  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: mimeType,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: expiresInSec,
    });

    logger.info(`[R2] Presigned upload URL generated for: ${objectKey}`);

    return { presignedUrl, objectKey, expiresIn: expiresInSec };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[R2] Failed to generate presigned upload URL`, error);
    throw new R2UploadError('Failed to generate presigned upload URL', {
      objectKey,
      originalError: message,
    });
  }
}

// ─── Presigned Download URL ────────────────────────────────────────────────

/**
 * Generate a presigned GET URL for secure downloads.
 * Default expiry: 10 minutes (600 seconds).
 */
export async function generateSignedDownloadUrl(
  objectKey: string,
  expiresInSec: number = 600
): Promise<string> {
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    });

    // First verify the object exists
    await r2Client.send(command);

    const getCommand = new (await import('@aws-sdk/client-s3')).GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    });

    const signedUrl = await getSignedUrl(r2Client, getCommand, {
      expiresIn: expiresInSec,
    });

    logger.info(`[R2] Signed download URL generated for: ${objectKey} (expires in ${expiresInSec}s)`);
    return signedUrl;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[R2] Failed to generate signed download URL for ${objectKey}`, error);
    throw new R2ConnectionError('Failed to generate download URL', {
      objectKey,
      originalError: message,
    });
  }
}

// ─── Object Operations ─────────────────────────────────────────────────────

/**
 * Delete an object from R2 by its key.
 */
export async function deleteFile(objectKey: string): Promise<void> {
  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
      })
    );
    logger.info(`[R2] Deleted: ${objectKey}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[R2] Failed to delete ${objectKey}`, error);
    throw new R2UploadError(`Failed to delete file from R2`, {
      objectKey,
      originalError: message,
    });
  }
}

/**
 * Get object metadata (content type, size, etc.) from R2.
 */
export async function getObjectMetadata(objectKey: string) {
  try {
    const response = await r2Client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
      })
    );
    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      etag: response.ETag ? response.ETag.replace(/^"|"$/g, '') : undefined,
      metadata: response.Metadata,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new R2ConnectionError(`Object not found: ${objectKey}`, {
      objectKey,
      originalError: message,
    });
  }
}

/**
 * Check if an object exists in R2.
 * Returns true if found, false if not.
 */
export async function objectExists(objectKey: string): Promise<boolean> {
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
      })
    );
    return true;
  } catch {
    return false;
  }
}
