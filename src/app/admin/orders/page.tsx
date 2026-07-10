import { db } from '@/db';
import { payments, users, courses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Receipt, ShoppingCart } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  let allOrders: any[] = [];
  try {
    allOrders = await db.select({
      id: payments.id,
      amount: payments.amount,
      status: payments.status,
      createdAt: payments.createdAt,
      razorpayOrderId: payments.razorpayOrderId,
      userName: users.name,
      userEmail: users.email,
      courseTitle: courses.title,
    })
    .from(payments)
    .leftJoin(users, eq(payments.userId, users.id))
    .leftJoin(courses, eq(payments.courseId, courses.id))
    .orderBy(payments.createdAt);
  } catch (e) { /* DB not connected */ }

  const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
    successful: { bg: 'rgba(74,222,128,0.08)', text: '#4ade80', border: 'rgba(74,222,128,0.2)' },
    created: { bg: 'rgba(250,204,21,0.08)', text: '#facc15', border: 'rgba(250,204,21,0.2)' },
    failed: { bg: 'rgba(239,68,68,0.08)', text: '#f87171', border: 'rgba(239,68,68,0.2)' },
    refunded: { bg: 'rgba(99,102,241,0.08)', text: '#818cf8', border: 'rgba(99,102,241,0.2)' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#eef0f6', marginBottom: '0.25rem' }}>Orders & Payments</h2>
        <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Track all Razorpay transactions</p>
      </div>

      {/* Table */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px', overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Order ID', 'Customer', 'Course', 'Status', 'Amount'].map((h) => (
                  <th key={h} style={{
                    padding: '0.875rem 1.25rem',
                    textAlign: h === 'Amount' ? 'right' : 'left',
                    fontSize: '0.6875rem', fontWeight: 700,
                    color: '#6b5e88', textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
                    <ShoppingCart style={{ width: 40, height: 40, color: '#6b5e88', margin: '0 auto 1rem' }} />
                    <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#a89ec8', marginBottom: '0.25rem' }}>No orders yet</p>
                    <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Orders will appear here after a student makes a purchase</p>
                  </td>
                </tr>
              ) : (
                allOrders.map((order) => {
                  const ss = statusStyle[order.status] || statusStyle.created;
                  return (
                    <tr key={order.id} style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a89ec8', fontFamily: 'monospace' }}>
                          {order.razorpayOrderId?.slice(0, 20)}...
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#eef0f6', margin: '0 0 2px' }}>{order.userName}</p>
                        <p style={{ fontSize: '0.75rem', color: '#6b5e88', margin: 0 }}>{order.userEmail}</p>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.8125rem', color: '#a89ec8' }}>
                        {order.courseTitle || '—'}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px',
                          borderRadius: '20px', fontSize: '0.6875rem', fontWeight: 700,
                          background: ss.bg, color: ss.text, border: `1px solid ${ss.border}`,
                          textTransform: 'capitalize',
                        }}>{order.status}</span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontSize: '0.9375rem', fontWeight: 800, color: '#D8B4FE' }}>
                        ₹{(order.amount / 100).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
