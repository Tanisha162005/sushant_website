import { db } from '@/db';
import { courseAssets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export interface CreateAssetInput {
  courseId: string;
  filename: string;
  objectKey: string;
  mimeType: string;
  size: number;
  assetType: 'thumbnail' | 'video' | 'pdf' | 'zip';
  storageProvider?: string;
  etag?: string;
  checksum?: string;
}

export class AssetRepository {
  async create(data: CreateAssetInput) {
    const result = await db.insert(courseAssets).values({
      courseId: data.courseId,
      filename: data.filename,
      objectKey: data.objectKey,
      mimeType: data.mimeType,
      size: data.size,
      assetType: data.assetType,
      storageProvider: data.storageProvider || 'cloudflare-r2',
      etag: data.etag || null,
      checksum: data.checksum || null,
    }).returning();
    return result[0];
  }

  async findByCourseId(courseId: string) {
    return await db.select().from(courseAssets).where(eq(courseAssets.courseId, courseId));
  }

  async findByObjectKey(objectKey: string) {
    const result = await db.select().from(courseAssets).where(eq(courseAssets.objectKey, objectKey)).limit(1);
    return result[0] || null;
  }

  async findByCourseAndType(courseId: string, assetType: 'thumbnail' | 'video' | 'pdf' | 'zip') {
    return await db.select().from(courseAssets).where(
      and(eq(courseAssets.courseId, courseId), eq(courseAssets.assetType, assetType))
    );
  }

  async getStorageSummary(courseId: string) {
    const assets = await this.findByCourseId(courseId);
    let thumbnailBytes = 0;
    let pdfBytes = 0;
    let zipBytes = 0;
    let videoBytes = 0;
    let videoCount = 0;

    for (const a of assets) {
      if (a.assetType === 'thumbnail') thumbnailBytes += a.size;
      else if (a.assetType === 'pdf') pdfBytes += a.size;
      else if (a.assetType === 'zip') zipBytes += a.size;
      else if (a.assetType === 'video') { videoBytes += a.size; videoCount++; }
    }

    const totalBytes = thumbnailBytes + pdfBytes + zipBytes + videoBytes;

    return {
      thumbnailBytes,
      pdfBytes,
      zipBytes,
      videoBytes,
      videoCount,
      totalBytes,
    };
  }

  async deleteByObjectKey(objectKey: string) {
    return await db.delete(courseAssets).where(eq(courseAssets.objectKey, objectKey)).returning();
  }

  async deleteByCourseId(courseId: string) {
    return await db.delete(courseAssets).where(eq(courseAssets.courseId, courseId)).returning();
  }
}
