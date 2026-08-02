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
import { FloatingCTA } from '@/components/FloatingCTA';
import { FloatingElements } from '@/components/FloatingElements';
import { ComingSoon } from '@/components/ComingSoon';
import { shouldShowWebsite } from '@/lib/site-mode';

/**
 * Home Page
 * =========
 * Conditionally renders:
 *   - Coming Soon page when the request is from the main domain and WEBSITE_LIVE is not "true"
 *   - Full website when WEBSITE_LIVE is "true" or request is from the app subdomain
 *
 * To launch the full site, set WEBSITE_LIVE=true in .env.local and redeploy.
 */
export default async function Home() {
  const headersList = await headers();
  const hostname = headersList.get('x-forwarded-host') || headersList.get('host');
  const isLive = shouldShowWebsite(hostname);

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
