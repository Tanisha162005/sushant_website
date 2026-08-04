'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, BookOpen, X, Loader2, Check, HardDrive, Image as ImageIcon, FileText, FileArchive, Video as VideoIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { R2FileUpload } from '@/components/admin/R2FileUpload';
import { LessonManager } from '@/components/admin/LessonManager';

interface CourseData {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  category: string | null;
  status: string;
  downloadUrl: string | null;
  lessonCount?: number;
}

interface UploadedAssetMeta {
  size: number;
  assetType: 'thumbnail' | 'pdf' | 'zip';
  filename: string;
  etag?: string;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}

export default function AdminCoursesPage() {
  const [allCourses, setAllCourses] = useState<CourseData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  // Uploaded R2 Object Keys & Metadata tracking
  const [thumbnailKey, setThumbnailKey] = useState<string>('');
  const [pdfKey, setPdfKey] = useState<string>('');
  const [zipKey, setZipKey] = useState<string>('');
  const [assetMetas, setAssetMetas] = useState<UploadedAssetMeta[]>([]);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses');
      const data = await res.json();
      if (data.success) setAllCourses(data.data);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleAssetUploadSuccess = (
    assetType: 'thumbnail' | 'pdf' | 'zip',
    data: { objectKey: string; filename: string; mimeType: string; size: number }
  ) => {
    if (assetType === 'thumbnail') setThumbnailKey(data.objectKey);
    else if (assetType === 'pdf') setPdfKey(data.objectKey);
    else if (assetType === 'zip') setZipKey(data.objectKey);

    setAssetMetas((prev) => [
      ...prev.filter((a) => a.assetType !== assetType),
      { size: data.size, assetType, filename: data.filename },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const priceRupees = parseFloat(formData.get('price') as string);
    formData.set('price', String(Math.round(priceRupees * 100)));

    const origPrice = formData.get('originalPrice') as string;
    if (origPrice) {
      formData.set('originalPrice', String(Math.round(parseFloat(origPrice) * 100)));
    }

    if (thumbnailKey) formData.set('thumbnailObjectKey', thumbnailKey);
    if (zipKey) formData.set('zipObjectKey', zipKey);
    if (pdfKey) formData.set('pdfObjectKey', pdfKey);

    try {
      const res = await fetch('/api/admin/courses', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setThumbnailKey('');
        setPdfKey('');
        setZipKey('');
        setAssetMetas([]);
        form.reset();
        fetchCourses();
        // Expand the new course for lesson management
        if (data.data?.id) setExpandedCourseId(data.data.id);
      } else {
        alert(data.message || 'Failed to create course');
      }
    } catch {
      alert('Error creating course');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    try {
      await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
      fetchCourses();
    } catch { /* ignore */ }
    setDeleteId(null);
  };

  const handleToggleStatus = async (course: CourseData) => {
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    try {
      await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchCourses();
    } catch { /* ignore */ }
  };

  const thumbnailSize = assetMetas.filter((a) => a.assetType === 'thumbnail').reduce((acc, a) => acc + a.size, 0);
  const pdfSize = assetMetas.filter((a) => a.assetType === 'pdf').reduce((acc, a) => acc + a.size, 0);
  const zipSize = assetMetas.filter((a) => a.assetType === 'zip').reduce((acc, a) => acc + a.size, 0);
  const totalStorage = thumbnailSize + pdfSize + zipSize;

  const statusColor: Record<string, { bg: string; text: string; border: string }> = {
    published: { bg: 'rgba(74,222,128,0.08)', text: '#4ade80', border: 'rgba(74,222,128,0.2)' },
    draft: { bg: 'rgba(168,85,247,0.08)', text: '#D8B4FE', border: 'rgba(168,85,247,0.2)' },
    archived: { bg: 'rgba(107,94,136,0.1)', text: '#6b5e88', border: 'rgba(107,94,136,0.2)' },
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#eef0f6', fontSize: '0.875rem', outline: 'none',
    transition: 'all 0.3s ease', fontFamily: "'Poppins', sans-serif",
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#a89ec8', marginBottom: '0.5rem',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(168,85,247,0.1)', borderTopColor: '#A855F7', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#eef0f6', marginBottom: '0.25rem' }}>Courses</h2>
          <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Manage courses with multi-lesson video downloads</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem',
          background: showForm ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg, #A855F7, #7C3AED)',
          border: showForm ? '1px solid rgba(239,68,68,0.2)' : 'none', borderRadius: '10px',
          color: showForm ? '#f87171' : '#fff', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
          boxShadow: showForm ? 'none' : '0 4px 16px rgba(168,85,247,0.3)',
          fontFamily: "'Poppins', sans-serif",
        }}>
          {showForm ? <><X style={{ width: 16, height: 16 }} /> Cancel</> : <><Plus style={{ width: 16, height: 16 }} /> Add Course</>}
        </button>
      </div>

      {/* Storage Summary */}
      {assetMetas.length > 0 && (
        <div style={{
          background: 'linear-gradient(145deg, rgba(168,85,247,0.06) 0%, rgba(18,10,36,0.8) 100%)',
          border: '1px solid rgba(168,85,247,0.2)', borderRadius: '16px', padding: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#D8B4FE', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem' }}>
            <HardDrive style={{ width: 18, height: 18, color: '#A855F7' }} />
            <span>R2 Storage Summary (Staged Assets)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            {[
              { icon: <ImageIcon style={{ width: 14, height: 14, color: '#A855F7' }} />, label: 'Thumbnail', size: thumbnailSize },
              { icon: <FileText style={{ width: 14, height: 14, color: '#38BDF8' }} />, label: 'PDF Workbook', size: pdfSize },
              { icon: <FileArchive style={{ width: 14, height: 14, color: '#F59E0B' }} />, label: 'Resources ZIP', size: zipSize },
            ].map(({ icon, label, size }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#a89ec8' }}>{icon} {label}</div>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#eef0f6', marginTop: '0.25rem' }}>{formatSize(size)}</p>
              </div>
            ))}
            <div style={{ background: 'rgba(168,85,247,0.1)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(168,85,247,0.3)' }}>
              <div style={{ fontSize: '0.75rem', color: '#D8B4FE', fontWeight: 600 }}>Total Storage Used</div>
              <p style={{ fontSize: '1.125rem', fontWeight: 800, color: '#4ade80', marginTop: '0.25rem' }}>{formatSize(totalStorage)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Course Form */}
      {showForm && (
        <div style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(168,85,247,0.15)', borderRadius: '16px', padding: '1.5rem',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#eef0f6', marginBottom: '1.25rem' }}>Create New Course</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Course Title *</label>
              <input name="title" required placeholder="e.g. Content Creation Masterclass" style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>

            <div>
              <label style={labelStyle}>Description *</label>
              <textarea name="description" required rows={3} placeholder="Describe what users will learn..."
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Price (₹) *</label>
                <input name="price" type="number" required min="0" step="0.01" placeholder="4999" style={inputStyle}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
              </div>
              <div>
                <label style={labelStyle}>Original Price (₹)</label>
                <input name="originalPrice" type="number" min="0" step="0.01" placeholder="9999" style={inputStyle}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <input name="category" placeholder="e.g. Video Editing" style={inputStyle}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <select name="status" defaultValue="published" style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="published" style={{ background: '#120A24' }}>Published (visible to users)</option>
                <option value="draft" style={{ background: '#120A24' }}>Draft</option>
              </select>
            </div>

            {/* Cloudflare R2 Upload Zones — Thumbnail, PDF, ZIP only */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <R2FileUpload
                label="Course Thumbnail (Image)"
                accept="image/*"
                maxSizeMB={10}
                assetType="thumbnail"
                onUploadSuccess={(data) => handleAssetUploadSuccess('thumbnail', data)}
              />
              <R2FileUpload
                label="Course Workbook (PDF)"
                accept=".pdf"
                maxSizeMB={50}
                assetType="pdf"
                onUploadSuccess={(data) => handleAssetUploadSuccess('pdf', data)}
              />
            </div>

            <R2FileUpload
              label="Resources ZIP (Optional)"
              accept=".zip,.rar,.7z"
              maxSizeMB={5000}
              assetType="zip"
              onUploadSuccess={(data) => handleAssetUploadSuccess('zip', data)}
            />

            <p style={{ fontSize: '0.75rem', color: '#6b5e88', fontStyle: 'italic' }}>
              💡 Lesson videos are added after creating the course — click the course row below to manage lessons.
            </p>

            <button type="submit" disabled={submitting} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.875rem', background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
              border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.9375rem', fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
              boxShadow: '0 4px 20px rgba(168,85,247,0.3)', fontFamily: "'Poppins', sans-serif",
              marginTop: '0.5rem',
            }}>
              {submitting ? <Loader2 style={{ width: 18, height: 18, animation: 'spin 0.8s linear infinite' }} /> : null}
              {submitting ? 'Saving Course...' : 'Create Course'}
            </button>
          </form>
        </div>
      )}

      {/* Courses List */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden',
      }}>
        {allCourses.length === 0 ? (
          <div style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
            <BookOpen style={{ width: 40, height: 40, color: '#6b5e88', margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#a89ec8', marginBottom: '0.25rem' }}>No courses yet</p>
            <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Click &quot;Add Course&quot; to get started</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {allCourses.map((course) => {
              const sc = statusColor[course.status] || statusColor.draft;
              const isExpanded = expandedCourseId === course.id;
              const slug = course.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

              return (
                <div key={course.id}>
                  {/* Course Row */}
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer', transition: 'background 0.2s',
                    }}
                    onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      {isExpanded
                        ? <ChevronUp style={{ width: 16, height: 16, color: '#A855F7', flexShrink: 0 }} />
                        : <ChevronDown style={{ width: 16, height: 16, color: '#6b5e88', flexShrink: 0 }} />
                      }
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#eef0f6' }}>{course.title}</span>
                        <div style={{ fontSize: '0.6875rem', color: '#6b5e88', marginTop: '0.125rem' }}>
                          {course.category || 'Uncategorized'} · ₹{(course.price / 100).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(course); }} style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '0.6875rem', fontWeight: 700,
                        background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                        textTransform: 'capitalize', cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                      }}>{course.status}</button>

                      <button onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }} disabled={deleteId === course.id}
                        style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        }}
                      >
                        {deleteId === course.id
                          ? <Loader2 style={{ width: 14, height: 14, color: '#ef4444', animation: 'spin 0.8s linear infinite' }} />
                          : <Trash2 style={{ width: 14, height: 14, color: '#ef4444' }} />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Expanded: Lesson Manager */}
                  {isExpanded && (
                    <div style={{
                      padding: '1rem 1.25rem 1.5rem',
                      borderBottom: '1px solid rgba(168,85,247,0.15)',
                      background: 'rgba(168,85,247,0.02)',
                    }}>
                      <LessonManager courseId={course.id} courseSlug={slug} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
