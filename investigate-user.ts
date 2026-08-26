import { db } from './src/db';
import { users, payments, courses } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function investigate() {
  try {
    const userPayments = await db.select().from(payments).where(eq(payments.userId, 'b18ef2b2-ea69-4ed4-ba6f-a438bf9ee5fd'));
    console.log("PAYMENTS for user:", JSON.stringify(userPayments, null, 2));

    if (userPayments.length > 0) {
      for (const payment of userPayments) {
        if (payment.courseId) {
          const c = await db.select().from(courses).where(eq(courses.id, payment.courseId));
          console.log("COURSE for payment:", JSON.stringify(c, null, 2));
        }
      }
    }


  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

investigate();
