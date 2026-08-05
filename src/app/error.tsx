'use client';
import React, { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception to logging utility / monitoring in production
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0c0714 0%, #170b28 50%, #0c0714 100%)',
      color: '#ffffff',
      fontFamily: "'Poppins', sans-serif",
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(30, 20, 60, 0.6)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '24px',
        padding: '3rem',
        maxWidth: '520px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem', color: '#f8fafc' }}>Something went wrong</h2>
        <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
          An unexpected error occurred while processing your request. Don't worry—your account and purchase history remain completely secure and intact.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.75rem',
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}
