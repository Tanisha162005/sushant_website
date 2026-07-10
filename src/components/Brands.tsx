'use client';
import { useLanguage } from '@/context/LanguageContext';

export const Brands = () => {
  const { t } = useLanguage();

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

      <div className="marquee-container">
        <div className="marquee-track marquee-right">
          {['Prime Video', 'Disney Hotstar', 'ICC', 'Zee Marathi', 'HDFC Life', 'Cottonking', 'Reliance Digital', 'Zomato', 'Realme'].map((brand, i) => (
            <div key={`b1-${i}`} className="brand-card">{brand}</div>
          ))}
          {/* Duplicate for infinite effect */}
          {['Prime Video', 'Disney Hotstar', 'ICC', 'Zee Marathi', 'HDFC Life', 'Cottonking', 'Reliance Digital', 'Zomato', 'Realme'].map((brand, i) => (
            <div key={`b1-dup-${i}`} className="brand-card">{brand}</div>
          ))}
        </div>
      </div>

      <div className="marquee-container">
        <div className="marquee-track marquee-left">
          {['Centre Fruit', 'ITC Ashirwad', 'Chitale', 'MyFreshToHome', 'Villain Life', 'CEAT Tyres', "McDowell's", 'Beyond Kerala', 'Dosti Realty'].map((brand, i) => (
            <div key={`b2-${i}`} className="brand-card">{brand}</div>
          ))}
          {['Centre Fruit', 'ITC Ashirwad', 'Chitale', 'MyFreshToHome', 'Villain Life', 'CEAT Tyres', "McDowell's", 'Beyond Kerala', 'Dosti Realty'].map((brand, i) => (
            <div key={`b2-dup-${i}`} className="brand-card">{brand}</div>
          ))}
        </div>
      </div>
    </section>
  );
};
