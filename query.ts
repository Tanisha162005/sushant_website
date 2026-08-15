import { db } from './src/db/index';
import { courses } from './src/db/schema';
async function run() {
  try {
    const allCourses = await db.select().from(courses);
    console.log(JSON.stringify(allCourses, null, 2));
  } catch (e: any) {
    console.error(e.message);
  }
}
run();
