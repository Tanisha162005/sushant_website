'use client';
import { useLanguage } from '@/context/LanguageContext';

export const About = () => {
  const { t } = useLanguage();

  return (
    <section className="about" id="about">
      <div className="section-glow section-glow-left"></div>
      <div className="section-glow section-glow-right"></div>
      <div className="section-mesh-overlay"></div>

      <div className="container">
        <div className="section-header reveal">
          <span className="section-tag">About</span>
          <h2 className="section-title">{t('aboutTitle')}</h2>
          <p className="section-subtitle">{t('aboutSubtitle')}</p>
        </div>

        <div className="about-grid">
          <div className="about-image-wrapper reveal-left">
            <div className="perspective-container">
              <div className="about-image-card tilt-3d">
                <img
                  src="/logo.png"
                  alt="Sushant Ghadge"
                  className="about-image"
                  style={{
                    background: 'linear-gradient(135deg, #050A18 0%, #0A1530 50%, #0D1B40 100%)',
                    width: '100%',
                    aspectRatio: '4/5',
                    borderRadius: '24px',
                    position: 'relative',
                    overflow: 'hidden',
                    objectFit: 'cover',
                  }}
                />
                <div className="about-image-border-glow"></div>
              </div>
              <div className="about-image-glow"></div>
            </div>
          </div>

          <div className="about-content reveal-right reveal-delay-1">
            <div className="about-intro-text">
              <p className="about-lead">
                {t('aboutP1')}
              </p>
              <p>
                {t('aboutP2')}
              </p>
              <p>
                {t('aboutP3')}
              </p>
            </div>

            {/* Journey Timeline */}
            <div className="journey-timeline reveal reveal-delay-2">
              <div className="journey-step">
                <div className="journey-dot" />
                <div className="journey-label">Started YouTube</div>
              </div>
              <div className="journey-step">
                <div className="journey-dot" />
                <div className="journey-label">500K Subscribers</div>
              </div>
              <div className="journey-step">
                <div className="journey-dot" />
                <div className="journey-label">150+ Brand Deals</div>
              </div>
              <div className="journey-step">
                <div className="journey-dot" />
                <div className="journey-label">Masterclass Launch</div>
              </div>
            </div>

            <div className="about-role-tags">
              <span className="role-tag">🎬 Actor</span>
              <span className="role-tag">📹 Content Creator</span>
              <span className="role-tag">🎥 Filmmaker</span>
              <span className="role-tag">🧑‍🏫 Mentor</span>
            </div>

            <div className="about-follow-cta">
              <a href="https://www.instagram.com/sushant_ghadge_/" target="_blank" rel="noreferrer" className="follow-btn">
                <span className="follow-icon">📷</span>
                <span>{t('followInsta')}</span>
                <span className="follow-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
