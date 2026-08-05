'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { PurchaseCard } from './PurchaseCard';
import { CourseDetails } from './CourseDetails';
import { MobileStickyBuy } from './MobileStickyBuy';

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
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const purchaseCardRef = useRef<HTMLDivElement>(null);

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

    // Check backend for user's purchased courses (for lifetime unlimited access across devices)
    fetch('/api/user/purchases')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const dbPurchasedIds = data.data.map((c: CourseData) => c.id);
          setPurchasedCourseIds((prev) => Array.from(new Set([...prev, ...dbPurchasedIds])));
        }
      })
      .catch(() => {});

    // Check if user already purchased (from localStorage for instant offline feedback)
    const savedPurchases = localStorage.getItem('purchased_courses');
    if (savedPurchases) {
      try {
        const parsed = JSON.parse(savedPurchases);
        setPurchasedCourseIds((prev) => Array.from(new Set([...prev, ...(parsed.courseIds || [])])));
        if (parsed.userId) setPurchasedUserId(parsed.userId);
      } catch {}
    }
  }, []);

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (paymentProcessing) return;

    if (!buyingCourse) {
      alert('Course is not available right now. Please try again later.');
      return;
    }

    // Require user to be logged in
    if (!user) {
      alert('Please log in first to purchase this course.');
      router.push('/login');
      return;
    }

    // Extract form values BEFORE any asynchronous operations
    const form = e.currentTarget;
    const prefillName = (form.elements.namedItem('name') as HTMLInputElement)?.value || user.name;
    const prefillEmail = (form.elements.namedItem('email') as HTMLInputElement)?.value || user.email;
    const prefillContact = (form.elements.namedItem('phone') as HTMLInputElement)?.value || '';

    setPaymentProcessing(true);

    try {
      // Step 1: Create Razorpay order on server using real user ID
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, courseId: buyingCourse.id })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to create order');

      // Step 2: Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Sushant Ghadge Masterclass',
        description: buyingCourse.title,
        order_id: data.order.id,
        handler: async function (response: Record<string, string>) {
          try {
            // Step 3: Verify payment signature on server
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              // Payment verified — update local state
              const updatedIds = [...purchasedCourseIds, buyingCourse.id];
              const purchaseInfo = { courseIds: updatedIds, userId: user.id };
              localStorage.setItem('purchased_courses', JSON.stringify(purchaseInfo));
              setPurchasedCourseIds(updatedIds);
              setPurchasedUserId(user.id);
              setBuyingCourse(null);
              alert('🎉 Payment successful! You can now access the course from your dashboard.');
            } else {
              alert('Payment was received but verification failed. Please contact support.');
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            alert('Payment was received but verification encountered an error. Please contact support.');
          } finally {
            setPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentProcessing(false);
          },
        },
        prefill: {
          name: prefillName,
          email: prefillEmail,
          contact: prefillContact,
        },
        theme: { color: '#a855f7' }
      };

      const rzp = new (window as unknown as Record<string, new (opts: unknown) => { open: () => void }>).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed. Please try again.';
      alert(`Error: ${errorMessage}`);
      setPaymentProcessing(false);
    }
  };

  const handleDownload = async (courseId: string) => {
    if (!purchasedCourseIds.includes(courseId) || !purchasedUserId) return;
    setDownloading(courseId);
    
    try {
      const res = await fetch(`/api/courses/${courseId}/download?userId=${purchasedUserId}&json=true`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.signedUrl) {
        alert(data.message || 'Failed to generate secure download link');
        setDownloading(null);
        return;
      }

      // Open R2 signed URL directly to trigger browser download
      window.location.href = data.signedUrl;
    } catch {
      alert('Download failed. Please try again.');
    }
    setDownloading(null);
  };

  const getDisplayPrice = (c: CourseData) => c.price / 100;
  const getOriginalPrice = (c: CourseData) => c.originalPrice ? (c.originalPrice / 100) : (c.price / 100) * 2;

  // Use the first course as the featured course
  const featuredCourse = courses[0] || null;
  const isFeaturedPurchased = featuredCourse ? purchasedCourseIds.includes(featuredCourse.id) : false;
  const isFeaturedDownloading = featuredCourse ? downloading === featuredCourse.id : false;

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

          {featuredCourse ? (
            <div className="course-conversion-layout">
              {/* Left Column — Course Details */}
              <div className="course-conversion-details">
                <CourseDetails course={featuredCourse} />
              </div>

              {/* Right Column — Purchase Card (sticky on desktop) */}
              <div ref={purchaseCardRef}>
                <PurchaseCard
                  course={featuredCourse}
                  isPurchased={isFeaturedPurchased}
                  isDownloading={isFeaturedDownloading}
                  onBuyClick={() => setBuyingCourse(featuredCourse)}
                  onDownloadClick={() => handleDownload(featuredCourse.id)}
                />
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '24px', marginTop: '2rem' }}>
              No courses available at the moment.
            </div>
          )}

          {/* Additional courses below the featured one */}
          {courses.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem', marginTop: '4rem' }}>
              {courses.slice(1).map(course => {
                const displayPrice = getDisplayPrice(course);
                const originalPrice = getOriginalPrice(course);
                const discount = Math.round(((originalPrice - displayPrice) / originalPrice) * 100);
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
          )}
        </div>
      </section>

      {/* Mobile Sticky CTA — only for featured course */}
      {featuredCourse && (
        <MobileStickyBuy
          course={featuredCourse}
          isPurchased={isFeaturedPurchased}
          isDownloading={isFeaturedDownloading}
          isBuying={buyingCourse !== null}
          onBuyClick={() => setBuyingCourse(featuredCourse)}
          onDownloadClick={() => handleDownload(featuredCourse.id)}
          purchaseCardRef={purchaseCardRef}
        />
      )}

      {/* Payment Modal */}
      {buyingCourse && (
        <div className="payment-overlay active" style={{ display: 'flex' }}>
          <div className="payment-modal active">
            <button className="payment-modal-close" onClick={() => !paymentProcessing && setBuyingCourse(null)} aria-label="Close" disabled={paymentProcessing}>&times;</button>
            <div className="payment-modal-header">
              <div className="payment-modal-icon">🎬</div>
              <h3>{buyingCourse.title}</h3>
              <p className="payment-modal-price">
                <span className="payment-price-original">₹{getOriginalPrice(buyingCourse).toLocaleString()}</span>
                <span className="payment-price-current">₹{getDisplayPrice(buyingCourse).toLocaleString()}</span>
              </p>
            </div>
            {!user && (
              <div style={{ padding: '12px 16px', marginBottom: '12px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', color: '#fbbf24', fontSize: '0.85rem', textAlign: 'center' }}>
                ⚠️ Please <a href="/login" style={{ color: '#a855f7', textDecoration: 'underline', fontWeight: 600 }}>log in</a> or <a href="/register" style={{ color: '#a855f7', textDecoration: 'underline', fontWeight: 600 }}>register</a> first to purchase.
              </div>
            )}
            <form className="payment-form" onSubmit={handlePayment}>
              <div className="payment-field">
                <label htmlFor="pay-name">Your Name</label>
                <input type="text" id="pay-name" name="name" placeholder="Name" required minLength={2} defaultValue={user?.name || ''} />
              </div>
              <div className="payment-field">
                <label htmlFor="pay-email">Email</label>
                <input type="email" id="pay-email" name="email" placeholder="example@email.com" required defaultValue={user?.email || ''} />
              </div>
              <div className="payment-field">
                <label htmlFor="pay-phone">Phone</label>
                <input type="tel" id="pay-phone" name="phone" placeholder="10-digit mobile number" required pattern="[6-9][0-9]{9}" maxLength={10} />
              </div>
              <button type="submit" className="btn-primary btn-glow payment-submit-btn" disabled={paymentProcessing}>
                <span className="btn-icon">{paymentProcessing ? '⏳' : '🔒'}</span>
                <span className="payment-btn-text">{paymentProcessing ? 'Processing...' : `Pay ₹${getDisplayPrice(buyingCourse).toLocaleString()} Securely`}</span>
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
