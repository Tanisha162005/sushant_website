'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0B0514 0%, #120A24 50%, #0B0514 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Poppins', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glows */}
      <div style={{
        position: 'absolute', top: '-200px', left: '-200px', width: '500px', height: '500px',
        borderRadius: '50%', background: 'rgba(168, 85, 247, 0.12)', filter: 'blur(120px)', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-200px', right: '-200px', width: '500px', height: '500px',
        borderRadius: '50%', background: 'rgba(124, 58, 237, 0.1)', filter: 'blur(120px)', pointerEvents: 'none'
      }} />

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            width: '72px', height: '72px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)',
          }}
        >
          <Shield style={{ width: 32, height: 32, color: '#fff' }} />
        </div>
        <h1 style={{
          fontSize: '1.875rem', fontWeight: 900, color: '#eef0f6',
          letterSpacing: '-0.025em', marginBottom: '0.5rem',
        }}>
          Admin Portal
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#a89ec8' }}>
          Sign in to manage your platform
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          width: '100%', maxWidth: '420px', padding: '0 1.5rem',
          position: 'relative', zIndex: 1,
        }}
      >
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '24px',
            padding: '2.5rem',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 60px rgba(168, 85, 247, 0.06)',
          }}
        >
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px', padding: '0.875rem 1rem',
              }}>
                <p style={{ fontSize: '0.8125rem', color: '#fca5a5', margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#a89ec8', marginBottom: '0.5rem' }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  width: 18, height: 18, color: '#6b5e88',
                }} />
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  style={{
                    width: '100%', padding: '0.875rem 0.875rem 0.875rem 2.75rem',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', color: '#eef0f6', fontSize: '0.875rem',
                    outline: 'none', transition: 'all 0.3s ease',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#a89ec8', marginBottom: '0.5rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  width: 18, height: 18, color: '#6b5e88',
                }} />
                <input
                  type={showPassword ? 'text' : 'password'} required value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px', color: '#eef0f6', fontSize: '0.875rem',
                    outline: 'none', transition: 'all 0.3s ease',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    color: '#6b5e88', fontSize: '0.8rem', fontWeight: 600,
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#c084fc')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#6b5e88')}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '0.875rem',
                background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                border: 'none', borderRadius: '12px',
                color: '#fff', fontSize: '0.9375rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(168, 85, 247, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                fontFamily: "'Poppins', sans-serif",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.boxShadow = '0 6px 30px rgba(168, 85, 247, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.3)';
              }}
            >
              {loading ? <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} /> : 'Sign in to Dashboard'}
            </button>

            <p style={{ fontSize: '0.75rem', color: '#6b5e88', textAlign: 'center', marginTop: '0.5rem' }}>
              First login will auto-create your account. Default password is <span style={{ color: '#D8B4FE', fontWeight: 600 }}>"admin"</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
