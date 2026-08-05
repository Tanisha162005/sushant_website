'use client';
import React, { useState, useEffect } from 'react';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('online', handleOnline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('online', handleOnline);
      }
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 99999,
        background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
        border: '1px solid #ef4444',
        boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
        padding: '12px 20px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: '#f8fafc',
        fontFamily: "'Poppins', sans-serif",
        fontSize: '0.9rem',
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>⚠️</span>
      <div>
        <strong style={{ display: 'block', fontWeight: 600, color: '#fca5a5' }}>You appear offline</strong>
        <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Please check your internet connection.</span>
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid #ef4444',
          color: '#f8fafc',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '0.8rem',
          cursor: 'pointer',
          fontWeight: 600,
          transition: 'background 0.2s',
        }}
      >
        Retry
      </button>
    </div>
  );
};
