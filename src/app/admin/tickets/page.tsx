import { db } from '@/db';
import { supportTickets, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { MessageSquare, Clock, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminTicketsPage() {
  let allTickets: any[] = [];
  try {
    allTickets = await db.select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      description: supportTickets.description,
      status: supportTickets.status,
      createdAt: supportTickets.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.userId, users.id))
    .orderBy(supportTickets.createdAt);
  } catch (e) { /* DB not connected */ }

  const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
    open: { bg: 'rgba(250,204,21,0.08)', text: '#facc15', border: 'rgba(250,204,21,0.2)' },
    in_progress: { bg: 'rgba(99,102,241,0.08)', text: '#818cf8', border: 'rgba(99,102,241,0.2)' },
    resolved: { bg: 'rgba(74,222,128,0.08)', text: '#4ade80', border: 'rgba(74,222,128,0.2)' },
    closed: { bg: 'rgba(107,94,136,0.1)', text: '#6b5e88', border: 'rgba(107,94,136,0.2)' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#eef0f6', marginBottom: '0.25rem' }}>Support Tickets</h2>
        <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Manage user queries and issues</p>
      </div>

      {allTickets.length === 0 ? (
        <div style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px',
          padding: '4rem 2rem', textAlign: 'center',
        }}>
          <MessageSquare style={{ width: 48, height: 48, color: '#6b5e88', margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#a89ec8', marginBottom: '0.25rem' }}>No support tickets</p>
          <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Tickets from users will appear here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {allTickets.map((ticket) => {
            const ss = statusStyle[ticket.status] || statusStyle.open;
            return (
              <div key={ticket.id} style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px',
                padding: '1.25rem', transition: 'all 0.3s ease', cursor: 'pointer',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)'}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#eef0f6', margin: 0 }}>{ticket.subject}</h3>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '0.6875rem', fontWeight: 700,
                    background: ss.bg, color: ss.text, border: `1px solid ${ss.border}`,
                    textTransform: 'capitalize', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>{ticket.status.replace('_', ' ')}</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#a89ec8', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                  {ticket.description?.slice(0, 120)}{ticket.description?.length > 120 ? '...' : ''}
                </p>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: '#6b5e88' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <User style={{ width: 12, height: 12 }} />
                    {ticket.userName || 'Unknown'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Clock style={{ width: 12, height: 12 }} />
                    {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
