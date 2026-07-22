'use client';
import { useLanguage } from '@/context/LanguageContext';

export const Brands = () => {
  const { t } = useLanguage();

  const logosRow1 = [
    'CEAT_Tyres_Ltd.png',
    'Disney+_Hotstar_Logo_2.webp',
    'HDFC_LIFE_idpZrhQAmu_0.png',
    'ICC_Cricket_Logo_Alternative_2_2.webp',
    'Logo.png',
    'Reliance_Digital.svg.webp',
    'Zee_Marathi_Official_Logo.jpg'
  ];

  const logosRow2 = [
    'Zomato_Logo.png',
    'e2e6ec1b5058125b227993c6619b09.webp',
    'idaY33QoY7_1784705906035.svg',
    'images (1).png',
    'images.jpg',
    'images.png'
  ];

  const renderBrandCard = (logo: string, key: string) => (
    <div key={key} className="brand-card" style={{ 
      backgroundColor: '#ffffff', 
      padding: '1.5rem', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      width: '220px',
      height: '110px',
      borderRadius: '16px',
      boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <img src={`/brands/${logo}`} alt="Brand Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }} />
    </div>
  );

  return (
    <section className="brands-section" id="brands">
      <div className="brands-bg-glow brands-glow-1"></div>
      <div className="brands-bg-glow brands-glow-2"></div>

      <div className="container">
        <div className="section-header reveal">
          <span className="section-tag">Brands</span>
          <h2 className="section-title">{t('brandsTitle')}</h2>
          <p className="section-subtitle">{t('brandsSubtitle')}</p>
        </div>
      </div>

      <div className="marquee-container" style={{ marginBottom: '2rem' }}>
        <div className="marquee-track marquee-right">
          {logosRow1.map((logo, i) => renderBrandCard(logo, `b1-${i}`))}
          {/* Duplicate for infinite effect */}
          {logosRow1.map((logo, i) => renderBrandCard(logo, `b1-dup-${i}`))}
        </div>
      </div>

      <div className="marquee-container">
        <div className="marquee-track marquee-left">
          {logosRow2.map((logo, i) => renderBrandCard(logo, `b2-${i}`))}
          {logosRow2.map((logo, i) => renderBrandCard(logo, `b2-dup-${i}`))}
        </div>
      </div>
    </section>
  );
};
