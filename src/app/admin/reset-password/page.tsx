'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Shield, Lock, Loader2, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

function AdminResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'invalid'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || token.length < 32) {
      setStatus('invalid');
      setMessage('This password reset link is invalid or has expired. Please request a new one.');
    }
  }, [token]);

  const passwordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid || !passwordsMatch) return;
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Your password has been reset successfully.');
      } else {
        setStatus('error');
        setMessage(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  const inputBaseStyle = {
    width: '100%', padding: '0.875rem 2.75rem 0.875rem 2.75rem',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', color: '#eef0f6', fontSize: '0.875rem',
    outline: 'none', transition: 'all 0.3s ease', fontFamily: "'Poppins', sans-serif",
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0B0514 0%, #120A24 50%, #0B0514 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Poppins', sans-serif",
        position: 'relative', overflow: 'hidden',
      }}
    >
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
        <div style={{
          width: '72px', height: '72px', borderRadius: '20px',
          background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
          boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)',
        }}>
          <Shield style={{ width: 32, height: 32, color: '#fff' }} />
        </div>
        <h1 style={{
          fontSize: '1.875rem', fontWeight: 900, color: '#eef0f6',
          letterSpacing: '-0.025em', marginBottom: '0.5rem',
        }}>
          Reset Password
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#a89ec8' }}>
          Set a new password for your admin account
        </p>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '420px', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', padding: '2.5rem',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 60px rgba(168, 85, 247, 0.06)',
        }}>
          {/* Invalid Token */}
          {status === 'invalid' && (
            <div>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem',
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
              }}>
                <AlertCircle style={{ width: 20, height: 20, color: '#fca5a5', flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontSize: '0.8125rem', color: '#fca5a5', margin: 0, lineHeight: 1.5 }}>{message}</p>
              </div>
              <Link href="/admin/forgot-password" style={{
                width: '100%', padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                border: 'none', borderRadius: '12px', color: '#fff', fontSize: '0.9375rem', fontWeight: 700,
                textDecoration: 'none', fontFamily: "'Poppins', sans-serif",
                boxShadow: '0 4px 20px rgba(168, 85, 247, 0.3)',
              }}>
                Request New Reset Link
              </Link>
            </div>
          )}

          {/* Success */}
          {status === 'success' && (
            <div>
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem',
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
              }}>
                <CheckCircle style={{ width: 20, height: 20, color: '#86efac', flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontSize: '0.8125rem', color: '#86efac', margin: 0, lineHeight: 1.5 }}>{message}</p>
              </div>
              <Link href="/admin/login" style={{
                width: '100%', padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                border: 'none', borderRadius: '12px', color: '#fff', fontSize: '0.9375rem', fontWeight: 700,
                textDecoration: 'none', fontFamily: "'Poppins', sans-serif",
                boxShadow: '0 4px 20px rgba(168, 85, 247, 0.3)',
              }}>
                Go to Admin Login
              </Link>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px', padding: '0.875rem 1rem', marginBottom: '1.5rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}>
              <AlertCircle style={{ width: 18, height: 18, color: '#fca5a5', flexShrink: 0 }} />
              <p style={{ fontSize: '0.8125rem', color: '#fca5a5', margin: 0 }}>{message}</p>
            </div>
          )}

          {/* Form */}
          {(status === 'idle' || status === 'loading' || status === 'error') && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#a89ec8', marginBottom: '0.5rem' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#6b5e88' }} />
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    disabled={status === 'loading'}
                    style={{ ...inputBaseStyle, opacity: status === 'loading' ? 0.7 : 1 }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                      color: '#6b5e88', transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#c084fc')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#6b5e88')}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
                <p style={{
                  marginTop: '6px', fontSize: '0.75rem',
                  color: password.length === 0 ? '#6b5e88' : passwordValid ? '#86efac' : '#fca5a5'
                }}>
                  • Minimum 6 characters {password.length > 0 && (passwordValid ? '✓' : '✗')}
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#a89ec8', marginBottom: '0.5rem' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#6b5e88' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                    disabled={status === 'loading'}
                    style={{ ...inputBaseStyle, opacity: status === 'loading' ? 0.7 : 1 }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                      color: '#6b5e88', transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#c084fc')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#6b5e88')}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p style={{ marginTop: '6px', fontSize: '0.75rem', color: passwordsMatch ? '#86efac' : '#fca5a5' }}>
                    {passwordsMatch ? '• Passwords match ✓' : '• Passwords do not match ✗'}
                  </p>
                )}
              </div>

              <button
                type="submit" disabled={status === 'loading' || !passwordValid || !passwordsMatch}
                style={{
                  width: '100%', padding: '0.875rem',
                  background: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
                  border: 'none', borderRadius: '12px',
                  color: '#fff', fontSize: '0.9375rem', fontWeight: 700,
                  cursor: (status === 'loading' || !passwordValid || !passwordsMatch) ? 'not-allowed' : 'pointer',
                  opacity: (status === 'loading' || !passwordValid || !passwordsMatch) ? 0.7 : 1,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(168, 85, 247, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                {status === 'loading' ? <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} /> : 'Reset Password'}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link href="/admin/login" style={{
              fontSize: '0.8125rem', color: '#a89ec8', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              transition: 'color 0.2s',
            }}>
              <ArrowLeft style={{ width: 14, height: 14 }} />
              Back to Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0B0514', color: '#a89ec8', fontFamily: "'Poppins', sans-serif",
      }}>
        Loading...
      </div>
    }>
      <AdminResetPasswordForm />
    </Suspense>
  );
}
