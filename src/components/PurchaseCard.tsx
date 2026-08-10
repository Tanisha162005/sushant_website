'use client';
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

interface PurchaseCardProps {
  course: CourseData;
  isPurchased: boolean;
  isDownloading: boolean;
  onBuyClick: () => void;
  onDownloadClick: () => void;
}

export const PurchaseCard = ({ course, isPurchased, isDownloading, onBuyClick, onDownloadClick }: PurchaseCardProps) => {
  const { t } = useLanguage();

  const displayPrice = course.price / 100;
  const originalPrice = course.originalPrice ? (course.originalPrice / 100) : null;
  const discount = originalPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : null;

  return (
    <div className="purchase-card-wrapper">
      <div className="purchase-card">
        {/* Content */}
        <div className="purchase-card-body" style={{ paddingTop: '1.5rem' }}>
          {/* Title */}
          <h3 className="purchase-card-title" style={{ fontSize: '1.4rem' }}>Enroll Now</h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Get instant lifetime access to the course materials.
          </p>

          {/* Pricing */}
          <div className="purchase-card-pricing" style={{ marginBottom: '1.5rem' }}>
            <span className="purchase-card-price">₹{displayPrice.toLocaleString()}</span>
            {originalPrice && (
              <span className="purchase-card-original">₹{originalPrice.toLocaleString()}</span>
            )}
            {discount && (
              <span className="purchase-card-discount">{discount}% OFF</span>
            )}
          </div>

          {/* CTA Button */}
          {isPurchased ? (
            <button
              onClick={onDownloadClick}
              disabled={isDownloading}
              className="purchase-card-btn purchase-card-btn-download"
            >
              <span>{isDownloading ? '⏳' : '📥'}</span>
              {isDownloading ? 'Downloading...' : 'Download Course'}
            </button>
          ) : (
            <button
              onClick={onBuyClick}
              className="purchase-card-btn purchase-card-btn-buy"
            >
              <span>🚀</span>
              {t('enrollNow')} — ₹{displayPrice.toLocaleString()}
            </button>
          )}

          {/* Trust badges */}
          <div className="purchase-card-trust" style={{ marginTop: '1.5rem' }}>
            <span className="purchase-card-trust-icon">🔒</span>
            <span>Secured by Razorpay · 256-bit SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
};

