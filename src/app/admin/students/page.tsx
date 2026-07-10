import { db } from '@/db';
import { users } from '@/db/schema';
import { Mail, Phone, Calendar, UserCircle } from 'lucide-react';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage() {
  let allUsers: any[] = [];
  try {
    allUsers = await db.select().from(users).where(sql`${users.role} = 'user'`).orderBy(users.createdAt);
  } catch (e) { /* DB not connected */ }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#eef0f6', marginBottom: '0.25rem' }}>Students</h2>
        <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Track registered students and their details</p>
      </div>

      {/* Student Grid */}
      {allUsers.length === 0 ? (
        <div style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px', padding: '4rem 2rem',
          textAlign: 'center',
        }}>
          <UserCircle style={{ width: 48, height: 48, color: '#6b5e88', margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#a89ec8', marginBottom: '0.25rem' }}>No students found</p>
          <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Students will appear here after they register</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        }}>
          {allUsers.map((user) => (
            <div key={user.id} style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px', padding: '1.25rem',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
              e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(168,85,247,0.08)';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontWeight: 800, color: '#fff',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                }}>
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#eef0f6' }}>{user.name}</p>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: '20px',
                    fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase',
                    background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                    border: '1px solid rgba(99,102,241,0.15)',
                  }}>Student</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#a89ec8' }}>
                  <Mail style={{ width: 14, height: 14, color: '#6b5e88' }} />
                  {user.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#a89ec8' }}>
                  <Phone style={{ width: 14, height: 14, color: '#6b5e88' }} />
                  {user.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#6b5e88' }}>
                  <Calendar style={{ width: 14, height: 14, color: '#6b5e88' }} />
                  Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
