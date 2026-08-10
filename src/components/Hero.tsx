'use client';
import { Background3D } from './Background3D';
import { FloatingCourseCard } from './FloatingCourseCard';
import { useLanguage } from '@/context/LanguageContext';

import Spline from '@splinetool/react-spline';

export const Hero = () => {
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

      <div className="new-hero-layer new-hero-section" id="home" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10, paddingTop: '7rem', paddingBottom: '3rem' }}>
        
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
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6', boxShadow: '0 0 10px #3b82f6', animation: 'pulse 2s infinite' }}></span>
              {t('newCourseLive')}
            </div>

            {/* Main Heading */}
            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
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

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 20 }}>
              <a
                href="#course"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('course')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="new-btn-glow"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  padding: '1rem 2.5rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  textDecoration: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: '0 10px 25px -5px rgba(255, 255, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 35px -5px rgba(255, 255, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(255, 255, 255, 0.3)';
                }}
              >
                {t('viewCourse')}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  color: '#ffffff',
                  padding: '1rem 2.5rem',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  fontSize: '1.05rem',
                  textDecoration: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M10 8l6 4-6 4V8z" />
                </svg>
                {t('learnMore')}
              </a>
            </div>
          </div>

          {/* Right — Floating 3D Course Card */}
          <div className="hero-split-card" style={{ position: 'relative', zIndex: 10 }}>
            <FloatingCourseCard />
          </div>

        </div>
      </div>
    </>
  );
};

