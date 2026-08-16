import { db } from './src/db';
import { users, payments, courses } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function investigate() {
  try {
    const user = await db.select().from(users).where(eq(users.email, 'prasadsakpal231023@gmail.com')).limit(1);
    console.log("USER:", JSON.stringify(user, null, 2));

    if (user.length > 0) {
      const userPayments = await db.select().from(payments).where(eq(payments.userId, user[0].id));
      console.log("PAYMENTS:", JSON.stringify(userPayments, null, 2));
    }
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

investigate();
