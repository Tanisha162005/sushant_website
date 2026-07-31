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
import { FloatingCTA } from '@/components/FloatingCTA';
import { FloatingElements } from '@/components/FloatingElements';
import { ComingSoon } from '@/components/ComingSoon';

/**
 * Home Page
 * =========
 * Conditionally renders:
 *   - Coming Soon page when WEBSITE_LIVE is not "true" (pre-launch)
 *   - Full website when WEBSITE_LIVE is "true" (post-launch)
 *
 * To launch the full site, set WEBSITE_LIVE=true in .env.local and redeploy.
 */
export default function Home() {
  // Server-side env check — no NEXT_PUBLIC_ prefix needed
  const isLive = process.env.WEBSITE_LIVE === 'true';

  if (!isLive) {
    return <ComingSoon />;
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <FloatingElements />
      <ClientSetup />
      <Navbar />
      <Hero />
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>
      <div className="bg-glow bg-glow-3"></div>
      
      <About />
      <VideoSection />
      <Course />
      <Brands />
      <Testimonials />
      <FAQ />
      <Footer />
      <FloatingCTA />
    </div>
  );
}
