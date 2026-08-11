import { headers } from 'next/headers';
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
import { ComingSoon } from '@/components/ComingSoon';
import { shouldShowWebsite } from '@/lib/site-mode';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Home Page
 * =========
 * Conditionally renders:
 *   - Coming Soon page when the request is from the main domain and WEBSITE_LIVE is not "true"
 *   - Full website when WEBSITE_LIVE is "true" or request is from the app subdomain
 *
 * To launch the full site, set WEBSITE_LIVE=true in .env.local and redeploy.
 *
 * Section order optimized for course conversions:
 *   Hero → Video (engage) → Course (convert) → About (trust) → Brands → Testimonials → FAQ → Footer
 */
export default async function Home() {
  const headersList = await headers();
  const hostname = headersList.get('x-forwarded-host') || headersList.get('host');
  const isLive = shouldShowWebsite(hostname);

  if (!isLive) {
    return <ComingSoon />;
  }

  // Fetch first published course server-side for instant card rendering
  let initialCourse = null;
  try {
    const publishedCourses = await db
      .select({
        id: courses.id,
        title: courses.title,
        price: courses.price,
        originalPrice: courses.originalPrice,
        imageUrl: courses.imageUrl,
      })
      .from(courses)
      .where(eq(courses.status, 'published'))
      .limit(1);

    if (publishedCourses.length > 0) {
      const c = publishedCourses[0];
      initialCourse = {
        ...c,
        imageUrl: c.imageUrl
          ? (c.imageUrl.startsWith('http') ? c.imageUrl : `/api/courses/${c.id}/thumbnail`)
          : null,
      };
    }
  } catch {
    // Silently fail — FloatingCourseCard will fallback to client fetch
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <FloatingElements />
      <ClientSetup />
      <Navbar />
      <Hero initialCourse={initialCourse} />
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>
      <div className="bg-glow bg-glow-3"></div>
      
      <VideoSection />
      <Course />
      <About />
      <Brands />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
}
