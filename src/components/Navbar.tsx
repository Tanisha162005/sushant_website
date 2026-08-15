'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export const Navbar = () => {
  const { t, lang, toggleLang } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState('#home');

  const navLinks = [
    { href: '#home', label: t('footerHome') },
    { href: '#about', label: t('footerAbout') },
    { href: '#video', label: 'Video' },
    { href: '#course', label: t('footerCourse') },
    { href: '#brands', label: t('footerBrands') },
    { href: '#faq', label: t('footerFaq') },
  ];

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(prev => {
        if (scrollY > 50 && !prev) return true;
        if (scrollY <= 50 && prev) return false;
        return prev;
      });

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${progress}%`;
      }
      
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll(); // Trigger once on mount

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = ['home', 'about', 'video', 'course', 'brands', 'faq'];
    const observer = new IntersectionObserver(
      (entries) => {
        let maxVisible = 0;
        let mostVisibleSection = '';
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: '-20% 0px -50% 0px', threshold: 0 }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname]);

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
      <div ref={progressBarRef} className="scroll-progress-bar" style={{ width: '0%' }} />

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
            padding: '1.25rem clamp(1rem, 4vw, 2.5rem)',
          }}
        >
          {/* Logo — Gradient first letter */}
          <Link href="/" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', position: 'relative', zIndex: 60 }}>
            <Image src="/logo.png" alt="Sushant Ghadge Logo" width={150} height={36} style={{ height: '36px', width: 'auto', objectFit: 'contain' }} priority />
            <span style={{
              fontSize: 'clamp(1rem, 3.5vw, 1.4rem)',
              fontWeight: 900,
              letterSpacing: '-0.025em',
              color: '#fff',
              whiteSpace: 'nowrap',
            }}>
              Sushant Ghadge
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
          <div className="flex md:hidden" style={{ alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 60 }}>
            {user && (
              <Link href="/dashboard" style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#a855f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 800,
                color: '#fff',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)'
              }}>
                {user.name.charAt(0).toUpperCase()}
              </Link>
            )}

            <div
              onClick={toggleLang}
              style={{
                fontSize: '11px',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '9999px',
                padding: '0.25rem 0.6rem',
                display: 'flex',
                gap: '0.5rem',
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
                zIndex: 60,
              }}
              aria-label="Menu"
            >
              <span style={{ display: 'block', width: '24px', height: '2px', backgroundColor: '#fff', borderRadius: '2px', transition: 'all 0.3s', transform: mobileMenuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
              <span style={{ display: 'block', width: '24px', height: '2px', backgroundColor: '#fff', borderRadius: '2px', transition: 'all 0.3s', opacity: mobileMenuOpen ? 0 : 1 }} />
              <span style={{ display: 'block', width: '24px', height: '2px', backgroundColor: '#fff', borderRadius: '2px', transition: 'all 0.3s', transform: mobileMenuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className="md:hidden"
        style={{
          position: 'fixed',
          inset: 0,
          height: '100vh',
          minHeight: '-webkit-fill-available',
          zIndex: 40,
          backgroundColor: 'rgba(5, 10, 24, 0.98)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2.5rem',
          padding: '6rem 2rem 3rem',
          transition: 'all 0.4s ease-in-out',
          opacity: mobileMenuOpen ? 1 : 0,
          visibility: mobileMenuOpen ? 'visible' : 'hidden',
          pointerEvents: mobileMenuOpen ? 'auto' : 'none',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', width: '100%' }}>
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
                fontSize: '1.4rem',
                fontWeight: 800,
                color: activeSection === link.href ? '#c084fc' : '#f3f4f6',
                textDecoration: 'none',
                letterSpacing: '0.5px',
                textAlign: 'center',
                transition: 'color 0.2s',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginTop: 'auto', width: '100%' }}>
          {user ? (
            <Link
              href="/dashboard"
              onClick={closeMenu}
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#c084fc',
                textDecoration: 'none',
                border: '1px solid rgba(192, 132, 252, 0.3)',
                padding: '0.75rem 2rem',
                borderRadius: '9999px',
                width: '100%',
                textAlign: 'center',
              }}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={closeMenu}
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#fff',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '0.75rem 2rem',
                borderRadius: '9999px',
                width: '100%',
                textAlign: 'center',
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
              background: 'linear-gradient(135deg, #9333ea, #6366f1)',
              color: '#fff',
              padding: '1rem 2rem',
              borderRadius: '9999px',
              fontSize: '1.15rem',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 0 25px rgba(147, 51, 234, 0.4)',
              width: '100%',
              textAlign: 'center',
            }}
          >
            {t('joinCourse')}
          </a>
        </div>
      </div>
    </>
  );
};
