'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

interface LessonData {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  fileSize: number | null;
  displayOrder: number;
}

interface AssetData {
  assetType: string;
  filename: string;
  size: number;
}

interface CourseData {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  imageUrl?: string | null;
  downloadUrl: string | null;
  lessons?: LessonData[];
  assets?: AssetData[];
}

type TabType = 'courses' | 'downloads' | 'orders' | 'profile' | 'settings';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const min = Math.floor(seconds / 60);
  if (min >= 60) {
    const hr = Math.floor(min / 60);
    const rm = min % 60;
    return `${hr}h ${rm}m`;
  }
  return `${min} min`;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

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

  const handleLessonDownload = async (courseId: string, lessonId: string) => {
    const key = `lesson-${lessonId}`;
    setDownloadingId(key);
    try {
      const res = await fetch(`/api/courses/${courseId}/download?lessonId=${lessonId}&json=true`);
      const data = await res.json();
      if (data.success && data.signedUrl) {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = data.filename || 'lesson.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert(data.message || 'Download failed');
      }
    } catch {
      alert('Download failed. Please try again.');
    }
    setTimeout(() => setDownloadingId(null), 2000);
  };

  const handleAssetDownload = async (courseId: string, assetType: string) => {
    const key = `asset-${courseId}-${assetType}`;
    setDownloadingId(key);
    try {
      const res = await fetch(`/api/courses/${courseId}/download?assetType=${assetType}&json=true`);
      const data = await res.json();
      if (data.success && data.signedUrl) {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = data.filename || `download.${assetType}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert(data.message || 'Download failed');
      }
    } catch {
      alert('Download failed. Please try again.');
    }
    setTimeout(() => setDownloadingId(null), 2000);
  };

  // Backward compatible: download old ZIP course
  const handleLegacyDownload = async (courseId: string) => {
    setDownloadingId(courseId);
    try {
      window.location.href = `/api/courses/${courseId}/download?userId=${user?.id || 'temp-user'}`;
    } catch {
      alert('Download initiation failed.');
    }
    setTimeout(() => setDownloadingId(null), 2000);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
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
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      <Navbar />

      <main className="container" style={{ flex: 1, paddingTop: '120px', paddingBottom: '60px' }}>

        {/* User Header */}
        <div className="glass-panel" style={{
          borderRadius: 'var(--radius-lg)', padding: '28px 32px',
          marginBottom: '40px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'var(--accent-gradient)', borderRadius: '24px 24px 0 0',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: 'var(--radius-md)',
                background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--bg-primary)', fontSize: '1.5rem', fontWeight: 900,
                fontFamily: 'var(--font-english-heading)', boxShadow: '0 4px 20px var(--glow-orange)', overflow: 'hidden',
              }}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                  <h1 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-marathi-heading)', lineHeight: 1.2 }}>{user.name}</h1>
                  <span style={{
                    padding: '3px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '1.5px',
                    background: 'rgba(168, 85, 247, 0.12)', color: 'var(--accent-gold)',
                    border: '1px solid rgba(168, 85, 247, 0.2)', fontFamily: 'var(--font-english)',
                  }}>{user.role}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link href="/" className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.82rem', borderRadius: '12px' }}>
                {t('browseCourses')}
              </Link>
              <button onClick={() => logout()} style={{
                padding: '10px 20px', fontSize: '0.82rem', fontWeight: 600, borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)',
                color: '#f87171', cursor: 'pointer', transition: 'var(--transition-fast)', fontFamily: 'inherit',
              }}>
                {t('signOut')}
              </button>
            </div>
          </div>
        </div>

        {/* Tabbed Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '32px' }}>

          {/* Sidebar */}
          <div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {navTabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem',
                  fontWeight: activeTab === tab.id ? 700 : 500, fontFamily: 'var(--font-marathi)',
                  textAlign: 'left', cursor: 'pointer', transition: 'var(--transition-fast)', border: 'none',
                  background: activeTab === tab.id ? 'var(--accent-gradient-purple)' : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: activeTab === tab.id ? '0 4px 20px var(--glow-purple)' : 'none',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </span>
                  {tab.roadmap && (
                    <span style={{
                      fontSize: '0.6rem', padding: '2px 8px', borderRadius: '6px',
                      background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent-gold)',
                      fontWeight: 600, fontFamily: 'var(--font-english)', letterSpacing: '0.5px',
                    }}>{t('soon')}</span>
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
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-marathi-heading)' }}>{t('myMasterclasses')}</h2>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('accessPurchasedCourses')}</p>
                </div>

                {purchasedCoursesList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {purchasedCoursesList.map((course) => {
                      const hasLessons = course.lessons && course.lessons.length > 0;
                      const pdfAsset = course.assets?.find(a => a.assetType === 'pdf');
                      const zipAsset = course.assets?.find(a => a.assetType === 'zip');

                      return (
                        <div key={course.id} className="glass-panel glow-border" style={{
                          borderRadius: 'var(--radius-md)', padding: '24px', overflow: 'hidden',
                        }}>
                          {/* Course Header */}
                          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            {course.imageUrl && (
                              <div style={{
                                width: '120px', height: '68px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
                                border: '1px solid var(--border-glass)',
                              }}>
                                <img src={course.imageUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            )}
                            <div style={{ flex: 1 }}>
                              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-marathi-heading)', marginBottom: '4px' }}>
                                {course.title}
                              </h3>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {course.description}
                              </p>
                            </div>
                          </div>

                          {/* Workbook & Resources */}
                          {(pdfAsset || zipAsset) && (
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                              {pdfAsset && (
                                <button
                                  onClick={() => handleAssetDownload(course.id, 'pdf')}
                                  disabled={downloadingId === `asset-${course.id}-pdf`}
                                  className="btn-secondary"
                                  style={{ padding: '8px 16px', fontSize: '0.78rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                  📄 {downloadingId === `asset-${course.id}-pdf` ? 'Preparing...' : 'Download Workbook'}
                                </button>
                              )}
                              {zipAsset && (
                                <button
                                  onClick={() => handleAssetDownload(course.id, 'zip')}
                                  disabled={downloadingId === `asset-${course.id}-zip`}
                                  className="btn-secondary"
                                  style={{ padding: '8px 16px', fontSize: '0.78rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                  📦 {downloadingId === `asset-${course.id}-zip` ? 'Preparing...' : 'Download Resources'}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Lessons List */}
                          {hasLessons ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.9rem' }}>🎬</span>
                                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, fontFamily: 'var(--font-marathi-heading)' }}>
                                  Lessons ({course.lessons!.length})
                                </h4>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {course.lessons!.map((lesson, idx) => (
                                  <div key={lesson.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 16px', borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'background 0.2s',
                                    gap: '12px',
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                      <span style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        width: '28px', height: '28px', borderRadius: '8px',
                                        background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.15)',
                                        fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-gold)',
                                        fontFamily: 'var(--font-english)', flexShrink: 0,
                                      }}>
                                        {String(idx + 1).padStart(2, '0')}
                                      </span>
                                      <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: '0.84rem', fontWeight: 600, fontFamily: 'var(--font-marathi-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {lesson.title}
                                        </p>
                                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                          <span>⏱ {formatDuration(lesson.duration)}</span>
                                          <span>💾 {formatSize(lesson.fileSize)}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => handleLessonDownload(course.id, lesson.id)}
                                      disabled={downloadingId === `lesson-${lesson.id}`}
                                      className="btn-primary"
                                      style={{
                                        padding: '8px 18px', fontSize: '0.75rem', borderRadius: '10px',
                                        flexShrink: 0, fontFamily: 'var(--font-english)',
                                      }}
                                    >
                                      {downloadingId === `lesson-${lesson.id}` ? '⏳' : '⬇️'} Download
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            /* Backward compatibility: old-style single download button */
                            <button
                              onClick={() => handleLegacyDownload(course.id)}
                              disabled={downloadingId === course.id}
                              className="btn-primary"
                              style={{ width: '100%', padding: '12px', fontSize: '0.85rem', borderRadius: '12px', justifyContent: 'center' }}
                            >
                              {downloadingId === course.id ? t('preparing') : t('downloadResources')}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="glass-panel" style={{
                    borderRadius: 'var(--radius-lg)', padding: '60px 20px', textAlign: 'center',
                    border: '1px dashed rgba(255,255,255,0.1)',
                  }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 20px',
                    }}>🛍️</div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>{t('noCoursesYet')}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>{t('checkOutOurLatest')}</p>
                    <Link href="/#course" className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.9rem' }}>{t('exploreCourses')}</Link>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Downloads */}
            {activeTab === 'downloads' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-marathi-heading)', marginBottom: '6px' }}>{t('downloadableFiles')}</h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('protectedSignedUrls')}</p>
                </div>

                {purchasedCoursesList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {purchasedCoursesList.map((course) => {
                      const pdfAsset = course.assets?.find(a => a.assetType === 'pdf');
                      const zipAsset = course.assets?.find(a => a.assetType === 'zip');
                      const hasLessons = course.lessons && course.lessons.length > 0;

                      return (
                        <div key={course.id} className="glass-panel" style={{ borderRadius: 'var(--radius-md)', padding: '20px 24px' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-marathi-heading)', marginBottom: '12px' }}>{course.title}</h4>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {pdfAsset && (
                              <div className="hover-lift" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span>📄</span>
                                  <div>
                                    <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>Workbook</p>
                                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{formatSize(pdfAsset.size)}</p>
                                  </div>
                                </div>
                                <button onClick={() => handleAssetDownload(course.id, 'pdf')} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.72rem', borderRadius: '8px' }}>Download</button>
                              </div>
                            )}

                            {zipAsset && (
                              <div className="hover-lift" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span>📦</span>
                                  <div>
                                    <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>Resources</p>
                                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{formatSize(zipAsset.size)}</p>
                                  </div>
                                </div>
                                <button onClick={() => handleAssetDownload(course.id, 'zip')} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.72rem', borderRadius: '8px' }}>Download</button>
                              </div>
                            )}

                            {hasLessons && course.lessons!.map((lesson, idx) => (
                              <div key={lesson.id} className="hover-lift" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)', width: '22px', textAlign: 'center' }}>{String(idx + 1).padStart(2, '0')}</span>
                                  <div>
                                    <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{lesson.title}</p>
                                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{formatDuration(lesson.duration)} · {formatSize(lesson.fileSize)}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleLessonDownload(course.id, lesson.id)}
                                  disabled={downloadingId === `lesson-${lesson.id}`}
                                  className="btn-primary"
                                  style={{ padding: '6px 14px', fontSize: '0.72rem', borderRadius: '8px' }}
                                >
                                  {downloadingId === `lesson-${lesson.id}` ? '⏳' : 'Download'}
                                </button>
                              </div>
                            ))}

                            {!hasLessons && !pdfAsset && !zipAsset && (
                              <button onClick={() => handleLegacyDownload(course.id)} className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.8rem', borderRadius: '12px' }}>
                                {t('download')}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="glass-panel" style={{ borderRadius: 'var(--radius-md)', padding: '40px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    {t('noDownloads')}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Orders */}
            {activeTab === 'orders' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-marathi-heading)', marginBottom: '6px' }}>{t('orderHistory')}</h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{t('transactionsVerification')}</p>
                </div>

                {purchasedCoursesList.length > 0 ? (
                  <div className="glass-panel" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', textAlign: 'left', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-glass)' }}>
                          <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('course')}</th>
                          <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('amount')}</th>
                          <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Gateway</th>
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
                                padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700,
                                background: 'rgba(34, 197, 94, 0.08)', color: '#4ade80',
                                border: '1px solid rgba(34, 197, 94, 0.15)', fontFamily: 'var(--font-english)', letterSpacing: '0.5px',
                              }}>{t('successful')}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('noOrderHistory')}</div>
                )}
              </div>
            )}

            {/* Tab: Profile */}
            {activeTab === 'profile' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-marathi-heading)', marginBottom: '6px' }}>My Account Details</h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Your personal profile and credentials.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                  {[
                    { label: 'Full Name', value: user.name },
                    { label: 'Email Address', value: user.email },
                    { label: 'Account Role', value: user.role },
                    { label: 'Auth Method', value: user.avatarUrl ? 'Google OAuth 2.0' : 'Email & Password (JWT)' },
                  ].map((field, i) => (
                    <div key={i} className="glass-panel" style={{ borderRadius: 'var(--radius-sm)', padding: '20px' }}>
                      <span style={{
                        display: 'block', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '1.5px', color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'var(--font-english)',
                      }}>{field.label}</span>
                      <span style={{
                        fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-marathi-heading)',
                        color: field.label === 'Account Role' ? 'var(--accent-gold)' : 'var(--text-primary)',
                        textTransform: field.label === 'Account Role' ? 'uppercase' : 'none',
                      }}>{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Settings */}
            {activeTab === 'settings' && (
              <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '60px 32px', textAlign: 'center' }}>
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
