/**
 * Coming Soon Component — Apple-Style Premium Glassmorphism & GSAP Interactions
 * =============================================================================
 * Features implemented EXACTLY as per reference image:
 * 1. Two massive, soft, perfectly circular glowing orbs (Cyan left, Purple right).
 * 2. Dark, solid glassmorphism card (rgba 15,15,15) with subtle border.
 * 3. Exact typography, spacing, and sizing.
 * 4. GSAP Parallax so the two orbs shift smoothly when the mouse moves.
 * 5. Button magnetic effect & 3D tilt.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

// ─── Font Setup ─────────────────────────────────────────────────────────────
const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

  :root {
    --font-heading: 'Space Grotesk', sans-serif;
    --font-body: 'Plus Jakarta Sans', sans-serif;
  }
`;

type Language = 'en' | 'mr';

const content = {
  en: {
    badge: '+ COMING SOON',
    headline: 'Something Big for\nContent Creators is\nComing',
    subheadline:
      'Register your email to get Early Access before the official launch of\nthe masterclass.',
    placeholder: 'Enter your email address',
    cta: 'Notify Me First',
    success: "Thank you! You're on the list.",
    duplicate: "You're already subscribed.",
    invalidEmail: 'Please enter a valid email.',
    serverError: 'Something went wrong. Please try again.',
    sending: 'Subscribing...',
    langToggle: 'मराठी',
    days: 'DAYS',
    hours: 'HRS',
    minutes: 'MIN',
    seconds: 'SEC',
  },
  mr: {
    badge: '+ लवकरच येत आहे',
    headline: 'कंटेंट क्रिएटर्ससाठी\nकाहीतरी मोठं\nयेतंय!',
    subheadline:
      'मास्टरक्लास अधिकृतपणे लॉन्च होण्याआधी Early Access मिळवण्यासाठी\nतुमची ईमेल नोंदवा.',
    placeholder: 'तुमचा ईमेल प्रविष्ट करा',
    cta: 'मला आधी कळवा',
    success: 'धन्यवाद! तुमची नोंदणी यशस्वीरित्या झाली.',
    duplicate: 'तुम्ही आधीच नोंदणी केली आहे.',
    invalidEmail: 'कृपया वैध ईमेल प्रविष्ट करा.',
    serverError: 'काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.',
    sending: 'नोंदणी होत आहे...',
    langToggle: 'English',
    days: 'दिवस',
    hours: 'तास',
    minutes: 'मिनिटे',
    seconds: 'सेकंद',
  },
};

// ─── Component ───────────────────────────────────────────────────────────────
export function ComingSoon() {
  const [lang, setLang] = useState<Language>('en');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'duplicate'>('idle');
  const [message, setMessage] = useState('');
  const t = content[lang];

  // DOM Refs for GSAP
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Stagger targets
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Staggered Entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      tl.from(cardRef.current, {
        opacity: 0,
        scale: 0.95,
        y: 40,
        duration: 1,
        ease: 'power3.out',
      })
      .from(
        [
          badgeRef.current,
          headlineRef.current,
          subheadRef.current,
          formRef.current,
        ],
        {
          opacity: 0,
          y: 20,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power2.out',
        },
        '-=0.6'
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // 3D Tilt, Parallax, Magnetic Button
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const nx = (e.clientX / innerWidth) * 2 - 1;
      const ny = -(e.clientY / innerHeight) * 2 + 1;

      // 3D Perspective Tilt
      gsap.to(cardRef.current, {
        rotateX: ny * 4, // Subtle tilt
        rotateY: nx * 4,
        transformPerspective: 1200,
        ease: 'power2.out',
        duration: 0.5,
      });

      // Mouse-Lag Parallax on Orbs (Inverse Motion & Power2 Easing)
      // Ball 1 moves Right/Up when mouse moves Right/Up.
      gsap.to(orb1Ref.current, { x: nx * 400, y: -ny * 400, ease: 'power2.out', duration: 2 });
      // Ball 2 moves Left/Down when mouse moves Right/Up (Inverse Depth).
      gsap.to(orb2Ref.current, { x: nx * -400, y: -ny * -400, ease: 'power2.out', duration: 2 });

      // Magnetic Attraction (Button)
      if (buttonRef.current) {
        const btn = buttonRef.current;
        const rect = btn.getBoundingClientRect();
        const btnCenterX = rect.left + rect.width / 2;
        const btnCenterY = rect.top + rect.height / 2;
        
        const distX = e.clientX - btnCenterX;
        const distY = e.clientY - btnCenterY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        const gravityRadius = 150;

        if (distance < gravityRadius) {
          const pullStrength = 0.3;
          gsap.to(btn, {
            x: distX * pullStrength,
            y: distY * pullStrength,
            ease: 'power2.out',
            duration: 0.3,
            overwrite: true,
          });
        } else {
          // Elastic Snapping
          gsap.to(btn, {
            x: 0,
            y: 0,
            ease: 'elastic.out(1, 0.3)',
            duration: 1.2,
            overwrite: true,
          });
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const toggleLanguage = () => setLang((prev) => (prev === 'en' ? 'mr' : 'en'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus('error');
      setMessage(t.invalidEmail);
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, language: lang }),
      });
      const data = await res.json();
      if (res.status === 201) {
        setStatus('success');
        setMessage(data.message || t.success);
        setEmail('');
      } else if (res.status === 409) {
        setStatus('duplicate');
        setMessage(data.message || t.duplicate);
      } else {
        setStatus('error');
        setMessage(data.message || t.invalidEmail);
      }
    } catch {
      setStatus('error');
      setMessage(t.serverError);
    }
  };

  return (
    <>
      <style>{fontStyles}</style>
      <style>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #030305; /* Deep pure black */
        }

        /* 
         * A. Liquid Morphing: 8 different border-radius values breathing over time.
         * B. Diffusion Glow: 80px blur to create an atmosphere, not a ball.
         */
        @keyframes morph {
          0% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
          33% { border-radius: 58% 42% 75% 25% / 76% 46% 54% 24%; }
          66% { border-radius: 50% 50% 33% 67% / 55% 27% 73% 45%; }
          100% { border-radius: 33% 67% 58% 42% / 63% 68% 32% 37%; }
        }

        .cs-orb-1 {
          position: absolute;
          width: 20vw;
          height: 20vw;
          left: 5vw;
          top: 15vh;
          background-color: rgba(0, 212, 255, 0.20); /* Cyan atmosphere */
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
          animation: morph 12s ease-in-out infinite alternate;
        }

        .cs-orb-2 {
          position: absolute;
          width: 25vw;
          height: 25vw;
          right: 5vw;
          bottom: 0vh;
          background-color: rgba(112, 0, 255, 0.25); /* Purple atmosphere */
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
          animation: morph 14s ease-in-out infinite alternate;
        }

        .cs-input::placeholder {
          color: #777777;
        }
      `}</style>

      <div
        ref={containerRef}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflowX: 'hidden',
          overflowY: 'auto',
          backgroundColor: '#030305',
          fontFamily: 'var(--font-body)',
          color: '#ffffff',
          padding: '100px 16px 40px 16px',
          perspective: '1200px',
        }}
      >
        {/* Orbs */}
        <div ref={orb1Ref} className="cs-orb-1" />
        <div ref={orb2Ref} className="cs-orb-2" />

        {/* ── Top Navigation ──────────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: 'clamp(20px, 5vw, 32px) clamp(20px, 5vw, 48px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Logo */}
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '-0.5px',
              display: 'flex',
              gap: '4px',
            }}
          >
            <span style={{ color: '#ffffff' }}>SUSHANT</span>
            <span style={{ color: '#7000ff' }}>GHADGE</span>
          </div>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: lang === 'en' ? "var(--font-marathi, 'Hind', sans-serif)" : 'var(--font-body)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.08)';
            }}
          >
            {t.langToggle}
          </button>
        </div>

        {/* ── Main Glassmorphism Card ─────────────────────────── */}
        <div
          ref={cardRef}
          style={{
            width: '100%',
            maxWidth: '760px',
            background: 'rgba(10, 10, 12, 0.6)', /* Dark transparent glass */
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 'clamp(24px, 5vw, 40px)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            padding: 'clamp(40px, 8vw, 80px) clamp(20px, 5vw, 48px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 10,
            boxShadow: '0 40px 80px rgba(0, 0, 0, 0.6)',
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        >
          {/* Badge */}
          <div
            ref={badgeRef}
            style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              border: '1px solid #3b1666', 
              color: '#9d4edd',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1.5px',
              marginBottom: 'clamp(24px, 5vw, 40px)',
              fontFamily: lang === 'en' ? 'var(--font-english-heading, "Outfit")' : 'var(--font-marathi-heading, "Baloo 2")',
              textTransform: 'uppercase',
              background: '#1a0b2e',
            }}
          >
            {t.badge}
          </div>

          {/* Headline */}
          <h1
            ref={headlineRef}
            style={{
              fontFamily: lang === 'en' ? 'var(--font-english-heading, "Outfit")' : 'var(--font-marathi-heading, "Baloo 2")',
              fontSize: 'clamp(32px, 8vw, 64px)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-1px',
              marginBottom: 'clamp(16px, 4vw, 24px)',
              whiteSpace: 'pre-line',
              color: '#ffffff',
            }}
          >
            {t.headline}
          </h1>

          {/* Subheadline */}
          <p
            ref={subheadRef}
            style={{
              fontFamily: lang === 'en' ? 'var(--font-english, "Inter")' : 'var(--font-marathi, "Hind")',
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#888888',
              marginBottom: 'clamp(32px, 6vw, 64px)',
              whiteSpace: 'pre-line',
              maxWidth: '540px',
            }}
          >
            {t.subheadline}
          </p>

          {/* Form */}
          <div ref={formRef} style={{ width: '100%', maxWidth: '440px' }}>
            {status === 'success' ? (
              <div style={{ padding: '24px', color: '#00d4ff', fontSize: '15px', fontWeight: 500 }}>
                {message}
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input
                  className="cs-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status !== 'idle' && status !== 'loading') setStatus('idle');
                  }}
                  placeholder={t.placeholder}
                  disabled={status === 'loading'}
                  required
                  style={{
                    width: '100%',
                    padding: 'clamp(16px, 4vw, 20px) clamp(16px, 4vw, 24px)',
                    borderRadius: '16px',
                    border: '1px solid #222222',
                    background: '#161616',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#444444'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#222222'}
                />
                
                {/* Magnetic Button */}
                <div style={{ position: 'relative', width: '100%', marginTop: '4px' }}>
                  <button
                    ref={buttonRef}
                    type="submit"
                    disabled={status === 'loading'}
                    style={{
                      width: '100%',
                      padding: 'clamp(16px, 4vw, 20px) clamp(16px, 4vw, 24px)',
                      borderRadius: '16px',
                      border: 'none',
                      background: '#ffffff',
                      color: '#000000',
                      fontSize: '16px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-heading)',
                      cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                      willChange: 'transform',
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    {status === 'loading' ? t.sending : t.cta}
                  </button>
                </div>

                {/* Error messages */}
                {(status === 'error' || status === 'duplicate') && message && (
                  <p style={{ color: '#ff3366', fontSize: '14px', margin: 0, marginTop: '8px' }}>
                    {message}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
