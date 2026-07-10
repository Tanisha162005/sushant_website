'use client';
import { Background3D } from './Background3D';
import { useLanguage } from '@/context/LanguageContext';

export const Hero = () => {
  const { t } = useLanguage();

  return (
    <>
      <Background3D />
      <div className="new-hero-layer new-hero-section" id="home" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10, paddingTop: '5rem' }}>
        <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 1.5rem' }}>
          
          {/* Floating Tag */}
          <div style={{
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            padding: '0.5rem 1.25rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#d8b4fe',
          }}>
            <span style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', backgroundColor: '#4ade80', animation: 'pulse 2s infinite' }}></span>
            {t('newCourseLive')}
          </div>

          {/* Main Heading */}
          <h1 style={{
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            fontWeight: 900,
            maxWidth: '64rem',
            lineHeight: 1.05,
            marginBottom: '2rem',
            letterSpacing: '-0.025em',
            color: '#fff',
          }}>
            <span>{t('heroLine1')}</span>
            <br />
            <span className="new-gradient-text" style={{
              background: 'linear-gradient(to right, #c084fc, #818cf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {t('heroLine2')}
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            color: '#9ca3af',
            maxWidth: '40rem',
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            lineHeight: 1.6,
            marginBottom: '3rem',
            fontWeight: 500,
          }}>
            {t('heroSubtitle')}
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', marginBottom: '5rem' }}>
            <a
              href="#course"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('course')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="new-btn-glow"
              style={{
                backgroundColor: '#c084fc',
                color: '#000',
                padding: '1.25rem 3rem',
                borderRadius: '1rem',
                fontWeight: 900,
                fontSize: '1.25rem',
                textDecoration: 'none',
                transition: 'all 0.3s',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(192, 132, 252, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {t('viewCourse')}
            </a>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                color: '#fff',
                padding: '1.25rem 3rem',
                borderRadius: '1rem',
                fontWeight: 700,
                fontSize: '1.25rem',
                textDecoration: 'none',
                transition: 'all 0.3s',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              }}
            >
              {t('learnMore')}
            </a>
          </div>

          {/* Scroll Indicator */}
          <div style={{
            width: '1.5rem',
            height: '2.5rem',
            border: '2px solid #374151',
            borderRadius: '9999px',
            display: 'flex',
            justifyContent: 'center',
            padding: '0.25rem',
            opacity: 0.5,
          }}>
            <div style={{
              width: '0.375rem',
              height: '0.375rem',
              backgroundColor: '#a855f7',
              borderRadius: '9999px',
              animation: 'bounce 1s infinite',
            }}></div>
          </div>
        </main>
      </div>
    </>
  );
};
