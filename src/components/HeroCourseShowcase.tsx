'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface CourseData {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  imageUrl?: string | null;
  downloadUrl: string | null;
}

export const HeroCourseShowcase = () => {
  const [course, setCourse] = useState<CourseData | null>(null);
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

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

  if (!course) return null;

  const displayPrice = course.price / 100;
  const originalPrice = course.originalPrice ? (course.originalPrice / 100) : null;
  const discount = originalPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : null;

  const handleBuyClick = () => {
    document.getElementById('course')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-course-showcase" id="hero-course">
      <div className="container">
        <div className="hero-course-inner">
          {/* Thumbnail Side */}
          <div className="hero-course-thumbnail-wrap">
            <div className="hero-course-thumbnail">
              {course.imageUrl ? (
                <img src={course.imageUrl} alt={course.title} className="hero-course-img" />
              ) : (
                <div className="hero-course-img-placeholder">
                  <span className="hero-course-placeholder-icon">🎬</span>
                  <span className="hero-course-placeholder-text">{course.title}</span>
                </div>
              )}
              {/* Floating badge */}
              <div className="hero-course-live-badge">
                <span className="hero-course-live-dot"></span>
                {t('courseBadge')}
              </div>
            </div>
          </div>

          {/* Info Side */}
          <div className="hero-course-info">
            <span className="hero-course-tag">{t('courseTag')}</span>
            <h2 className="hero-course-title">{course.title}</h2>
            <p className="hero-course-desc">
              {course.description.length > 200
                ? course.description.slice(0, 200) + '...'
                : course.description}
            </p>

            {/* Price + CTA */}
            <div className="hero-course-price-row">
              <div className="hero-course-price-block">
                <span className="hero-course-price">₹{displayPrice.toLocaleString()}</span>
                {originalPrice && (
                  <span className="hero-course-original-price">₹{originalPrice.toLocaleString()}</span>
                )}
                {discount && (
                  <span className="hero-course-discount">{discount}% OFF</span>
                )}
              </div>
            </div>

            <div className="hero-course-actions">
              <button onClick={handleBuyClick} className="hero-course-buy-btn">
                <span>🚀</span> {t('enrollNow')}
                <span className="hero-course-btn-shine"></span>
              </button>
              <a
                href="#course"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('course')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hero-course-details-link"
              >
                View Full Details →
              </a>
            </div>

            {/* Trust line */}
            <div className="hero-course-trust">
              <span>🔒 Secured by Razorpay</span>
              <span>·</span>
              <span>📥 Instant Access</span>
              <span>·</span>
              <span>♾️ Lifetime Access</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
