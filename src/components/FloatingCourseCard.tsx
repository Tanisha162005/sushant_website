'use client';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface CourseData {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
  imageUrl?: string | null;
}

export const FloatingCourseCard = () => {
  const [course, setCourse] = useState<CourseData | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setCourse(data.data[0]);
        }
      })
      .catch(() => {});
  }, []);

  // 3D tilt on mouse move
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [course]);

  if (!course) return null;

  const displayPrice = course.price / 100;
  const originalPrice = course.originalPrice ? course.originalPrice / 100 : null;

  return (
    <div className="floating-course-card-container">
      <div ref={cardRef} className="floating-course-card">
        {/* Thumbnail */}
        <div className="floating-course-thumb">
          {course.imageUrl ? (
            <img src={course.imageUrl} alt={course.title} />
          ) : (
            <div className="floating-course-thumb-placeholder">
              <span>🎬</span>
            </div>
          )}
          {/* Overlay gradient */}
          <div className="floating-course-overlay" />
          {/* Price badge */}
          <div className="floating-course-price-badge">
            <span className="floating-course-price-current">₹{displayPrice.toLocaleString()}</span>
            {originalPrice && (
              <span className="floating-course-price-old">₹{originalPrice.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="floating-course-bottom">
          <span className="floating-course-name">{course.title}</span>
          <a
            href="#course"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('course')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="floating-course-buy-btn"
          >
            Buy Now
          </a>
        </div>

        {/* Shine effect */}
        <div className="floating-course-shine" />
      </div>
    </div>
  );
};
