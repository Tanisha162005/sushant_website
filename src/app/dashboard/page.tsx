'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

interface CourseData {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  imageUrl?: string | null;
  downloadUrl: string | null;
}

type TabType = 'courses' | 'downloads' | 'orders' | 'profile' | 'settings';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('courses');
  const [purchasedCoursesList, setPurchasedCoursesList] = useState<CourseData[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetch('/api/user/purchases')
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.data) {
            setPurchasedCoursesList(data.data);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleDownload = async (courseId: string) => {
    setDownloadingId(courseId);
    try {
      window.location.href = `/api/courses/${courseId}/download?userId=${user?.id || 'temp-user'}`;
    } catch {
      alert('Download initiation failed. Please try again.');
    }
    setTimeout(() => setDownloadingId(null), 2000);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loader-spinner" />
          <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navTabs: { id: TabType; label: string; icon: string; roadmap?: boolean }[] = [
    { id: 'courses', label: 'My Courses', icon: '📚' },
    { id: 'downloads', label: 'Downloads', icon: '📥' },
    { id: 'orders', label: 'Order History', icon: '🧾' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️', roadmap: true },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Background glows matching main page */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      <Navbar />

      <main className="container" style={{ flex: 1, paddingTop: '120px', paddingBottom: '60px' }}>

        {/* ─── User Header ─── */}
        <div className="glass-panel" style={{
          borderRadius: 'var(--radius-lg)',
          padding: '28px 32px',
          marginBottom: '40px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative gradient accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'var(--accent-gradient)',
            borderRadius: '24px 24px 0 0',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Avatar */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--bg-primary)',
                fontSize: '1.5rem',
                fontWeight: 900,
                fontFamily: 'var(--font-english-heading)',
                boxShadow: '0 4px 20px var(--glow-orange)',
                overflow: 'hidden',
              }}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                  <h1 style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-marathi-heading)',
                    lineHeight: 1.2,
                  }}>{user.name}</h1>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    background: 'rgba(168, 85, 247, 0.12)',
                    color: 'var(--accent-gold)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    fontFamily: 'var(--font-english)',
                  }}>
                    {user.role}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link href="/" className="btn-secondary" style={{
                padding: '10px 20px',
                fontSize: '0.82rem',
                borderRadius: '12px',
              }}>
                {t('browseCourses')}
              </Link>
              <button
                onClick={() => logout()}
                style={{
                  padding: '10px 20px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  fontFamily: 'inherit',
                }}
              >
                {t('signOut')}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Tabbed Layout ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '32px' }}>

          {/* Sidebar */}
          <div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    fontFamily: 'var(--font-marathi)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    border: 'none',
                    background: activeTab === tab.id
                      ? 'var(--accent-gradient-purple)'
                      : 'transparent',
                    color: activeTab === tab.id
                      ? '#ffffff'
                      : 'var(--text-secondary)',
                    boxShadow: activeTab === tab.id
                      ? '0 4px 20px var(--glow-purple)'
                      : 'none',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </span>
                  {tab.roadmap && (
                    <span style={{
                      fontSize: '0.6rem',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: 'var(--accent-gold)',
                      fontWeight: 600,
                      fontFamily: 'var(--font-english)',
                      letterSpacing: '0.5px',
                    }}>
                      {t('soon')}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div>

            {/* Tab: My Courses */}
            {activeTab === 'courses' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.25rem' }}>🎓</span>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-marathi-heading)',
                    }}>{t('myMasterclasses')}</h2>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {t('accessPurchasedCourses')}
                  </p>
                </div>

                {purchasedCoursesList.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {purchasedCoursesList.map((course) => (
                      <div key={course.id} className="glass-panel glow-border hover-lift" style={{
                        borderRadius: 'var(--radius-md)',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}>
                        <div>
                          <div style={{
                            aspectRatio: '16/9',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            marginBottom: '16px',
                            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(124, 58, 237, 0.05))',
                            border: '1px solid var(--border-glass)',
                          }}>
                            {course.imageUrl ? (
                              <img src={course.imageUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎬</div>
                            )}
                          </div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-marathi-heading)', marginBottom: '8px' }}>{course.title}</h3>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {course.description}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDownload(course.id)}
                          disabled={downloadingId === course.id}
                          className="btn-primary"
                          style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '0.85rem',
                            borderRadius: '12px',
                            justifyContent: 'center',
                          }}
                        >
                          {downloadingId === course.id ? t('preparing') : t('downloadResources')}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel" style={{
                    borderRadius: 'var(--radius-lg)',
                    padding: '60px 20px',
                    textAlign: 'center',
                    border: '1px dashed rgba(255,255,255,0.1)',
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      margin: '0 auto 20px'
                    }}>
                      🛍️
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>{t('noCoursesYet')}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
                      {t('checkOutOurLatest')}
                    </p>
                    <Link href="/#course" className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.9rem' }}>
                      {t('exploreCourses')}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Downloads */}
            {activeTab === 'downloads' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-marathi-heading)', marginBottom: '6px' }}>
                    {t('downloadableFiles')}
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {t('protectedSignedUrls')}
                  </p>
                </div>

                {purchasedCoursesList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {purchasedCoursesList.map((course) => (
                      <div key={course.id} className="glass-panel hover-lift" style={{
                        borderRadius: 'var(--radius-md)',
                        padding: '20px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'rgba(168, 85, 247, 0.1)',
                            border: '1px solid rgba(168, 85, 247, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                          }}>📦</div>
                          <div>
                            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, fontFamily: 'var(--font-marathi-heading)', marginBottom: '2px' }}>
                              {course.title}
                            </h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('resourceZip')}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload(course.id)}
                          className="btn-primary"
                          style={{ padding: '10px 24px', fontSize: '0.8rem', borderRadius: '12px' }}
                        >
                          {t('download')}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-panel" style={{
                    borderRadius: 'var(--radius-md)',
                    padding: '40px',
                    textAlign: 'center',
                    fontSize: '0.88rem',
                    color: 'var(--text-muted)',
                  }}>
                    {t('noDownloads')}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Orders */}
            {activeTab === 'orders' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-marathi-heading)', marginBottom: '6px' }}>
                    {t('orderHistory')}
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {t('transactionsVerification')}
                  </p>
                </div>

                {purchasedCoursesList.length > 0 ? (
                  <div className="glass-panel" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', textAlign: 'left', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-glass)' }}>
                          <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('orderId')}</th>
                          <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('course')}</th>
                          <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('date')}</th>
                          <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('amount')}</th>
                          <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchasedCoursesList.map((course) => (
                          <tr key={course.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '14px 20px', fontWeight: 600, fontFamily: 'var(--font-marathi-heading)' }}>{course.title}</td>
                            <td style={{ padding: '14px 20px', fontFamily: 'var(--font-english)', fontWeight: 600 }}>₹{(course.price / 100).toLocaleString()}</td>
                            <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>Razorpay (SSL)</td>
                            <td style={{ padding: '14px 20px' }}>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '8px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                background: 'rgba(34, 197, 94, 0.08)',
                                color: '#4ade80',
                                border: '1px solid rgba(34, 197, 94, 0.15)',
                                fontFamily: 'var(--font-english)',
                                letterSpacing: '0.5px',
                              }}>
                                {t('successful')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem'
                  }}>
                    {t('noOrderHistory')}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Profile */}
            {activeTab === 'profile' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-marathi-heading)', marginBottom: '6px' }}>
                    My Account Details
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Your personal profile and credentials.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                  {[
                    { label: 'Full Name', value: user.name },
                    { label: 'Email Address', value: user.email },
                    { label: 'Account Role', value: user.role },
                    { label: 'Auth Method', value: user.avatarUrl ? 'Google OAuth 2.0' : 'Email & Password (JWT)' },
                  ].map((field, i) => (
                    <div key={i} className="glass-panel" style={{
                      borderRadius: 'var(--radius-sm)',
                      padding: '20px',
                    }}>
                      <span style={{
                        display: 'block',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        color: 'var(--text-muted)',
                        marginBottom: '8px',
                        fontFamily: 'var(--font-english)',
                      }}>
                        {field.label}
                      </span>
                      <span style={{
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-marathi-heading)',
                        color: field.label === 'Account Role' ? 'var(--accent-gold)' : 'var(--text-primary)',
                        textTransform: field.label === 'Account Role' ? 'uppercase' : 'none',
                      }}>
                        {field.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Settings */}
            {activeTab === 'settings' && (
              <div className="glass-panel" style={{
                borderRadius: 'var(--radius-lg)',
                padding: '60px 32px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚙️</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-marathi-heading)', marginBottom: '12px' }}>
                  Account Settings & Security — Coming Soon
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.7 }}>
                  Password management, two-factor authentication, and email preferences are scheduled for the next release phase.
                </p>
                <span className="section-tag" style={{ fontSize: '0.7rem' }}>🔒 Enterprise Security Center</span>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        @media (max-width: 768px) {
          main > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
