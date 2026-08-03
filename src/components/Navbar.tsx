'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

export const Navbar = () => {
  const { t, lang, toggleLang } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('#home');

  const navLinks = [
    { href: '#home', label: t('footerHome') },
    { href: '#about', label: t('footerAbout') },
    { href: '#video', label: 'Video' },
    { href: '#course', label: t('footerCourse') },
    { href: '#brands', label: t('footerBrands') },
    { href: '#faq', label: t('footerFaq') },
  ];

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 50);

    // Scroll progress
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    setScrollProgress(progress);

    // Active section detection
    const sections = navLinks.map(l => l.href.replace('#', ''));
    let current = '#home';
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 150) {
          current = `#${id}`;
        }
      }
    }
    setActiveSection(current);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const closeMenu = () => setMobileMenuOpen(false);

  const scrollTo = (href: string) => {
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />

      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 50,
          transition: 'all 0.4s ease',
          backgroundColor: scrolled ? 'rgba(5, 10, 24, 0.9)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '80rem',
            margin: '0 auto',
            width: '100%',
            padding: '1.25rem 2.5rem',
          }}
        >
          {/* Logo — Gradient first letter */}
          <Link href="/" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', position: 'relative', zIndex: 60 }}>
            <img src="/logo.png" alt="Sushant Ghadge Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            <span style={{
              fontSize: '1.6rem',
              fontWeight: 900,
              letterSpacing: '-0.025em',
              color: '#fff',
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #A855F7, #D8B4FE)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>S</span>ushant <span style={{
                background: 'linear-gradient(135deg, #A855F7, #D8B4FE)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>G</span>hadge
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '2.5rem' }}>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={pathname === '/' ? link.href : `/${link.href}`}
                onClick={(e) => {
                  if (pathname === '/') {
                    e.preventDefault();
                    scrollTo(link.href);
                  }
                }}
                className={activeSection === link.href ? 'nav-link-active' : ''}
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: activeSection === link.href ? '#c084fc' : '#9ca3af',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#c084fc')}
                onMouseLeave={(e) => (e.currentTarget.style.color = activeSection === link.href ? '#c084fc' : '#9ca3af')}
              >
                {link.label}
                {activeSection === link.href && (
                  <span style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: '#c084fc',
                    boxShadow: '0 0 8px rgba(192, 132, 252, 0.6)',
                  }} />
                )}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '1.25rem' }}>
            {user ? (
              <Link
                href="/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#fff',
                  textDecoration: 'none',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#a855f7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#fff',
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/login"
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#9ca3af',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#c084fc')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
              >
                Sign In
              </Link>
            )}

            {/* Join Course Button */}
            <a
              href={pathname === '/' ? '#course' : '/#course'}
              onClick={(e) => {
                if (pathname === '/') {
                  e.preventDefault();
                  scrollTo('#course');
                }
              }}
              style={{
                backgroundColor: '#fff',
                color: '#000',
                padding: '0.625rem 1.5rem',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: 800,
                textDecoration: 'none',
                transition: 'all 0.3s',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#c084fc';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.color = '#000';
              }}
            >
              {t('joinCourse')}
            </a>

            {/* Language Toggle */}
            <div
              onClick={toggleLang}
              style={{
                fontSize: '11px',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '9999px',
                padding: '0.25rem 0.75rem',
                display: 'flex',
                gap: '0.5rem',
                fontWeight: 700,
                backgroundColor: 'rgba(255,255,255,0.05)',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
            >
              <span style={{ color: lang === 'mr' ? '#fff' : '#6b7280', transition: 'color 0.2s' }}>मरा</span>
              <span style={{ color: lang === 'en' ? '#fff' : '#6b7280', transition: 'color 0.2s' }}>ENG</span>
            </div>
          </div>

          {/* Mobile Right */}
          <div className="flex md:hidden" style={{ alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 60 }}>
            <div
              onClick={toggleLang}
              style={{
                fontSize: '10px',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '9999px',
                padding: '0.2rem 0.5rem',
                display: 'flex',
                gap: '0.375rem',
                fontWeight: 700,
                backgroundColor: 'rgba(255,255,255,0.05)',
                cursor: 'pointer',
              }}
            >
              <span style={{ color: lang === 'mr' ? '#fff' : '#6b7280' }}>मरा</span>
              <span style={{ color: lang === 'en' ? '#fff' : '#6b7280' }}>ENG</span>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                padding: '4px',
              }}
              aria-label="Menu"
            >
              <span style={{ display: 'block', width: '22px', height: '2px', backgroundColor: '#fff', borderRadius: '2px', transition: 'all 0.3s', transform: mobileMenuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
              <span style={{ display: 'block', width: '22px', height: '2px', backgroundColor: '#fff', borderRadius: '2px', transition: 'all 0.3s', opacity: mobileMenuOpen ? 0 : 1 }} />
              <span style={{ display: 'block', width: '22px', height: '2px', backgroundColor: '#fff', borderRadius: '2px', transition: 'all 0.3s', transform: mobileMenuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          backgroundColor: 'rgba(5, 10, 24, 0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          transition: 'opacity 0.4s ease',
          opacity: mobileMenuOpen ? 1 : 0,
          pointerEvents: mobileMenuOpen ? 'auto' : 'none',
        }}
        className="md:hidden"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={pathname === '/' ? link.href : `/${link.href}`}
              onClick={(e) => {
                if (pathname === '/') {
                  e.preventDefault();
                  scrollTo(link.href);
                }
                closeMenu();
              }}
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: activeSection === link.href ? '#c084fc' : '#fff',
                textDecoration: 'none',
                letterSpacing: '0.5px',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
        {user ? (
          <Link
            href="/dashboard"
            onClick={closeMenu}
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#c084fc',
              textDecoration: 'none',
            }}
          >
            Dashboard ({user.name})
          </Link>
        ) : (
          <Link
            href="/login"
            onClick={closeMenu}
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.85)',
              textDecoration: 'none',
            }}
          >
            Sign In
          </Link>
        )}
        <a
          href="#course"
          onClick={(e) => {
            e.preventDefault();
            closeMenu();
            setTimeout(() => scrollTo('#course'), 300);
          }}
          style={{
            marginTop: '1rem',
            background: 'linear-gradient(135deg, #9333ea, #6366f1)',
            color: '#fff',
            padding: '0.875rem 2.5rem',
            borderRadius: '9999px',
            fontSize: '1.125rem',
            fontWeight: 800,
            textDecoration: 'none',
            boxShadow: '0 0 25px rgba(147, 51, 234, 0.4)',
          }}
        >
          {t('joinCourse')}
        </a>
      </div>
    </>
  );
};
