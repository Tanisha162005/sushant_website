import { db } from '@/db';
import { coupons } from '@/db/schema';
import { Plus, Tag, Percent, Hash } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  let allCoupons: any[] = [];
  try {
    allCoupons = await db.select().from(coupons).orderBy(coupons.createdAt);
  } catch (e) { /* DB not connected */ }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#eef0f6', marginBottom: '0.25rem' }}>Coupons</h2>
          <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Create and manage discount codes</p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.625rem 1.25rem',
          background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
          border: 'none', borderRadius: '10px',
          color: '#fff', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(168,85,247,0.3)',
          fontFamily: "'Poppins', sans-serif",
        }}>
          <Plus style={{ width: 16, height: 16 }} /> Create Coupon
        </button>
      </div>

      {allCoupons.length === 0 ? (
        <div style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px',
          padding: '4rem 2rem', textAlign: 'center',
        }}>
          <Tag style={{ width: 48, height: 48, color: '#6b5e88', margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#a89ec8', marginBottom: '0.25rem' }}>No coupons yet</p>
          <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Create your first discount coupon</p>
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem',
        }}>
          {allCoupons.map((coupon) => (
            <div key={coupon.id} style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px',
              padding: '1.25rem', transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
              e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <code style={{
                  fontSize: '1rem', fontWeight: 800, color: '#D8B4FE',
                  background: 'rgba(168,85,247,0.1)', padding: '4px 12px', borderRadius: '8px',
                  border: '1px solid rgba(168,85,247,0.15)',
                }}>{coupon.code}</code>
                <span style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '0.6875rem', fontWeight: 700,
                  background: coupon.isActive ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)',
                  color: coupon.isActive ? '#4ade80' : '#f87171',
                  border: `1px solid ${coupon.isActive ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>{coupon.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: '#a89ec8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Percent style={{ width: 14, height: 14, color: '#6b5e88' }} />
                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue / 100}`}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Hash style={{ width: 14, height: 14, color: '#6b5e88' }} />
                  {coupon.usedCount}/{coupon.maxUses || '∞'} used
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
