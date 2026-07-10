'use client';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { t } = useLanguage();

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    { q: t('faqQ1'), a: t('faqA1') },
    { q: t('faqQ2'), a: t('faqA2') },
    { q: t('faqQ3'), a: t('faqA3') },
    { q: t('faqQ4'), a: t('faqA4') },
  ];

  return (
    <section className="faq-section" id="faq">
      <div className="section-mesh-overlay"></div>
      <div className="container">
        <div className="section-header reveal">
          <span className="section-tag">FAQ</span>
          <h2 className="section-title">{t('faqTitle')}</h2>
          <p className="section-subtitle">{t('faqSubtitle')}</p>
        </div>

        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-item reveal ${index > 0 ? `reveal-delay-${index}` : ''} ${openIndex === index ? 'active' : ''}`}
              onClick={() => toggleFaq(index)}
            >
              <div className="faq-question">
                <span>{faq.q}</span>
                <div className="faq-icon">{openIndex === index ? '−' : '+'}</div>
              </div>
              <div className="faq-answer" style={{ maxHeight: openIndex === index ? '500px' : '0' }}>
                <div className="faq-answer-inner">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
