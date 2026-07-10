import { db } from '@/db';
import { webinars } from '@/db/schema';
import { Plus, Video, Calendar, Link2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminWebinarsPage() {
  let allWebinars: any[] = [];
  try {
    allWebinars = await db.select().from(webinars).orderBy(webinars.scheduledAt);
  } catch (e) { /* DB not connected */ }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#eef0f6', marginBottom: '0.25rem' }}>Webinars</h2>
          <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Schedule and manage webinars</p>
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
          <Plus style={{ width: 16, height: 16 }} /> Schedule Webinar
        </button>
      </div>

      {allWebinars.length === 0 ? (
        <div style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px',
          padding: '4rem 2rem', textAlign: 'center',
        }}>
          <Video style={{ width: 48, height: 48, color: '#6b5e88', margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#a89ec8', marginBottom: '0.25rem' }}>No webinars scheduled</p>
          <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Create your first webinar to get started</p>
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem',
        }}>
          {allWebinars.map((webinar) => {
            const isPast = new Date(webinar.scheduledAt) < new Date();
            return (
              <div key={webinar.id} style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px',
                padding: '1.5rem', transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)'}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#eef0f6', margin: 0 }}>{webinar.title}</h3>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0,
                    background: isPast ? 'rgba(107,94,136,0.1)' : 'rgba(74,222,128,0.08)',
                    color: isPast ? '#6b5e88' : '#4ade80',
                    border: `1px solid ${isPast ? 'rgba(107,94,136,0.2)' : 'rgba(74,222,128,0.2)'}`,
                  }}>{isPast ? 'Completed' : 'Upcoming'}</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#a89ec8', marginBottom: '1rem', lineHeight: 1.6 }}>
                  {webinar.description?.slice(0, 100)}{webinar.description?.length > 100 ? '...' : ''}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8125rem', color: '#a89ec8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Calendar style={{ width: 14, height: 14, color: '#6b5e88' }} />
                    {new Date(webinar.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  {webinar.price > 0 && (
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#D8B4FE' }}>
                      ₹{(webinar.price / 100).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
