import { db } from './src/db/index';
import { users, payments, courses } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log("=== CUSTOMER INVESTIGATION ===");
  const customerEmail = "vaibhavpawar5888@gmail.com";
  
  // 1. Find User
  const userResult = await db.select().from(users).where(eq(users.email, customerEmail));
  if (userResult.length === 0) {
    console.log("User not found!");
    return;
  }
  const user = userResult[0];
  console.log("User:", JSON.stringify(user, null, 2));
  
  // 2. Find Payments
  const userPayments = await db.select().from(payments).where(eq(payments.userId, user.id));
  console.log(`Found ${userPayments.length} payment(s):`);
  console.log(JSON.stringify(userPayments, null, 2));

  // Also try to find course
  if (userPayments.length > 0) {
    for (const p of userPayments) {
      if (p.courseId) {
        const c = await db.select().from(courses).where(eq(courses.id, p.courseId));
        console.log(`Course for payment ${p.id}:`, c.length > 0 ? c[0].title : "Not Found");
      }
    }
  }

  process.exit(0);
}

main().catch(console.error);
