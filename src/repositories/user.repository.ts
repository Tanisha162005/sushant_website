import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export class UserRepository {
  async findByPhone(phone: string) {
    const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return result[0] || null;
  }

  async create(data: { name: string; email?: string; phone: string }) {
    const result = await db.insert(users).values({
      name: data.name,
      email: data.email || `${data.phone}@placeholder.com`,
      phone: data.phone,
    }).returning();
    return result[0];
  }
}
