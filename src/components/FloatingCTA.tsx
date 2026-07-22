'use client';
import { useState, useEffect } from 'react';

export const FloatingCTA = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroEnd = window.innerHeight;
      const courseSection = document.getElementById('course');
      const courseRect = courseSection?.getBoundingClientRect();
      
      const pastHero = window.scrollY > heroEnd;
      const courseVisible = courseRect && courseRect.top < window.innerHeight && courseRect.bottom > 0;
      
      setVisible(pastHero && !courseVisible);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`floating-cta ${visible ? 'visible' : ''}`}>
      <button
        className="floating-cta-btn"
        onClick={() => document.getElementById('course')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <span>🚀</span>
        <span>Enroll Now</span>
      </button>
    </div>
  );
};
