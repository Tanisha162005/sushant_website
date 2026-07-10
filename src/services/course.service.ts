import { CourseRepository } from '@/repositories/course.repository';
import { redis } from '@/lib/redis';

const courseRepo = new CourseRepository();

export class CourseService {
  async getAllCourses() {
    const cached = await redis.get('courses:all');
    if (cached) return JSON.parse(cached);

    const courses = await courseRepo.findAll();
    await redis.setex('courses:all', 3600, JSON.stringify(courses)); // cache for 1 hour
    return courses;
  }
}
