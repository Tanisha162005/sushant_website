'use client';
import { Background3D } from './Background3D';
import { FloatingCourseCard } from './FloatingCourseCard';
import type { CourseData } from './FloatingCourseCard';
import { useLanguage } from '@/context/LanguageContext';

import Spline from '@splinetool/react-spline';

interface HeroProps {
  initialCourse?: CourseData | null;
}

export const Hero = ({ initialCourse }: HeroProps) => {
  const { t } = useLanguage();

  const line1Words = (t('heroLine1') as string).split(' ');
  const line2Words = (t('heroLine2') as string).split(' ');

  return (
    <>
      <Background3D />
      
      {/* Subtle Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]" 
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      ></div>

      <div className="new-hero-layer new-hero-section hero-main-wrapper" id="home">
        
        {/* Decorative 3D Floating Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
          <div className="floating-3d-element glass-sphere"></div>
          <div className="floating-3d-element glass-cube"></div>
          <div className="floating-3d-element glass-ring"></div>
        </div>

        <div className="container hero-split-layout">
          
          {/* Left — Text Content */}
          <div className="hero-split-text">
            {/* Floating Tag */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '0.5rem 1.5rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#e5e7eb',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', boxShadow: '0 0 10px #3b82f6', animation: 'pulse 2s infinite' }}></span>
              {t('newCourseLive')}
            </div>

            {/* Main Heading */}
            <h1 style={{
              fontSize: 'clamp(1.75rem, 6vw, 5rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              textShadow: '0 10px 30px rgba(0,0,0,0.5)',
              marginTop: '1.5rem',
            }}>
              <div style={{ display: 'block', marginBottom: '0.25rem' }}>
                {line1Words.map((word, i) => (
                  <span key={`l1-${i}`} className="hero-word" style={{ display: 'inline-block', animationDelay: `${0.1 + i * 0.05}s`, marginRight: '0.25em' }}>{word}</span>
                ))}
              </div>
              <div style={{ display: 'block' }}>
                {line2Words.map((word, i) => (
                  <span key={`l2-${i}`} className="hero-word" style={{
                    display: 'inline-block',
                    animationDelay: `${0.3 + i * 0.05}s`,
                    marginRight: '0.25em',
                    background: 'linear-gradient(135deg, #ffffff 0%, #9ca3af 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    {word}
                  </span>
                ))}
              </div>
            </h1>

            {/* Subtitle */}
            <p style={{
              color: '#9ca3af',
              maxWidth: '36rem',
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              lineHeight: 1.6,
              fontWeight: 400,
              marginTop: '1.25rem',
              marginBottom: '2rem'
            }}>
              {t('heroSubtitle')}
            </p>



          </div>

          {/* Right — Floating 3D Course Card */}
          <div className="hero-split-card" style={{ position: 'relative', zIndex: 10 }}>
            <FloatingCourseCard initialCourse={initialCourse} />
          </div>

        </div>
      </div>
    </>
  );
};

