import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export class UserRepository {
  async findByPhone(phone: string) {
    const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return result[0] || null;
  }

  async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
    return result[0] || null;
  }

  async findByGoogleId(googleId: string) {
    const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result[0] || null;
  }

  async findById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: { name: string; email: string; phone?: string; password?: string; googleId?: string; avatarUrl?: string }) {
    const result = await db.insert(users).values({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone || null,
      password: data.password || null,
      googleId: data.googleId || null,
      avatarUrl: data.avatarUrl || null,
    }).returning();
    return result[0];
  }
}
