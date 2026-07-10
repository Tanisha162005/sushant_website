'use client';
import { useLanguage } from '@/context/LanguageContext';

export const Webinar = () => {
  const { t } = useLanguage();

  return (
    <section className="webinar-section" id="webinar">
      <div className="container">
        <div className="webinar-box reveal">
          <div className="webinar-bg-glow"></div>
          <div className="webinar-content">
            <h2 className="section-title">{t('webinarTitle')}</h2>
            <p className="section-subtitle">
              {t('webinarSubtitle')}
            </p>

            <form className="webinar-form" onSubmit={(e) => e.preventDefault()}>
              <input type="text" placeholder={t('webinarFormName')} required />
              <input type="email" placeholder={t('webinarFormEmail')} required />
              <input type="tel" placeholder={t('webinarFormPhone')} required pattern="[6-9][0-9]{9}" maxLength={10} />
              <button type="submit" className="btn-primary">
                {t('webinarCta')} <span className="btn-shine"></span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
