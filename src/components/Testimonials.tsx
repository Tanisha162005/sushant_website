'use client';
import { useLanguage } from '@/context/LanguageContext';

export const Testimonials = () => {
  const { t } = useLanguage();

  return (
    <section className="testimonials-section" id="testimonials">
      <div className="section-mesh-overlay"></div>
      <div className="container">
        <div className="section-header reveal">
          <span className="section-tag">Testimonials</span>
          <h2 className="section-title">{t('testimonialsTitle')}</h2>
          <p className="section-subtitle">{t('testimonialsSubtitle')}</p>
        </div>
        <div className="testimonials-grid">
          <div className="perspective-container">
            <div className="testimonial-card reveal tilt-3d">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">{t('testi1Text')}</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t('testi1Name')[0]}</div>
                <div className="author-info">
                  <span className="author-name">{t('testi1Name')}</span>
                  <span className="author-role">{t('testi1Role')}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="perspective-container">
            <div className="testimonial-card reveal reveal-delay-1 tilt-3d">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">{t('testi2Text')}</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t('testi2Name')[0]}</div>
                <div className="author-info">
                  <span className="author-name">{t('testi2Name')}</span>
                  <span className="author-role">{t('testi2Role')}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="perspective-container">
            <div className="testimonial-card reveal reveal-delay-2 tilt-3d">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">{t('testi3Text')}</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t('testi3Name')[0]}</div>
                <div className="author-info">
                  <span className="author-name">{t('testi3Name')}</span>
                  <span className="author-role">{t('testi3Role')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
