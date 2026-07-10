import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { About } from '@/components/About';
import { VideoSection } from '@/components/VideoSection';
import { Course } from '@/components/Course';
import { Brands } from '@/components/Brands';
import { Testimonials } from '@/components/Testimonials';
import { Webinar } from '@/components/Webinar';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';
import { ClientSetup } from '@/components/ClientSetup';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
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
      <Webinar />
      <FAQ />
      <Footer />
    </div>
  );
}
