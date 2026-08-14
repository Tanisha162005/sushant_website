'use client';
import { useState, useEffect } from 'react';

export const FloatingCTA = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      const heroEnd = window.innerHeight;
      const courseSection = document.getElementById('course');
      const courseRect = courseSection?.getBoundingClientRect();
      
      const pastHero = window.scrollY > heroEnd;
      const courseVisible = courseRect && courseRect.top < window.innerHeight && courseRect.bottom > 0;
      
      setVisible(pastHero && !courseVisible);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
