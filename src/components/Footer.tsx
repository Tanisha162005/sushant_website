'use client';
import { useLanguage } from '@/context/LanguageContext';

export const Footer = () => {
  const { t, lang } = useLanguage();

  return (
    <>
      {/* Pre-Footer CTA Banner */}
      <section className="pre-footer-cta">
        <div className="container reveal">
          <h2>
            Ready to Start Your{' '}
            <span style={{
              background: 'linear-gradient(135deg, #A855F7, #D8B4FE)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Creative Journey</span>?
          </h2>
          <p>Join thousands of students who are already building their content creation career with Sushant&apos;s Masterclass.</p>
          <a
            href="#course"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('course')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-primary btn-glow"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '1rem 2.5rem',
              fontSize: '1.05rem',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            <span>🚀</span> Enroll Now
            <span className="btn-shine"></span>
          </a>
        </div>
      </section>

      <footer className="footer" id="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <img src="/logo.png" alt="Sushant Ghadge Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain', display: 'block' }} />
              </div>
              <a href="mailto:sushanthelpcreators@gmail.com" style={{ color: '#c084fc', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>
                sushanthelpcreators@gmail.com
              </a>
              <p style={{ marginTop: '0.75rem' }}>
                {t('footerDesc')}
              </p>
              {/* Social Icons */}
              <div className="footer-social-row">
                <a href="https://www.instagram.com/sushant_helps_creators_?igsh=MjM5aWN4bW5mbDli&utm_source=qr" target="_blank" rel="noreferrer" className="footer-social-icon" title="Instagram">
                  📷
                </a>
                <a href="https://youtube.com/@sushanthelpcreators?si=26kSXJ-WeVCyWhwU" target="_blank" rel="noreferrer" className="footer-social-icon" title="YouTube">
                  ▶
                </a>
              </div>
            </div>
            <div className="footer-links">
              <h4>{t('footerLinks')}</h4>
              <a href="#home">{t('footerHome')}</a>
              <a href="#about">{t('footerAbout')}</a>
              <a href="#course">{t('footerCourse')}</a>
              <a href="#brands">{t('footerBrands')}</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="footer-links">
              <h4>{t('footerContact')}</h4>
              <a href="mailto:sushanthelpcreators@gmail.com">{t('footerEmail')}</a>
              
              {/* Newsletter */}
              <h4 style={{ marginTop: '2rem' }}>Stay Updated</h4>
              <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert('Thanks for subscribing!'); }}>
                <input type="email" placeholder="your@email.com" required />
                <button type="submit">Subscribe</button>
              </form>
            </div>
          </div>
          <div className="footer-bottom">
            {t('footerRights')}
          </div>
        </div>
      </footer>
    </>
  );
};
