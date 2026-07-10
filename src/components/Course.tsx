'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface CourseData {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  downloadUrl: string | null;
}

export const Course = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [purchasedCourseId, setPurchasedCourseId] = useState<string | null>(null);
  const [purchasedUserId, setPurchasedUserId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { t } = useLanguage();

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
    const savedPurchase = localStorage.getItem('purchased_course');
    if (savedPurchase) {
      try {
        const parsed = JSON.parse(savedPurchase);
        setPurchasedCourseId(parsed.courseId);
        setPurchasedUserId(parsed.userId);
      } catch {}
    }
  }, []);

  // Get the first published course (main course shown on homepage)
  const mainCourse = courses[0];
  const displayPrice = mainCourse ? (mainCourse.price / 100) : 4999;
  const displayOriginalPrice = mainCourse?.originalPrice ? (mainCourse.originalPrice / 100) : 9999;

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    if (!mainCourse) {
      alert('Course is not available right now. Please try again later.');
      return;
    }

    try {
      // Create order via our API
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'temp-user', courseId: mainCourse.id })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to create order');

      // Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Sushant Ghadge Masterclass',
        description: mainCourse.title,
        order_id: data.order.id,
        handler: function (response: any) {
          // Payment successful! Save purchase info
          const purchaseInfo = { courseId: mainCourse.id, userId: data.paymentRecord.userId, paymentId: response.razorpay_payment_id };
          localStorage.setItem('purchased_course', JSON.stringify(purchaseInfo));
          setPurchasedCourseId(mainCourse.id);
          setPurchasedUserId(data.paymentRecord.userId);
          setIsModalOpen(false);
          alert('🎉 Payment successful! You can now download the course content.');
        },
        prefill: { name, email, contact: phone },
        theme: { color: '#a855f7' }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      alert('Payment initialization failed. Please try again.');
    }
  };

  const handleDownload = async () => {
    if (!purchasedCourseId || !purchasedUserId) return;
    setDownloading(true);
    
    try {
      const res = await fetch(`/api/courses/${purchasedCourseId}/download?userId=${purchasedUserId}`);
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || 'Download failed');
        setDownloading(false);
        return;
      }

      // Trigger file download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'course_content.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Download failed. Please try again.');
    }
    setDownloading(false);
  };

  const isPurchased = purchasedCourseId && mainCourse && purchasedCourseId === mainCourse.id;

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
          <div className="perspective-container">
            <div className="course-card reveal-scale reveal-delay-1 tilt-3d">
              <div className="course-card-glow"></div>
              <div className="course-card-inner">
                <div className="course-badge">{t('courseBadge')}</div>
                <h3>{mainCourse?.title || t('courseCardTitle')}</h3>
                <p className="course-desc">
                  {mainCourse?.description || t('courseDesc')}
                </p>
                <div className="course-features">
                  <div className="course-feature"><div className="icon">✓</div><span>{t('courseFeature1')}</span></div>
                  <div className="course-feature"><div className="icon">✓</div><span>{t('courseFeature2')}</span></div>
                  <div className="course-feature"><div className="icon">✓</div><span>{t('courseFeature3')}</span></div>
                </div>
                <div className="course-cta">
                  <div className="course-price">
                    <span className="original">₹{displayOriginalPrice.toLocaleString()}</span>
                    <span className="current">₹{displayPrice.toLocaleString()}</span>
                  </div>

                  {isPurchased ? (
                    <button onClick={handleDownload} disabled={downloading} className="btn-primary btn-glow border-0 cursor-pointer">
                      <span className="btn-icon">{downloading ? '⏳' : '📥'}</span> {downloading ? 'Downloading...' : 'Download Course'}
                      <span className="btn-shine"></span>
                    </button>
                  ) : (
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary btn-glow border-0 cursor-pointer">
                      <span className="btn-icon">🚀</span> {t('enrollNow')}
                      <span className="btn-shine"></span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      {isModalOpen && (
        <div className="payment-overlay active" style={{ display: 'flex' }}>
          <div className="payment-modal active">
            <button className="payment-modal-close" onClick={() => setIsModalOpen(false)} aria-label="Close">&times;</button>
            <div className="payment-modal-header">
              <div className="payment-modal-icon">🎬</div>
              <h3>{mainCourse?.title || t('courseTitle')}</h3>
              <p className="payment-modal-price">
                <span className="payment-price-original">₹{displayOriginalPrice.toLocaleString()}</span>
                <span className="payment-price-current">₹{displayPrice.toLocaleString()}</span>
              </p>
            </div>
            <form className="payment-form" onSubmit={handlePayment}>
              <div className="payment-field">
                <label htmlFor="pay-name">{t('webinarFormName')} / Your Name</label>
                <input type="text" id="pay-name" name="name" placeholder="Name" required minLength={2} />
              </div>
              <div className="payment-field">
                <label htmlFor="pay-email">{t('webinarFormEmail')} / Email</label>
                <input type="email" id="pay-email" name="email" placeholder="example@email.com" required />
              </div>
              <div className="payment-field">
                <label htmlFor="pay-phone">{t('webinarFormPhone')} / Phone</label>
                <input type="tel" id="pay-phone" name="phone" placeholder="10-digit mobile number" required pattern="[6-9][0-9]{9}" maxLength={10} />
              </div>
              <button type="submit" className="btn-primary btn-glow payment-submit-btn">
                <span className="btn-icon">🔒</span>
                <span className="payment-btn-text">Pay ₹{displayPrice.toLocaleString()} Securely</span>
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
