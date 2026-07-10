import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export class CourseRepository {
  async findAll() {
    return await db.select().from(courses);
  }

  async findById(id: string) {
    const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    return result[0] || null;
  }
}
