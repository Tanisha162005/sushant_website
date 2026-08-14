'use client';
import { useState, useEffect } from 'react';

export const FloatingCTA = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let isPastHero = false;
    let isCourseVisible = false;

    const updateVisibility = () => {
      setVisible(isPastHero && !isCourseVisible);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === 'home') {
            isPastHero = !entry.isIntersecting;
          } else if (entry.target.id === 'course') {
            isCourseVisible = entry.isIntersecting;
          }
        });
        updateVisibility();
      },
      { threshold: 0 } // Trigger as soon as 1px is visible/hidden
    );

    const homeEl = document.getElementById('home');
    const courseEl = document.getElementById('course');
    
    if (homeEl) observer.observe(homeEl);
    if (courseEl) observer.observe(courseEl);

    return () => observer.disconnect();
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
