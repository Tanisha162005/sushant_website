'use client';
import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface CourseData {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  imageUrl?: string | null;
  downloadUrl: string | null;
}

export const Course = () => {
  const [buyingCourse, setBuyingCourse] = useState<CourseData | null>(null);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [purchasedCourseIds, setPurchasedCourseIds] = useState<string[]>([]);
  const [purchasedUserId, setPurchasedUserId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const { t } = useLanguage();

  // Countdown timer — resets every 24h
  const getTimeLeft = useCallback(() => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const diff = endOfDay.getTime() - now.getTime();
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  }, []);

  useEffect(() => {
    setTimeLeft(getTimeLeft());
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [getTimeLeft]);

  // Load published courses from backend
  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setCourses(data.data);
        }
      })
      .catch(() => {});

    // Check if user already purchased (from localStorage)
    const savedPurchases = localStorage.getItem('purchased_courses');
    if (savedPurchases) {
      try {
        const parsed = JSON.parse(savedPurchases);
        setPurchasedCourseIds(parsed.courseIds || []);
        setPurchasedUserId(parsed.userId);
      } catch {}
    }
  }, []);

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    if (!buyingCourse) {
      alert('Course is not available right now. Please try again later.');
      return;
    }

    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'temp-user', courseId: buyingCourse.id })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to create order');

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Sushant Ghadge Masterclass',
        description: buyingCourse.title,
        order_id: data.order.id,
        handler: function (response: Record<string, string>) {
          const updatedIds = [...purchasedCourseIds, buyingCourse.id];
          const purchaseInfo = { courseIds: updatedIds, userId: data.paymentRecord.userId };
          localStorage.setItem('purchased_courses', JSON.stringify(purchaseInfo));
          setPurchasedCourseIds(updatedIds);
          setPurchasedUserId(data.paymentRecord.userId);
          setBuyingCourse(null);
          alert('🎉 Payment successful! You can now download the course content.');
        },
        prefill: { name, email, contact: phone },
        theme: { color: '#a855f7' }
      };

      const rzp = new (window as unknown as Record<string, new (opts: unknown) => { open: () => void }>).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      alert('Payment initialization failed. Please try again.');
    }
  };

  const handleDownload = async (courseId: string) => {
    if (!purchasedCourseIds.includes(courseId) || !purchasedUserId) return;
    setDownloading(courseId);
    
    try {
      const res = await fetch(`/api/courses/${courseId}/download?userId=${purchasedUserId}`);
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Download failed');
        setDownloading(null);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'course_content.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Download failed. Please try again.');
    }
    setDownloading(null);
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  const getDisplayPrice = (c: CourseData) => c.price / 100;
  const getOriginalPrice = (c: CourseData) => c.originalPrice ? (c.originalPrice / 100) : (c.price / 100) * 2;
  const getDiscount = (c: CourseData) => Math.round(((getOriginalPrice(c) - getDisplayPrice(c)) / getOriginalPrice(c)) * 100);

  return (
    <>
      <section className="course-section" id="course">
        <div className="section-mesh-overlay"></div>
        <div className="container">
          <div className="section-header reveal">
            <span className="section-tag">{t('courseTag')}</span>
            <h2 className="section-title">{t('courseTitle')}</h2>
            <p className="section-subtitle">{t('courseSubtitle')}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem', marginTop: '3rem' }}>
            {courses.map(course => {
              const displayPrice = getDisplayPrice(course);
              const originalPrice = getOriginalPrice(course);
              const discount = getDiscount(course);
              const isPurchased = purchasedCourseIds.includes(course.id);
              const isDownloading = downloading === course.id;

              return (
                <div key={course.id} className="course-card reveal-scale" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(18,10,36,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', overflow: 'hidden', padding: 0 }}>
                  
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', height: '220px', backgroundColor: '#1e1b4b', overflow: 'hidden' }}>
                    {course.imageUrl ? (
                      <img src={course.imageUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b5e88', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        No Image Available
                      </div>
                    )}
                    <div className="course-badge" style={{ position: 'absolute', top: '15px', right: '15px', margin: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', background: 'linear-gradient(90deg, #a855f7, #ec4899)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {t('courseBadge')}
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '0.75rem', color: '#fff', textAlign: 'left', minHeight: '3rem' }}>{course.title}</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textAlign: 'left' }}>
                      {course.description || "Course details will be updated soon."}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto' }}>
                      <div className="course-price" style={{ justifyContent: 'flex-start', marginBottom: 0, padding: 0, border: 'none', background: 'transparent' }}>
                        <span className="current" style={{ fontSize: '1.5rem' }}>₹{displayPrice.toLocaleString()}</span>
                        <span className="original" style={{ fontSize: '1rem' }}>₹{originalPrice.toLocaleString()}</span>
                        <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80' }}>
                          {discount}% OFF
                        </span>
                      </div>

                      {isPurchased ? (
                        <button onClick={() => handleDownload(course.id)} disabled={isDownloading} className="btn-primary btn-glow border-0 cursor-pointer" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px' }}>
                          <span className="btn-icon">{isDownloading ? '⏳' : '📥'}</span> {isDownloading ? 'Downloading...' : 'Download Course'}
                          <span className="btn-shine"></span>
                        </button>
                      ) : (
                        <button onClick={() => setBuyingCourse(course)} className="btn-primary btn-glow border-0 cursor-pointer" style={{ width: '100%', padding: '0.8rem', borderRadius: '12px' }}>
                          <span className="btn-icon">🚀</span> {t('enrollNow')}
                          <span className="btn-shine"></span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {courses.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '24px', marginTop: '2rem' }}>
              No courses available at the moment.
            </div>
          )}
        </div>
      </section>

      {/* Payment Modal */}
      {buyingCourse && (
        <div className="payment-overlay active" style={{ display: 'flex' }}>
          <div className="payment-modal active">
            <button className="payment-modal-close" onClick={() => setBuyingCourse(null)} aria-label="Close">&times;</button>
            <div className="payment-modal-header">
              <div className="payment-modal-icon">🎬</div>
              <h3>{buyingCourse.title}</h3>
              <p className="payment-modal-price">
                <span className="payment-price-original">₹{getOriginalPrice(buyingCourse).toLocaleString()}</span>
                <span className="payment-price-current">₹{getDisplayPrice(buyingCourse).toLocaleString()}</span>
              </p>
            </div>
            <form className="payment-form" onSubmit={handlePayment}>
              <div className="payment-field">
                <label htmlFor="pay-name">Your Name</label>
                <input type="text" id="pay-name" name="name" placeholder="Name" required minLength={2} />
              </div>
              <div className="payment-field">
                <label htmlFor="pay-email">Email</label>
                <input type="email" id="pay-email" name="email" placeholder="example@email.com" required />
              </div>
              <div className="payment-field">
                <label htmlFor="pay-phone">Phone</label>
                <input type="tel" id="pay-phone" name="phone" placeholder="10-digit mobile number" required pattern="[6-9][0-9]{9}" maxLength={10} />
              </div>
              <button type="submit" className="btn-primary btn-glow payment-submit-btn">
                <span className="btn-icon">🔒</span>
                <span className="payment-btn-text">Pay ₹{getDisplayPrice(buyingCourse).toLocaleString()} Securely</span>
                <span className="btn-shine"></span>
              </button>
              <p className="payment-secure-note">🔒 Secured by Razorpay | 256-bit SSL Encryption</p>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
