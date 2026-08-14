'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Plus, Trash2, BookOpen, X, Loader2, Check, HardDrive, Image as ImageIcon, FileText, FileArchive, Video as VideoIcon, ChevronDown, ChevronUp, AlertCircle, Pencil, Save } from 'lucide-react';
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
  imageUrl: string | null;
  downloadUrl: string | null;
  lessonCount?: number;
}

interface UploadedAssetMeta {
  size: number;
  assetType: 'thumbnail' | 'pdf' | 'zip';
  filename: string;
}

interface StagedLesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoKey: string;
  fileSize: number;
  filename: string;
  uploading: boolean;
  progress: number;
  error: string | null;
}

function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 MB';
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

  // Edit state
  const [editCourse, setEditCourse] = useState<CourseData | null>(null);
  const [editForm, setEditForm] = useState({
    title: '', description: '', price: '', originalPrice: '', category: '', status: 'published',
  });
  const [editThumbnailKey, setEditThumbnailKey] = useState<string>('');
  const [editSaving, setEditSaving] = useState(false);

  // Uploaded R2 Object Keys & Metadata tracking for course assets
  const [thumbnailKey, setThumbnailKey] = useState<string>('');
  const [pdfKey, setPdfKey] = useState<string>('');
  const [zipKey, setZipKey] = useState<string>('');
  const [assetMetas, setAssetMetas] = useState<UploadedAssetMeta[]>([]);

  // Staged Lesson MP4 Videos during Course Creation
  const [stagedLessons, setStagedLessons] = useState<StagedLesson[]>([]);
  const [showOptionalZip, setShowOptionalZip] = useState(false);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses');
      const data = await res.json();
      if (data.success) setAllCourses(data.data);
    } catch { /* ignore */ }
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

  // Staged Lesson Handlers
  const addStagedLesson = () => {
    const newId = `staged_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setStagedLessons((prev) => [
      ...prev,
      {
        id: newId,
        title: `Lesson ${prev.length + 1}`,
        description: '',
        duration: '',
        videoKey: '',
        fileSize: 0,
        filename: '',
        uploading: false,
        progress: 0,
        error: null,
      },
    ]);
  };

  const removeStagedLesson = (id: string) => {
    setStagedLessons((prev) => prev.filter((l) => l.id !== id));
  };

  const updateStagedLesson = (id: string, updates: Partial<StagedLesson>) => {
    setStagedLessons((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const uploadStagedLessonVideo = async (id: string, file: File, courseTitle: string) => {
    updateStagedLesson(id, { uploading: true, progress: 0, error: null, filename: file.name });
    const slug = (courseTitle || 'draft-course').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    try {
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || 'video/mp4',
          size: file.size,
          courseSlug: slug,
        }),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok || !presignData.success) {
        throw new Error(presignData.error?.message || presignData.message || 'Failed to generate R2 upload link');
      }

      const { presignedUrl, objectKey } = presignData.data;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            updateStagedLesson(id, { progress: Math.round((e.loaded / e.total) * 100) });
          }
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
        xhr.onerror = () => reject(new Error('Network error (CORS blocked): Please enable CORS in your Cloudflare R2 bucket settings for PUT requests.'));
        xhr.open('PUT', presignedUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.send(file);
      });

      updateStagedLesson(id, { uploading: false, progress: 100, videoKey: objectKey, fileSize: file.size });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      updateStagedLesson(id, { uploading: false, error: msg });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Verify all staged lessons with video uploads are completed
    const incomplete = stagedLessons.filter((l) => l.uploading || (l.title && !l.videoKey));
    if (incomplete.length > 0) {
      if (incomplete.some((l) => l.uploading)) {
        alert('Please wait for all lesson MP4 videos to finish uploading to Cloudflare R2 before submitting.');
        return;
      }
      alert('Please upload an MP4 video file for each added lesson, or remove incomplete lesson blocks.');
      return;
    }

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

    // Include staged lessons payload
    if (stagedLessons.length > 0) {
      const formattedLessons = stagedLessons
        .filter((l) => l.videoKey)
        .map((l, index) => ({
          title: l.title.trim() || `Lesson ${index + 1}`,
          description: l.description.trim() || null,
          videoKey: l.videoKey,
          duration: l.duration ? Math.round(parseFloat(l.duration) * 60) : null, // convert mins to seconds
          fileSize: l.fileSize,
          displayOrder: index + 1,
        }));
      formData.set('lessons', JSON.stringify(formattedLessons));
    }

    try {
      const res = await fetch('/api/admin/courses', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setThumbnailKey('');
        setPdfKey('');
        setZipKey('');
        setAssetMetas([]);
        setStagedLessons([]);
        setShowOptionalZip(false);
        form.reset();
        fetchCourses();
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

  const openEditModal = (course: CourseData) => {
    setEditCourse(course);
    setEditForm({
      title: course.title,
      description: course.description,
      price: String(course.price / 100),
      originalPrice: course.originalPrice ? String(course.originalPrice / 100) : '',
      category: course.category || '',
      status: course.status,
    });
    setEditThumbnailKey('');
  };

  const handleEditSave = async () => {
    if (!editCourse) return;
    setEditSaving(true);
    try {
      const parsedPrice = parseFloat(editForm.price);
      const parsedOriginal = parseFloat(editForm.originalPrice);
      
      const payload: Record<string, any> = {
        title: editForm.title,
        description: editForm.description,
        price: isNaN(parsedPrice) ? 0 : Math.round(parsedPrice * 100),
        originalPrice: isNaN(parsedOriginal) ? null : Math.round(parsedOriginal * 100),
        category: editForm.category || null,
        status: editForm.status,
      };
      if (editThumbnailKey) {
        payload.imageUrl = editThumbnailKey;
      }
      const res = await fetch(`/api/admin/courses/${editCourse.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setEditCourse(null);
        fetchCourses();
      } else {
        alert(data.message || 'Failed to update course');
      }
    } catch {
      alert('Error updating course');
    }
    setEditSaving(false);
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
  const lessonsSize = stagedLessons.reduce((acc, l) => acc + (l.fileSize || 0), 0);
  const totalStorage = thumbnailSize + pdfSize + zipSize + lessonsSize;

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
          <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Create & manage courses with multiple MP4 lesson downloads</p>
        </div>
        <button onClick={() => {
          setShowForm(!showForm);
          if (!showForm && stagedLessons.length === 0) {
            // Automatically start with one lesson block for convenience
            addStagedLesson();
          }
        }} style={{
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
      {(assetMetas.length > 0 || stagedLessons.some(l => l.fileSize > 0)) && (
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
              { icon: <VideoIcon style={{ width: 14, height: 14, color: '#EC4899' }} />, label: `Lesson Videos (${stagedLessons.filter(l => l.videoKey).length})`, size: lessonsSize },
              ...(zipSize > 0 ? [{ icon: <FileArchive style={{ width: 14, height: 14, color: '#F59E0B' }} />, label: 'Resources ZIP', size: zipSize }] : []),
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
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#eef0f6', marginBottom: '1.25rem' }}>Create New Course & Upload Lessons</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Basic Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Course Title *</label>
                <input name="title" id="course-title-input" required placeholder="e.g. Content Creation Masterclass" style={inputStyle}
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
            </div>

            {/* Course Cover & Workbook */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#D8B4FE', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon style={{ width: 16, height: 16 }} /> Course Cover & Workbook
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
            </div>

            {/* NEW: Course Lessons (MP4 Videos) Section */}
            <div style={{
              border: '1px solid rgba(236,72,153,0.3)',
              borderRadius: '16px',
              padding: '1.25rem',
              background: 'linear-gradient(145deg, rgba(236,72,153,0.04) 0%, rgba(168,85,247,0.04) 100%)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#eef0f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <VideoIcon style={{ width: 18, height: 18, color: '#EC4899' }} />
                    Course Lessons (MP4 Videos)
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#a89ec8', marginTop: '0.125rem' }}>
                    Add unlimited MP4 lessons directly during creation (e.g., 5 videos for a masterclass). Each lesson is securely hosted on Cloudflare R2.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addStagedLesson}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #EC4899, #A855F7)', border: 'none', borderRadius: '8px',
                    color: '#fff', fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(236,72,153,0.3)',
                  }}
                >
                  <Plus style={{ width: 14, height: 14 }} /> + Add Lesson Video
                </button>
              </div>

              {stagedLessons.length === 0 ? (
                <div style={{
                  padding: '2rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.15)',
                  borderRadius: '12px', color: '#6b5e88', fontSize: '0.875rem', background: 'rgba(255,255,255,0.01)',
                }}>
                  No lessons added yet. Click &quot;+ Add Lesson Video&quot; above to add your first lesson MP4 video!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {stagedLessons.map((lesson, idx) => (
                    <div key={lesson.id} style={{
                      background: 'rgba(18,10,36,0.7)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.625rem', borderRadius: '6px', background: 'rgba(236,72,153,0.15)',
                          color: '#F472B6', fontWeight: 700, fontSize: '0.75rem', border: '1px solid rgba(236,72,153,0.3)',
                        }}>
                          Lesson #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeStagedLesson(lesson.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.625rem',
                            background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          <Trash2 style={{ width: 12, height: 12 }} /> Remove
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a89ec8', display: 'block', marginBottom: '0.25rem' }}>
                            Lesson Title *
                          </label>
                          <input
                            required
                            placeholder="e.g. Lesson 1: Finding Your Niche"
                            value={lesson.title}
                            onChange={(e) => updateStagedLesson(lesson.id, { title: e.target.value })}
                            style={{ ...inputStyle, padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a89ec8', display: 'block', marginBottom: '0.25rem' }}>
                            Duration (minutes)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="e.g. 15.5"
                            value={lesson.duration}
                            onChange={(e) => updateStagedLesson(lesson.id, { duration: e.target.value })}
                            style={{ ...inputStyle, padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a89ec8', display: 'block', marginBottom: '0.25rem' }}>
                          Description / Topics Covered (Optional)
                        </label>
                        <input
                          placeholder="Brief notes on what this lesson covers..."
                          value={lesson.description}
                          onChange={(e) => updateStagedLesson(lesson.id, { description: e.target.value })}
                          style={{ ...inputStyle, padding: '0.625rem 0.875rem', fontSize: '0.8125rem' }}
                        />
                      </div>

                      {/* Video Upload Area for this lesson */}
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#D8B4FE', display: 'block', marginBottom: '0.375rem' }}>
                          Upload MP4 Video File * (Hosted on Cloudflare R2)
                        </label>
                        
                        {lesson.videoKey ? (
                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.75rem 1rem', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)',
                            borderRadius: '10px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Check style={{ width: 18, height: 18, color: '#4ade80', flexShrink: 0 }} />
                              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#eef0f6', wordBreak: 'break-all' }}>
                                {lesson.filename || 'Video uploaded to R2'}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4ade80', flexShrink: 0 }}>
                              {formatSize(lesson.fileSize)}
                            </span>
                          </div>
                        ) : lesson.uploading ? (
                          <div style={{
                            padding: '0.875rem', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)',
                            borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#D8B4FE' }}>
                              <span>Uploading {lesson.filename} directly to Cloudflare R2...</span>
                              <span>{lesson.progress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${lesson.progress}%`, height: '100%',
                                background: 'linear-gradient(90deg, #EC4899, #A855F7)', transition: 'width 0.2s ease',
                              }} />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                              padding: '1.5rem', border: '1px dashed rgba(236,72,153,0.4)', borderRadius: '10px',
                              background: 'rgba(236,72,153,0.03)', cursor: 'pointer', transition: 'all 0.2s ease',
                              textAlign: 'center',
                            }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(236,72,153,0.07)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(236,72,153,0.03)'}
                            >
                              <VideoIcon style={{ width: 28, height: 28, color: '#EC4899', marginBottom: '0.5rem' }} />
                              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#eef0f6' }}>
                                Click to Select Lesson MP4 Video File
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#a89ec8', marginTop: '0.25rem' }}>
                                Supports .mp4, .mov, .webm (No size limit — Direct R2 Presign Upload)
                              </span>
                              <input
                                type="file"
                                accept="video/*,.mp4,.webm,.mkv,.mov"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const titleEl = document.getElementById('course-title-input') as HTMLInputElement | null;
                                  const courseTitle = titleEl?.value || 'course';
                                  uploadStagedLessonVideo(lesson.id, file, courseTitle);
                                }}
                              />
                            </label>
                          </div>
                        )}

                        {lesson.error && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.25)' }}>
                            <AlertCircle style={{ width: 14, height: 14, color: '#f87171', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.75rem', color: '#f87171' }}>{lesson.error}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Legacy ZIP Option */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowOptionalZip(!showOptionalZip)}
                style={{
                  background: 'none', border: 'none', color: '#a89ec8', fontSize: '0.8125rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer', padding: 0,
                }}
              >
                {showOptionalZip ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                Need to include a supplementary Resources ZIP bundle? (Click to {showOptionalZip ? 'hide' : 'show'})
              </button>

              {showOptionalZip && (
                <div style={{ marginTop: '0.75rem' }}>
                  <R2FileUpload
                    label="Supplementary Resources ZIP (Optional)"
                    accept=".zip,.rar,.7z"
                    maxSizeMB={5000}
                    assetType="zip"
                    onUploadSuccess={(data) => handleAssetUploadSuccess('zip', data)}
                  />
                </div>
              )}
            </div>

            <button type="submit" disabled={submitting} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.875rem', background: 'linear-gradient(135deg, #EC4899, #A855F7, #7C3AED)',
              border: 'none', borderRadius: '12px', color: '#fff', fontSize: '1rem', fontWeight: 800,
              cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
              boxShadow: '0 4px 25px rgba(236,72,153,0.4)', fontFamily: "'Poppins', sans-serif",
              marginTop: '0.5rem', transition: 'all 0.2s ease',
            }}>
              {submitting ? <Loader2 style={{ width: 20, height: 20, animation: 'spin 0.8s linear infinite' }} /> : <VideoIcon style={{ width: 20, height: 20 }} />}
              {submitting ? 'Saving Course & Lessons to Database...' : `Create Course ${stagedLessons.length > 0 ? `with ${stagedLessons.length} Lesson Video(s)` : ''}`}
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
            <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Click &quot;Add Course&quot; to create your first course and upload lesson videos!</p>
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
                        ? <ChevronUp style={{ width: 16, height: 16, color: '#EC4899', flexShrink: 0 }} />
                        : <ChevronDown style={{ width: 16, height: 16, color: '#6b5e88', flexShrink: 0 }} />
                      }
                      <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#eef0f6', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{course.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.6875rem', color: '#a89ec8', marginTop: '0.25rem' }}>
                          <span style={{ background: 'rgba(236,72,153,0.15)', color: '#F472B6', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                            🎬 {course.lessonCount ?? 0} Lesson Video(s)
                          </span>
                          <span>·</span>
                          <span>{course.category || 'Uncategorized'}</span>
                          <span>·</span>
                          <span style={{ fontWeight: 600, color: '#4ade80' }}>₹{(course.price / 100).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(course); }} style={{
                        display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
                        background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                        textTransform: 'capitalize', cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                      }}>{course.status}</button>

                      <button onClick={(e) => { e.stopPropagation(); openEditModal(course); }}
                        style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        }}
                        title="Edit course"
                      >
                        <Pencil style={{ width: 14, height: 14, color: '#A855F7' }} />
                      </button>

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
                      padding: '1.25rem',
                      borderBottom: '1px solid rgba(236,72,153,0.2)',
                      background: 'rgba(18,10,36,0.6)',
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

      {/* Edit Course Modal */}
      {editCourse && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
          }}
          onClick={() => !editSaving && setEditCourse(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(145deg, rgba(30,20,60,0.98) 0%, rgba(18,10,36,0.99) 100%)',
              border: '1px solid rgba(168,85,247,0.25)', borderRadius: '20px',
              padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#eef0f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pencil style={{ width: 20, height: 20, color: '#A855F7' }} /> Edit Course
              </h3>
              <button
                onClick={() => !editSaving && setEditCourse(null)}
                disabled={editSaving}
                style={{
                  width: 32, height: 32, borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)', color: '#a89ec8', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Edit Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Course Title *</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={inputStyle}
                  placeholder="Course title"
                />
              </div>

              <div>
                <label style={labelStyle}>Description *</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="Course description"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Price (₹) *</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    style={inputStyle}
                    placeholder="4999"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Original Price (₹)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={editForm.originalPrice}
                    onChange={(e) => setEditForm({ ...editForm, originalPrice: e.target.value })}
                    style={inputStyle}
                    placeholder="9999"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Category</label>
                  <input
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    style={inputStyle}
                    placeholder="e.g. Video Editing"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="published" style={{ background: '#120A24' }}>Published</option>
                    <option value="draft" style={{ background: '#120A24' }}>Draft</option>
                    <option value="archived" style={{ background: '#120A24' }}>Archived</option>
                  </select>
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                <label style={labelStyle}>Replace Thumbnail (optional)</label>
                {editCourse.imageUrl && !editThumbnailKey && (
                  <div style={{
                    marginBottom: '0.75rem', borderRadius: '10px', overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.08)', maxWidth: '200px',
                  }}>
                    <img
                      src={editCourse.imageUrl.startsWith('http') || editCourse.imageUrl.startsWith('/api')
                        ? editCourse.imageUrl
                        : `/api/courses/${editCourse.id}/thumbnail`}
                      alt="Current thumbnail"
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <p style={{ fontSize: '0.7rem', color: '#a89ec8', padding: '0.375rem 0.5rem', background: 'rgba(255,255,255,0.03)' }}>
                      Current thumbnail
                    </p>
                  </div>
                )}
                {editThumbnailKey && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem',
                    padding: '0.625rem 0.875rem', background: 'rgba(74,222,128,0.08)',
                    border: '1px solid rgba(74,222,128,0.25)', borderRadius: '10px',
                  }}>
                    <Check style={{ width: 16, height: 16, color: '#4ade80' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4ade80' }}>New thumbnail uploaded</span>
                  </div>
                )}
                <R2FileUpload
                  label="Upload New Thumbnail"
                  accept="image/*"
                  maxSizeMB={10}
                  assetType="thumbnail"
                  onUploadSuccess={(data) => setEditThumbnailKey(data.objectKey)}
                />
              </div>
            </div>

            {/* Save / Cancel */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={handleEditSave}
                disabled={editSaving || !editForm.title || !editForm.description || !editForm.price}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.875rem', background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
                  border: 'none', borderRadius: '12px', color: '#fff', fontSize: '0.9375rem', fontWeight: 800,
                  cursor: editSaving ? 'not-allowed' : 'pointer', opacity: editSaving ? 0.7 : 1,
                  boxShadow: '0 4px 20px rgba(168,85,247,0.4)', fontFamily: "'Poppins', sans-serif",
                  transition: 'all 0.2s ease',
                }}
              >
                {editSaving
                  ? <><Loader2 style={{ width: 18, height: 18, animation: 'spin 0.8s linear infinite' }} /> Saving...</>
                  : <><Save style={{ width: 18, height: 18 }} /> Save Changes</>
                }
              </button>
              <button
                onClick={() => setEditCourse(null)}
                disabled={editSaving}
                style={{
                  padding: '0.875rem 1.5rem', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                  color: '#a89ec8', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
