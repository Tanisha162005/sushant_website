import React from 'react';
import Link from 'next/link';

export default function NotFound() {
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
        border: '1px solid rgba(168, 85, 247, 0.25)',
        borderRadius: '24px',
        padding: '3rem',
        maxWidth: '500px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(12px)'
      }}>
        <h1 style={{ fontSize: '6rem', fontWeight: 900, color: '#a855f7', margin: 0, lineHeight: 1 }}>404</h1>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>Page Not Found</h2>
        <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
          The page you are looking for doesn’t exist or has been moved. Let’s get you back on track to your content creation journey.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            padding: '0.75rem 1.75rem',
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.95rem',
            boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
            transition: 'transform 0.2s'
          }}>
            Back to Homepage
          </Link>
          <Link href="/#course" style={{
            padding: '0.75rem 1.75rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#e2e8f0',
            textDecoration: 'none',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.95rem'
          }}>
            Explore Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
