'use client';
import { useLanguage } from '@/context/LanguageContext';
import { useRef, useEffect } from 'react';

export const VideoSection = () => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch((err) => {
            console.log('Autoplay prevented by browser:', err);
          });
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="video-section" id="video">
      <div className="container">
        <div className="section-header reveal">
          <span className="section-tag">Video</span>
          <h2 className="section-title">{t('videoTitle')}</h2>
          <p className="section-subtitle">{t('videoSubtitle')}</p>
        </div>
        <div className="video-outer-glow reveal-scale reveal-delay-1">
          <div className="video-wrapper">
            <video
              ref={videoRef}
              src="/ad_video.mp4"
              width="100%"
              style={{ aspectRatio: '16/9', border: 'none', borderRadius: 'inherit', objectFit: 'cover' }}
              controls
              playsInline
            />
          </div>
        </div>
      </div>
    </section>
  );
};
