'use client';
import { useLanguage } from '@/context/LanguageContext';

export const Testimonials = () => {
  const { t } = useLanguage();

  const testimonials = [
    { text: t('testi1Text'), name: t('testi1Name'), role: t('testi1Role') },
    { text: t('testi2Text'), name: t('testi2Name'), role: t('testi2Role') },
    { text: t('testi3Text'), name: t('testi3Name'), role: t('testi3Role') },
    { text: t('testi4Text'), name: t('testi4Name'), role: t('testi4Role') },
    { text: t('testi5Text'), name: t('testi5Name'), role: t('testi5Role') },
    { text: t('testi6Text'), name: t('testi6Name'), role: t('testi6Role') },
  ];

  const renderCard = (item: typeof testimonials[0], idx: number, prefix: string) => (
    <div key={`${prefix}-${idx}`} className="testimonial-marquee-card">
      <div className="tmc-stars">★★★★★</div>
      <p className="tmc-text">&ldquo;{item.text}&rdquo;</p>
      <div className="tmc-author">
        <div className="tmc-avatar">{item.name[0]}</div>
        <div>
          <div className="tmc-name">{item.name}</div>
          <div className="tmc-role">{item.role}</div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="testimonials-section" id="testimonials">
      <div className="section-mesh-overlay"></div>
      <div className="container">
        <div className="section-header reveal">
          <span className="section-tag">Testimonials</span>
          <h2 className="section-title">{t('testimonialsTitle')}</h2>
          <p className="section-subtitle">{t('testimonialsSubtitle')}</p>
        </div>
      </div>

      {/* Infinite Scrolling Marquee */}
      <div className="testimonial-marquee-container">
        <div className="testimonial-marquee-track">
          {testimonials.map((item, i) => renderCard(item, i, 'a'))}
          {/* Duplicate for seamless loop */}
          {testimonials.map((item, i) => renderCard(item, i, 'b'))}
        </div>
      </div>
    </section>
  );
};
