'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { 
  Download, FileText, Package, PlayCircle, Clock, HardDrive, 
  BookOpen, ShoppingBag, User, Settings, CheckCircle2, Loader2, 
  Sparkles, LogOut, ArrowRight, ShieldCheck 
} from 'lucide-react';

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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as TabType;
      if (tabParam && ['courses', 'downloads', 'orders', 'profile', 'settings'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetch(`/api/user/purchases?t=${Date.now()}`)
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
      const res = await fetch(`/api/courses/${courseId}/download?lessonId=${lessonId}&json=true&t=${Date.now()}`);
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
      const res = await fetch(`/api/courses/${courseId}/download?assetType=${assetType}&json=true&t=${Date.now()}`);
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
      window.location.href = `/api/courses/${courseId}/download?userId=${user?.id || 'temp-user'}&t=${Date.now()}`;
    } catch {
      alert('Download initiation failed.');
    }
    setTimeout(() => setDownloadingId(null), 2000);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#080A10',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Loader2 style={{ width: 44, height: 44, color: '#10B981', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#94A3B8', fontSize: '0.95rem', fontWeight: 500 }}>
            Loading your executive dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navTabs: { id: TabType; label: string; icon: React.ReactNode; roadmap?: boolean }[] = [
    { id: 'courses', label: 'My Courses', icon: <BookOpen style={{ width: 18, height: 18 }} /> },
    { id: 'downloads', label: 'Downloads', icon: <Download style={{ width: 18, height: 18 }} /> },
    { id: 'orders', label: 'Order History', icon: <ShoppingBag style={{ width: 18, height: 18 }} /> },
    { id: 'profile', label: 'My Profile', icon: <User style={{ width: 18, height: 18 }} /> },
    { id: 'settings', label: 'Settings', icon: <Settings style={{ width: 18, height: 18 }} />, roadmap: true },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#080A10', color: '#EEF2F6', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle Deep Space Cyber Ambient Illumination */}
      <div style={{
        position: 'fixed', top: '-15%', left: '5%', width: '500px', height: '500px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-15%', right: '5%', width: '600px', height: '600px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <Navbar />

      <main className="container" style={{ flex: 1, paddingTop: '120px', paddingBottom: '80px', position: 'relative', zIndex: 1 }}>

        {/* User Executive Profile Header */}
        <div style={{
          borderRadius: '24px', padding: 'clamp(16px, 5vw, 32px) clamp(16px, 5vw, 36px)',
          marginBottom: '40px', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(145deg, #131824 0%, #0D111A 100%)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, #34D399 0%, #3B82F6 50%, #60A5FA 100%)',
          }} />

          <div className="dashboard-header-flex">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '18px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', fontSize: '1.75rem', fontWeight: 900,
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.35)', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                    {user.name}
                  </h1>
                  <span style={{
                    padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '1px',
                    background: 'rgba(16, 185, 129, 0.15)', color: '#34D399',
                    border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}>
                    <Sparkles style={{ width: 12, height: 12 }} /> {user.role}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#94A3B8' }}>{user.email}</p>
              </div>
            </div>

            <div className="dashboard-actions-flex">
              <Link href="/" style={{
                padding: '12px 22px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#F8FAFC', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px',
                textDecoration: 'none',
              }}>
                <BookOpen style={{ width: 16, height: 16 }} /> {t('browseCourses')}
              </Link>
              <button onClick={() => logout()} style={{
                padding: '12px 22px', fontSize: '0.85rem', fontWeight: 600, borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#F87171', cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px',
              }}>
                <LogOut style={{ width: 16, height: 16 }} /> {t('signOut')}
              </button>
            </div>
          </div>
        </div>

        {/* Executive Tabbed Layout */}
        <div className="dashboard-layout">

          {/* Sidebar */}
          <div>
            <nav className="dashboard-nav-tabs">
              {navTabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', borderRadius: '14px', fontSize: '0.9rem',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  textAlign: 'left', cursor: 'pointer', transition: 'all 0.25s',
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: activeTab === tab.id ? '#FFFFFF' : '#94A3B8',
                  boxShadow: activeTab === tab.id ? '0 8px 25px rgba(59, 130, 246, 0.35)' : 'none',
                  border: activeTab === tab.id ? '1px solid #60A5FA' : '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {tab.icon}
                    <span>{tab.label}</span>
                  </span>
                  {tab.roadmap && (
                    <span style={{
                      fontSize: '0.62rem', padding: '2px 8px', borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.1)', color: '#93C5FD',
                      fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase',
                    }}>{t('soon')}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content Pane */}
          <div>

            {/* Tab: My Courses */}
            {activeTab === 'courses' && (
              <div>
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <BookOpen style={{ width: 24, height: 24, color: '#60A5FA' }} />
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.3px' }}>{t('myMasterclasses')}</h2>
                  </div>
                  <p style={{ color: '#94A3B8', fontSize: '0.92rem', lineHeight: 1.6 }}>{t('accessPurchasedCourses')}</p>
                </div>

                {purchasedCoursesList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    {purchasedCoursesList.map((course) => {
                      const hasLessons = course.lessons && course.lessons.length > 0;
                      const pdfAsset = course.assets?.find(a => a.assetType === 'pdf');
                      const zipAsset = course.assets?.find(a => a.assetType === 'zip');

                      return (
                        <div key={course.id} style={{
                          borderRadius: '20px', padding: '30px', overflow: 'hidden', position: 'relative',
                          background: 'linear-gradient(145deg, #131824 0%, #0D111A 100%)',
                          border: '1px solid rgba(255, 255, 255, 0.09)',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                        }}>
                          {/* Course Header */}
                          <div className="dashboard-course-card">
                            {course.imageUrl && (
                              <div className="dashboard-course-image">
                                <img src={course.imageUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: '250px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span style={{
                                  fontSize: '0.68rem', padding: '3px 10px', borderRadius: '6px', fontWeight: 700,
                                  background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.3)',
                                  letterSpacing: '0.5px', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '5px',
                                }}>
                                  <ShieldCheck style={{ width: 12, height: 12 }} /> Verified Purchase
                                </span>
                              </div>
                              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px', lineHeight: 1.25 }}>
                                {course.title}
                              </h3>
                              <p style={{ fontSize: '0.92rem', color: '#94A3B8', lineHeight: 1.6 }}>
                                {course.description}
                              </p>
                            </div>
                          </div>

                          {/* Workbook & Resources */}
                          {(pdfAsset || zipAsset) && (
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                              {pdfAsset && (
                                <button
                                  onClick={() => handleAssetDownload(course.id, 'pdf')}
                                  disabled={downloadingId === `asset-${course.id}-pdf`}
                                  style={{
                                    padding: '10px 20px', fontSize: '0.82rem', borderRadius: '12px', fontWeight: 600,
                                    background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)',
                                    color: '#60A5FA', cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px',
                                  }}
                                >
                                  {downloadingId === `asset-${course.id}-pdf` ? (
                                    <>
                                      <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />
                                      <span>Preparing Workbook...</span>
                                    </>
                                  ) : (
                                    <>
                                      <FileText style={{ width: 15, height: 15 }} />
                                      <span>Download Workbook (PDF)</span>
                                    </>
                                  )}
                                </button>
                              )}
                              {zipAsset && (
                                <button
                                  onClick={() => handleAssetDownload(course.id, 'zip')}
                                  disabled={downloadingId === `asset-${course.id}-zip`}
                                  style={{
                                    padding: '10px 20px', fontSize: '0.82rem', borderRadius: '12px', fontWeight: 600,
                                    background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)',
                                    color: '#34D399', cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px',
                                  }}
                                >
                                  {downloadingId === `asset-${course.id}-zip` ? (
                                    <>
                                      <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />
                                      <span>Preparing Archive...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Package style={{ width: 15, height: 15 }} />
                                      <span>Download Resource Pack (ZIP)</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Lessons List */}
                          {hasLessons ? (
                            <div>
                              <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                paddingBottom: '14px', marginBottom: '16px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <PlayCircle style={{ width: 20, height: 20, color: '#34D399' }} />
                                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>
                                    Course Syllabus & Video Lessons
                                  </h4>
                                </div>
                                <span style={{
                                  fontSize: '0.78rem', fontWeight: 700, color: '#A1A1AA',
                                  background: 'rgba(255, 255, 255, 0.05)', padding: '4px 12px', borderRadius: '20px',
                                  border: '1px solid rgba(255,255,255,0.08)',
                                }}>
                                  {course.lessons!.length} Modules Available
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {course.lessons!.map((lesson, idx) => (
                                  <div key={lesson.id} className="dashboard-list-item" style={{
                                    background: 'linear-gradient(90deg, rgba(30, 37, 56, 0.5) 0%, rgba(20, 26, 40, 0.8) 100%)',
                                    border: '1px solid rgba(255, 255, 255, 0.07)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                                    transition: 'all 0.25s',
                                  }}>
                                    <div className="dashboard-list-item-content" style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                                      <span style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        width: '36px', height: '36px', borderRadius: '10px',
                                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.3) 100%)',
                                        border: '1px solid rgba(52, 211, 153, 0.4)',
                                        fontSize: '0.88rem', fontWeight: 800, color: '#34D399', flexShrink: 0,
                                        boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)',
                                      }}>
                                        {String(idx + 1).padStart(2, '0')}
                                      </span>

                                      <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: '0.98rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {lesson.title}
                                        </p>
                                        <div style={{ display: 'flex', gap: '14px', fontSize: '0.76rem', color: '#94A3B8', alignItems: 'center' }}>
                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                            <Clock style={{ width: 13, height: 13, opacity: 0.8 }} /> {formatDuration(lesson.duration)}
                                          </span>
                                          <span>•</span>
                                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                            <HardDrive style={{ width: 13, height: 13, opacity: 0.8 }} /> {formatSize(lesson.fileSize)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => handleLessonDownload(course.id, lesson.id)}
                                      disabled={downloadingId === `lesson-${lesson.id}`}
                                      style={{
                                        padding: '10px 22px', fontSize: '0.82rem', borderRadius: '12px',
                                        flexShrink: 0, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        border: '1px solid rgba(255,255,255,0.2)', cursor: downloadingId === `lesson-${lesson.id}` ? 'wait' : 'pointer',
                                        transition: 'all 0.2s',
                                        background: downloadingId === `lesson-${lesson.id}`
                                          ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
                                          : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                        color: '#FFFFFF',
                                        boxShadow: downloadingId === `lesson-${lesson.id}`
                                          ? '0 4px 20px rgba(59, 130, 246, 0.4)'
                                          : '0 4px 18px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                                      }}
                                    >
                                      {downloadingId === `lesson-${lesson.id}` ? (
                                        <>
                                          <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                                          <span>Preparing File...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Download style={{ width: 16, height: 16 }} />
                                          <span>Download Video</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div style={{ padding: '24px 0', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                              <span style={{ fontSize: '0.88rem', color: '#94A3B8' }}>Standard complete course download bundle.</span>
                              {!pdfAsset && !zipAsset && (
                                <button 
                                  onClick={() => handleLegacyDownload(course.id)} 
                                  disabled={downloadingId === course.id}
                                  style={{ 
                                    padding: '12px 26px', fontSize: '0.85rem', borderRadius: '12px', fontWeight: 700,
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF',
                                    border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.35)', display: 'inline-flex', alignItems: 'center', gap: '8px',
                                  }}
                                >
                                  {downloadingId === course.id ? (
                                    <>
                                      <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                                      <span>Preparing Bundle...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download style={{ width: 16, height: 16 }} />
                                      <span>{t('download')}</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ 
                    borderRadius: '20px', padding: '60px', textAlign: 'center', 
                    background: 'linear-gradient(145deg, #131824 0%, #0D111A 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)', color: '#94A3B8',
                  }}>
                    <BookOpen style={{ width: 48, height: 48, color: '#60A5FA', margin: '0 auto 16px', opacity: 0.6 }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>No Enrolled Courses Found</h3>
                    <p style={{ fontSize: '0.92rem', maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.6 }}>{t('noPurchasedCourses')}</p>
                    <Link href="/" style={{
                      padding: '12px 28px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem',
                      background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: '#FFFFFF',
                      textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px',
                      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.35)', border: '1px solid rgba(255,255,255,0.2)',
                    }}>
                      Explore Masterclasses <ArrowRight style={{ width: 16, height: 16 }} />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Downloads */}
            {activeTab === 'downloads' && (
              <div>
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <Download style={{ width: 24, height: 24, color: '#34D399' }} />
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.3px' }}>{t('downloads')}</h2>
                  </div>
                  <p style={{ color: '#94A3B8', fontSize: '0.92rem', lineHeight: 1.6 }}>{t('downloadOffline')}</p>
                </div>

                {purchasedCoursesList.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {purchasedCoursesList.map((course) => {
                      const hasLessons = course.lessons && course.lessons.length > 0;
                      const pdfAsset = course.assets?.find(a => a.assetType === 'pdf');
                      const zipAsset = course.assets?.find(a => a.assetType === 'zip');

                      return (
                        <div key={course.id} style={{
                          borderRadius: '20px', padding: '28px',
                          background: 'linear-gradient(145deg, #131824 0%, #0D111A 100%)',
                          border: '1px solid rgba(255, 255, 255, 0.09)',
                          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                        }}>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>{course.title}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>Direct Offline Pack</span>
                          </h3>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Workbook & Resources */}
                            {pdfAsset && (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <FileText style={{ width: 20, height: 20, color: '#60A5FA' }} />
                                  <div>
                                    <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#FFFFFF' }}>Course Workbook (PDF)</p>
                                    <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{formatSize(pdfAsset.size)}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleAssetDownload(course.id, 'pdf')}
                                  disabled={downloadingId === `asset-${course.id}-pdf`}
                                  style={{
                                    padding: '8px 18px', fontSize: '0.8rem', borderRadius: '10px', fontWeight: 700,
                                    background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: '#FFFFFF',
                                    border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  }}
                                >
                                  <Download style={{ width: 14, height: 14 }} /> Download
                                </button>
                              </div>
                            )}

                            {zipAsset && (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <Package style={{ width: 20, height: 20, color: '#34D399' }} />
                                  <div>
                                    <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#FFFFFF' }}>Course Resources (ZIP Archive)</p>
                                    <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{formatSize(zipAsset.size)}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleAssetDownload(course.id, 'zip')}
                                  disabled={downloadingId === `asset-${course.id}-zip`}
                                  style={{
                                    padding: '8px 18px', fontSize: '0.8rem', borderRadius: '10px', fontWeight: 700,
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF',
                                    border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  }}
                                >
                                  <Download style={{ width: 14, height: 14 }} /> Download
                                </button>
                              </div>
                            )}

                            {hasLessons && course.lessons!.map((lesson, idx) => (
                              <div key={lesson.id} className="dashboard-list-item" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="dashboard-list-item-content" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                  <PlayCircle style={{ width: 20, height: 20, color: '#34D399' }} />
                                  <div>
                                    <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#FFFFFF' }}>{idx + 1}. {lesson.title}</p>
                                    <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{formatDuration(lesson.duration)} • {formatSize(lesson.fileSize)}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleLessonDownload(course.id, lesson.id)}
                                  disabled={downloadingId === `lesson-${lesson.id}`}
                                  style={{
                                    padding: '8px 18px', fontSize: '0.8rem', borderRadius: '10px', fontWeight: 700,
                                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#FFFFFF',
                                    border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                                  }}
                                >
                                  <Download style={{ width: 14, height: 14 }} /> Download MP4
                                </button>
                              </div>
                            ))}

                            {!hasLessons && !pdfAsset && !zipAsset && (
                              <button onClick={() => handleLegacyDownload(course.id)} style={{ padding: '10px 24px', fontSize: '0.85rem', borderRadius: '12px', fontWeight: 700, background: '#10B981', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}>
                                {t('download')}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ borderRadius: '20px', padding: '60px', textAlign: 'center', background: 'linear-gradient(145deg, #131824 0%, #0D111A 100%)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#94A3B8' }}>
                    <Download style={{ width: 44, height: 44, color: '#34D399', margin: '0 auto 16px', opacity: 0.6 }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>No Downloads Available</h3>
                    <p style={{ fontSize: '0.9rem' }}>{t('noDownloads')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Orders */}
            {activeTab === 'orders' && (
              <div>
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <ShoppingBag style={{ width: 24, height: 24, color: '#60A5FA' }} />
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.3px' }}>{t('orderHistory')}</h2>
                  </div>
                  <p style={{ color: '#94A3B8', fontSize: '0.92rem', lineHeight: 1.6 }}>{t('transactionsVerification')}</p>
                </div>

                {purchasedCoursesList.length > 0 ? (
                  <div style={{ position: 'relative' }}>
                    <div className="md:hidden" style={{ textAlign: 'right', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '8px', fontStyle: 'italic', paddingRight: '4px' }}>
                      Swipe to see more →
                    </div>
                    <div className="dashboard-table-wrapper">
                    <table style={{ width: '100%', textAlign: 'left', fontSize: '0.88rem', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <th style={{ padding: '18px 24px', textAlign: 'left', fontWeight: 700, color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('course')}</th>
                          <th style={{ padding: '18px 24px', textAlign: 'left', fontWeight: 700, color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('amount')}</th>
                          <th style={{ padding: '18px 24px', textAlign: 'left', fontWeight: 700, color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Gateway</th>
                          <th style={{ padding: '18px 24px', textAlign: 'left', fontWeight: 700, color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchasedCoursesList.map((course) => (
                          <tr key={course.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '16px 24px', fontWeight: 700, color: '#FFFFFF' }}>{course.title}</td>
                            <td style={{ padding: '16px 24px', fontWeight: 700, color: '#34D399' }}>₹{(course.price / 100).toLocaleString()}</td>
                            <td style={{ padding: '16px 24px', color: '#94A3B8' }}>Razorpay (SSL Encrypted)</td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{
                                padding: '5px 14px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800,
                                background: 'rgba(16, 185, 129, 0.15)', color: '#34D399',
                                border: '1px solid rgba(16, 185, 129, 0.3)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '6px',
                              }}>
                                <CheckCircle2 style={{ width: 13, height: 13 }} /> {t('successful')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </div>
                ) : (
                  <div style={{ borderRadius: '20px', padding: '60px', textAlign: 'center', background: 'linear-gradient(145deg, #131824 0%, #0D111A 100%)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#94A3B8' }}>
                    <ShoppingBag style={{ width: 44, height: 44, color: '#60A5FA', margin: '0 auto 16px', opacity: 0.6 }} />
                    <p style={{ fontSize: '0.95rem' }}>{t('noOrderHistory')}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Profile */}
            {activeTab === 'profile' && (
              <div>
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <User style={{ width: 24, height: 24, color: '#60A5FA' }} />
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.3px' }}>My Account Details</h2>
                  </div>
                  <p style={{ color: '#94A3B8', fontSize: '0.92rem', lineHeight: 1.6 }}>Your verified profile credentials and subscription parameters.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                  {[
                    { label: 'Full Name', value: user.name, color: '#FFFFFF' },
                    { label: 'Email Address', value: user.email, color: '#FFFFFF' },
                    { label: 'Account Privilege Role', value: user.role, color: '#34D399', badge: true },
                    { label: 'Authentication Security', value: user.avatarUrl ? 'Google OAuth 2.0 (Verified)' : 'Session JWT Cookie (SSL)', color: '#60A5FA' },
                  ].map((field, i) => (
                    <div key={i} style={{
                      borderRadius: '20px', padding: '24px',
                      background: 'linear-gradient(145deg, #131824 0%, #0D111A 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.09)',
                      boxShadow: '0 15px 30px rgba(0,0,0,0.5)',
                    }}>
                      <span style={{
                        display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '1.5px', color: '#94A3B8', marginBottom: '10px',
                      }}>{field.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '1.05rem', fontWeight: 800, color: field.color,
                          textTransform: field.label === 'Account Privilege Role' ? 'uppercase' : 'none',
                        }}>{field.value}</span>
                        {field.badge && <CheckCircle2 style={{ width: 16, height: 16, color: '#34D399' }} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Settings */}
            {activeTab === 'settings' && (
              <div style={{
                borderRadius: '24px', padding: '70px 40px', textAlign: 'center',
                background: 'linear-gradient(145deg, #131824 0%, #0D111A 100%)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
              }}>
                <Settings style={{ width: 56, height: 56, color: '#60A5FA', margin: '0 auto 20px', opacity: 0.8 }} />
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '12px' }}>
                  Account Settings & Security — Coming Soon
                </h2>
                <p style={{ fontSize: '0.92rem', color: '#94A3B8', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.7 }}>
                  Advanced session management, API access keys, and notification preferences are scheduled for the next deployment phase.
                </p>
                <span style={{
                  fontSize: '0.72rem', padding: '6px 16px', borderRadius: '20px',
                  background: 'rgba(59, 130, 246, 0.12)', color: '#60A5FA',
                  border: '1px solid rgba(59, 130, 246, 0.25)', fontWeight: 700, letterSpacing: '0.5px', display: 'inline-flex', alignItems: 'center', gap: '6px',
                }}>
                  <ShieldCheck style={{ width: 14, height: 14 }} /> Enterprise Security Center
                </span>
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
