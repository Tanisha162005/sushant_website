import { db } from '@/db';
import { courseLessons } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export interface CreateLessonInput {
  courseId: string;
  title: string;
  description?: string | null;
  videoKey: string;
  duration?: number | null;
  fileSize?: number | null;
  displayOrder: number;
}

export interface UpdateLessonInput {
  title?: string;
  description?: string | null;
  videoKey?: string;
  duration?: number | null;
  fileSize?: number | null;
  displayOrder?: number;
}

export class LessonRepository {
  async create(data: CreateLessonInput) {
    const result = await db.insert(courseLessons).values({
      courseId: data.courseId,
      title: data.title,
      description: data.description || null,
      videoKey: data.videoKey,
      duration: data.duration || null,
      fileSize: data.fileSize || null,
      displayOrder: data.displayOrder,
    }).returning();
    return result[0];
  }

  async findByCourseId(courseId: string) {
    return await db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.courseId, courseId))
      .orderBy(asc(courseLessons.displayOrder));
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.id, id))
      .limit(1);
    return result[0] || null;
  }

  async update(id: string, data: UpdateLessonInput) {
    const result = await db
      .update(courseLessons)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(courseLessons.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: string) {
    const result = await db
      .delete(courseLessons)
      .where(eq(courseLessons.id, id))
      .returning();
    return result[0] || null;
  }

  async getNextDisplayOrder(courseId: string): Promise<number> {
    const lessons = await this.findByCourseId(courseId);
    if (lessons.length === 0) return 1;
    return Math.max(...lessons.map(l => l.displayOrder)) + 1;
  }

  async reorder(courseId: string, orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      db
        .update(courseLessons)
        .set({ displayOrder: index + 1, updatedAt: new Date() })
        .where(eq(courseLessons.id, id))
    );
    await Promise.all(updates);
    return this.findByCourseId(courseId);
  }

  async countByCourseId(courseId: string): Promise<number> {
    const lessons = await db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.courseId, courseId));
    return lessons.length;
  }

  async getTotalSize(courseId: string): Promise<number> {
    const lessons = await this.findByCourseId(courseId);
    return lessons.reduce((sum, l) => sum + (l.fileSize || 0), 0);
  }

  async getTotalDuration(courseId: string): Promise<number> {
    const lessons = await this.findByCourseId(courseId);
    return lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
  }
}
