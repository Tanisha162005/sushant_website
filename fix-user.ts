import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function resetPassword() {
  try {
    const newPassword = 'Welcome@123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, 'bhagyashreepralhad10@gmail.com'))
      .returning({ id: users.id, email: users.email, name: users.name });

    if (result.length > 0) {
      console.log("Password reset successful for:", JSON.stringify(result[0], null, 2));
      console.log("New temporary password: Welcome@123");
    } else {
      console.log("User not found!");
    }
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

resetPassword();
