'use client';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export const VideoSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { t } = useLanguage();
  const videoId = "r9vWvIq1l7M"; // Default / placeholder

  return (
    <section className="video-section" id="video">
      <div className="container">
        <div className="section-header reveal">
          <span className="section-tag">Video</span>
          <h2 className="section-title">{t('videoTitle')}</h2>
          <p className="section-subtitle">{t('videoSubtitle')}</p>
        </div>
        <div className="video-outer-glow reveal-scale reveal-delay-1">
          <div className="video-wrapper" onClick={() => setIsPlaying(true)} style={{ cursor: 'pointer' }}>
            {!isPlaying ? (
              <>
                <div
                  className="video-thumbnail"
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    background: 'linear-gradient(135deg, #0A1530 0%, #0A1530 40%, #0D1B40 70%, #0A1530 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, rgba(0,210,255,0.08), transparent 50%, rgba(0,255,198,0.08))',
                    }}
                  ></div>
                  <span style={{ fontSize: '4rem', position: 'relative', zIndex: 1 }}>🎥</span>
                  <span
                    style={{
                      fontSize: '1.1rem',
                      color: '#a0a0b0',
                      position: 'relative',
                      zIndex: 1,
                      fontFamily: '"Noto Sans Devanagari", sans-serif',
                    }}
                  >
                    {t('videoComingSoon')}
                  </span>
                </div>
                <div className="video-play-btn"></div>
                <div className="video-play-pulse"></div>
                <div className="video-play-pulse-2"></div>
              </>
            ) : (
              <iframe
                width="100%"
                style={{ aspectRatio: '16/9', border: 'none', borderRadius: 'inherit' }}
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
