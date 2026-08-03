'use client';
import { useState, useEffect, useRef } from 'react';

interface CourseData {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  imageUrl?: string | null;
  downloadUrl: string | null;
}

interface MobileStickyBuyProps {
  course: CourseData;
  isPurchased: boolean;
  isDownloading: boolean;
  isBuying: boolean;
  onBuyClick: () => void;
  onDownloadClick: () => void;
  purchaseCardRef: React.RefObject<HTMLDivElement | null>;
}

export const MobileStickyBuy = ({
  course,
  isPurchased,
  isDownloading,
  isBuying,
  onBuyClick,
  onDownloadClick,
  purchaseCardRef,
}: MobileStickyBuyProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!purchaseCardRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky CTA when purchase card is NOT visible
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(purchaseCardRef.current);
    return () => observer.disconnect();
  }, [purchaseCardRef]);

  // Hide when payment modal is open or when no course data
  const shouldShow = visible && !isBuying;

  const displayPrice = course.price / 100;
  const originalPrice = course.originalPrice ? (course.originalPrice / 100) : null;

  return (
    <div className={`mobile-sticky-buy ${shouldShow ? 'mobile-sticky-buy-visible' : ''}`}>
      <div className="mobile-sticky-buy-inner">
        <div className="mobile-sticky-buy-price">
          <span className="mobile-sticky-buy-current">₹{displayPrice.toLocaleString()}</span>
          {originalPrice && (
            <span className="mobile-sticky-buy-original">₹{originalPrice.toLocaleString()}</span>
          )}
        </div>
        {isPurchased ? (
          <button
            onClick={onDownloadClick}
            disabled={isDownloading}
            className="mobile-sticky-buy-btn mobile-sticky-buy-btn-download"
          >
            {isDownloading ? '⏳ Downloading...' : '📥 Download'}
          </button>
        ) : (
          <button
            onClick={onBuyClick}
            className="mobile-sticky-buy-btn"
          >
            🚀 Buy Now
          </button>
        )}
      </div>
    </div>
  );
};
