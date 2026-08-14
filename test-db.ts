import { db } from './src/db/index.ts';
import { courses } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function run() {
  try {
    await db.update(courses)
      .set({
        title: 'Creation Masterclass – Foundation Course (मराठी)',
        description: 'कोर्समध्ये सामाविष्ट गोष्टी : \n* या कोर्समध्ये तुम्हाला एकूण ५ व्हिडिओज मिळतील, जे तुम्ही कायमस्वरूपी डाउनलोड करून घेऊ शकता',
        price: 9900,
        originalPrice: 49900,
        status: 'published',
        category: null,
        updatedAt: new Date()
      })
      .where(eq(courses.id, 'dummy'))
      .returning();
    console.log('Query executed successfully');
  } catch (e) {
    console.log('ERROR MESSAGE:', e.message);
  }
}
run();
