import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { About } from '@/components/About';
import { VideoSection } from '@/components/VideoSection';
import { Course } from '@/components/Course';
import { Brands } from '@/components/Brands';
import { Testimonials } from '@/components/Testimonials';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';
import { ClientSetup } from '@/components/ClientSetup';
import { FloatingElements } from '@/components/FloatingElements';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Home Page
 * =========
 * The main production website (WEBSITE_LIVE=true).
 *
 * Section order optimized for course conversions:
 *   Hero → Video (engage) → Course (convert) → About (trust) → Brands → Testimonials → FAQ → Footer
 */

interface CourseData {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  imageUrl?: string | null;
  downloadUrl: string | null;
}

export default async function Home() {
  let initialCourses: CourseData[] = [];
  try {
    const publishedCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        price: courses.price,
        originalPrice: courses.originalPrice,
        imageUrl: courses.imageUrl,
        downloadUrl: courses.downloadUrl,
      })
      .from(courses)
      .where(eq(courses.status, 'published'));

    initialCourses = publishedCourses.map(c => ({
      ...c,
      imageUrl: c.imageUrl
        ? (c.imageUrl.startsWith('http') ? c.imageUrl : `/api/courses/${c.id}/thumbnail`)
        : null,
    }));
  } catch {
    // Silently fail — Course component will fallback to client fetch or empty state if needed
  }

  const featuredCourse = initialCourses.length > 0 ? initialCourses[0] : null;

  return (
    <div className="flex flex-col min-h-screen relative">
      <FloatingElements />
      <ClientSetup />
      <Navbar />
      <Hero initialCourse={featuredCourse} />
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>
      <div className="bg-glow bg-glow-3"></div>
      
      <VideoSection />
      <Course initialCourses={initialCourses} />
      <About />
      <Brands />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
}
