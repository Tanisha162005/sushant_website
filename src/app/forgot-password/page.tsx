'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Background3D } from '@/components/Background3D';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { t, lang, toggleLang } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      setStatus('success');
      setMessage(data.message || 'If an account exists with this email, a password reset link has been sent.');
    } catch {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-primary)',
      padding: '20px'
    }}>
      <Background3D />
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]" 
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      {/* Language Toggle */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 50 }}>
        <div
          onClick={toggleLang}
          className="glass-panel hover-lift"
          style={{
            fontSize: '11px', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '9999px', padding: '0.4rem 1rem',
            display: 'flex', gap: '0.5rem', fontWeight: 700, cursor: 'pointer',
          }}
        >
          <span style={{ color: lang === 'mr' ? '#fff' : '#6b7280', transition: 'color 0.2s' }}>मराठी</span>
          <span style={{ color: lang === 'en' ? '#fff' : '#6b7280', transition: 'color 0.2s' }}>ENG</span>
        </div>
      </div>

      {/* Card */}
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '440px', padding: '2.5rem 2rem',
        borderRadius: '24px', position: 'relative', zIndex: 10,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(168, 85, 247, 0.1)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      }}>
        {/* Logo & Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '12px',
            marginBottom: '1.5rem', textDecoration: 'none'
          }}>
            <span style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: '20px',
              fontFamily: 'var(--font-english-heading)',
              boxShadow: '0 4px 20px var(--glow-purple)'
            }}>S</span>
            <span style={{
              fontSize: '1.4rem', fontWeight: 800,
              fontFamily: 'var(--font-marathi-heading)',
              background: 'linear-gradient(135deg, #ffffff 0%, #9ca3af 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}>Sushant Ghadge</span>
          </Link>

          <h1 style={{
            fontSize: 'clamp(1.5rem, 6vw, 2rem)', fontWeight: 900,
            fontFamily: 'var(--font-marathi-heading)',
            lineHeight: 1.1, marginBottom: '8px', color: 'var(--text-primary)'
          }}>
            {lang === 'mr' ? 'पासवर्ड विसरलात?' : 'Forgot Password?'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {lang === 'mr' 
              ? 'तुमचा ईमेल एंटर करा, आम्ही तुम्हाला रिसेट लिंक पाठवू.' 
              : 'Enter your email and we\'ll send you a reset link.'}
          </p>
        </div>

        {/* Success State */}
        {status === 'success' && (
          <div style={{
            marginBottom: '20px', padding: '16px',
            borderRadius: '12px', background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            color: '#86efac', fontSize: '0.85rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <span style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'rgba(34,197,94,0.2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>✓</span>
            {message}
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div style={{
            marginBottom: '20px', padding: '14px 16px',
            borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#fca5a5', fontSize: '0.85rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <span style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'rgba(239,68,68,0.2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>!</span>
            {message}
          </div>
        )}

        {/* Form */}
        {status !== 'success' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{
                display: 'block', fontSize: '0.75rem', fontWeight: 600,
                color: 'var(--text-secondary)', marginBottom: '8px',
                textTransform: 'uppercase', letterSpacing: '1px',
                fontFamily: 'var(--font-english)'
              }}>
                {t('emailAddress')} *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={status === 'loading'}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--text-primary)', fontSize: '0.95rem',
                  outline: 'none', transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                  opacity: status === 'loading' ? 0.7 : 1,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.05), inset 0 2px 4px rgba(0,0,0,0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2)';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-primary"
              style={{
                width: '100%', padding: '16px', marginTop: '8px',
                borderRadius: '12px', fontSize: '1rem', justifyContent: 'center',
                opacity: status === 'loading' ? 0.7 : 1,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)'
              }}
            >
              {status === 'loading' 
                ? (lang === 'mr' ? 'पाठवत आहे...' : 'Sending...') 
                : (lang === 'mr' ? 'रिसेट लिंक पाठवा' : 'Send Reset Link')}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <p style={{
          marginTop: '32px', textAlign: 'center',
          fontSize: '0.85rem', color: 'var(--text-muted)'
        }}>
          <Link href="/login" style={{
            color: 'var(--accent-orange)', fontWeight: 700, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '6px'
          }}>
            ← {lang === 'mr' ? 'लॉगिन वर परत जा' : 'Back to Login'}
          </Link>
        </p>
      </div>
    </div>
  );
}
