'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export interface CourseData {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
  imageUrl?: string | null;
}

interface FloatingCourseCardProps {
  initialCourse?: CourseData | null;
}

export const FloatingCourseCard = ({ initialCourse }: FloatingCourseCardProps) => {
  const [course, setCourse] = useState<CourseData | null>(initialCourse ?? null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  // Only fetch client-side if no initial course was provided from the server
  useEffect(() => {
    if (initialCourse) return;
    fetch('/api/courses')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setCourse(data.data[0]);
        }
      })
      .catch(() => {});
  }, [initialCourse]);

  // 3D tilt on mouse move
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    if (window.matchMedia("(pointer: coarse)").matches) return;

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

  const handleBuyNow = async () => {
    if (paymentProcessing || !course) return;

    // Require login
    if (!user) {
      alert('Please log in first to purchase this course.');
      router.push('/login');
      return;
    }

    setPaymentProcessing(true);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 15000); // 15 seconds timeout

    try {
      // Step 1: Create Razorpay order on server
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, courseId: course.id, clientAmount: course.price }),
        signal: abortController.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to create order');

      // Step 2: Open Razorpay checkout
      const options = {
        key: data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Sushant Ghadge Masterclass',
        description: course.title,
        order_id: data.order.id,
        callback_url: `${window.location.origin}/api/payments/callback`,
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
              // Payment verified — update local storage and redirect
              const savedPurchases = localStorage.getItem('purchased_courses');
              let existingIds: string[] = [];
              if (savedPurchases) {
                try {
                  const parsed = JSON.parse(savedPurchases);
                  if (parsed.userId === user.id) {
                    existingIds = parsed.courseIds || [];
                  }
                } catch { /* ignore */ }
              }
              const updatedIds = [...existingIds, course.id];
              localStorage.setItem('purchased_courses', JSON.stringify({ courseIds: updatedIds, userId: user.id }));
              alert('🎉 Payment successful! You will now be redirected to your dashboard downloads section.');
              window.location.href = '/dashboard?tab=downloads';
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
          name: user.name || '',
          email: user.email || '',
        },
        theme: { color: '#a855f7' },
      };

      const rzp = new (window as unknown as Record<string, new (opts: unknown) => { open: () => void }>).Razorpay(options);
      rzp.open();
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(error);
      const errorMessage = error instanceof Error 
        ? (error.name === 'AbortError' ? 'Payment initialization timed out. Please check your internet connection and try again.' : error.message)
        : 'Payment initialization failed. Please try again.';
      alert(`Error: ${errorMessage}`);
      setPaymentProcessing(false);
    }
  };

  if (!course) return null;

  const displayPrice = course.price / 100;
  const originalPrice = course.originalPrice ? course.originalPrice / 100 : null;

  return (
    <div className="floating-course-card-container">
      <div ref={cardRef} className="floating-course-card">
        {/* Thumbnail */}
        <div className="floating-course-thumb" style={{ position: 'relative' }}>
          {course.imageUrl ? (
            <Image src={course.imageUrl} alt={course.title} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} unoptimized />
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
          <div className="floating-course-buy-area">
            <span className="floating-course-buy-price"><strong>₹{displayPrice.toLocaleString()}</strong></span>
            <button
              onClick={handleBuyNow}
              disabled={paymentProcessing}
              className="floating-course-buy-btn"
            >
              {paymentProcessing ? '⏳ Processing...' : 'Buy Now'}
            </button>
          </div>
        </div>

        {/* Shine effect */}
        <div className="floating-course-shine" />
      </div>
    </div>
  );
};
