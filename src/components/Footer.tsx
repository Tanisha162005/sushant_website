'use client';
import { useLanguage } from '@/context/LanguageContext';

export const Footer = () => {
  const { t, lang } = useLanguage();

  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>{lang === 'mr' ? 'सुशांत घाडगे' : 'Sushant Ghadge'}</h3>
            <p>
              {t('footerDesc')}
            </p>
          </div>
          <div className="footer-links">
            <h4>{t('footerLinks')}</h4>
            <a href="#home">{t('footerHome')}</a>
            <a href="#about">{t('footerAbout')}</a>
            <a href="#course">{t('footerCourse')}</a>
            <a href="#brands">{t('footerBrands')}</a>
          </div>
          <div className="footer-links">
            <h4>{t('footerContact')}</h4>
            <a href="mailto:contactsushantghadge@gmail.com">{t('footerEmail')}</a>
            <a href="https://www.instagram.com/sushant_ghadge_/" target="_blank" rel="noreferrer">Instagram DM</a>
          </div>
        </div>
        <div className="footer-bottom">
          {t('footerRights')}
        </div>
      </div>
    </footer>
  );
};
