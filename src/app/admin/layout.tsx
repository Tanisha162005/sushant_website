'use client';

import { LayoutDashboard, BookOpen, Users, ShoppingCart, Tag, Video, MessageSquare, Settings, LogOut, ChevronRight, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';

const sidebarLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Courses', href: '/admin/courses', icon: BookOpen },
  { name: 'Students', href: '/admin/students', icon: Users },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Coupons', href: '/admin/coupons', icon: Tag },
  { name: 'Webinars', href: '/admin/webinars', icon: Video },
  { name: 'Tickets', href: '/admin/tickets', icon: MessageSquare },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

function getPageTitle(pathname: string) {
  if (pathname === '/admin') return 'Dashboard';
  const link = sidebarLinks.find(l => l.href !== '/admin' && pathname.startsWith(l.href));
  return link?.name || 'Dashboard';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Don't apply admin layout to the login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div style={{
      display: 'flex', height: '100vh',
      background: '#0B0514',
      fontFamily: "'Poppins', sans-serif",
      color: '#eef0f6',
      overflow: 'hidden',
    }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 40, backdropFilter: 'blur(4px)',
          }}
          className="lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: '260px', minWidth: '260px',
          background: 'linear-gradient(180deg, rgba(18,10,36,0.98) 0%, rgba(11,5,20,0.98) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          position: sidebarOpen ? 'fixed' : undefined,
          top: 0, left: 0, bottom: 0,
          zIndex: 50,
          transition: 'transform 0.3s ease',
        }}
        className={sidebarOpen ? '' : 'hidden lg:flex'}
      >
        {/* Logo */}
        <div style={{
          height: '72px', display: 'flex', alignItems: 'center',
          padding: '0 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
          gap: '0.75rem',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
            fontSize: '1rem',
          }}>🎬</div>
          <div>
            <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#eef0f6', letterSpacing: '-0.01em' }}>
              Sushant Ghadge
            </span>
            <p style={{ fontSize: '0.625rem', color: '#6b5e88', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
              Admin Panel
            </p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden" style={{
            marginLeft: 'auto', background: 'none', border: 'none', color: '#6b5e88', cursor: 'pointer',
          }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '1rem 0.75rem' }}>
          <p style={{
            fontSize: '0.625rem', fontWeight: 700, color: '#6b5e88',
            textTransform: 'uppercase', letterSpacing: '0.12em',
            padding: '0 0.75rem', marginBottom: '0.75rem',
          }}>Menu</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {sidebarLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: '10px',
                    fontSize: '0.8125rem', fontWeight: active ? 700 : 500,
                    color: active ? '#D8B4FE' : '#a89ec8',
                    background: active
                      ? 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(124,58,237,0.08) 100%)'
                      : 'transparent',
                    border: active ? '1px solid rgba(168,85,247,0.2)' : '1px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      e.currentTarget.style.color = '#D8B4FE';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#a89ec8';
                    }
                  }}
                >
                  {active && (
                    <div style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: '3px', height: '20px', borderRadius: '0 4px 4px 0',
                      background: 'linear-gradient(180deg, #A855F7, #7C3AED)',
                    }} />
                  )}
                  <link.icon style={{ width: 18, height: 18, flexShrink: 0 }} />
                  {link.name}
                  {active && <ChevronRight style={{ width: 14, height: 14, marginLeft: 'auto', opacity: 0.5 }} />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
              padding: '0.625rem 0.75rem', borderRadius: '10px',
              fontSize: '0.8125rem', fontWeight: 600,
              color: '#ef4444', background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.1)',
              cursor: 'pointer', transition: 'all 0.2s ease',
              fontFamily: "'Poppins', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.1)';
            }}
          >
            <LogOut style={{ width: 18, height: 18 }} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 2rem',
          background: 'rgba(18,10,36,0.6)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
              style={{ background: 'none', border: 'none', color: '#a89ec8', cursor: 'pointer' }}
            >
              <Menu style={{ width: 22, height: 22 }} />
            </button>
            <h1 style={{
              fontSize: '1.25rem', fontWeight: 800, color: '#eef0f6',
              letterSpacing: '-0.01em',
            }}>{getPageTitle(pathname)}</h1>
          </div>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 700, color: '#fff',
            boxShadow: '0 0 16px rgba(168, 85, 247, 0.2)',
          }}>A</div>
        </header>

        {/* Page content */}
        <div style={{
          flex: 1, overflowY: 'auto',
          background: 'linear-gradient(180deg, #0B0514 0%, #120A24 100%)',
          padding: '2rem',
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}
