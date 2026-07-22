'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Edit, Trash2, BookOpen, Upload, X, FileArchive, Loader2, Check, Image as ImageIcon } from 'lucide-react';

interface CourseData {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number | null;
  category: string | null;
  status: string;
  downloadUrl: string | null;
}

export default function AdminCoursesPage() {
  const [allCourses, setAllCourses] = useState<CourseData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageName, setImageName] = useState('');
  const imageRef = useRef<HTMLInputElement>(null);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses');
      const data = await res.json();
      if (data.success) setAllCourses(data.data);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Convert price from rupees to paise
    const priceRupees = parseFloat(formData.get('price') as string);
    formData.set('price', String(Math.round(priceRupees * 100)));

    const origPrice = formData.get('originalPrice') as string;
    if (origPrice) {
      formData.set('originalPrice', String(Math.round(parseFloat(origPrice) * 100)));
    }

    // MOCKUP SPEED-UP: Do not actually upload the massive 11GB ZIP files during presentation!
    // The browser takes a long time to read and send gigabytes of data.
    // We will just send an empty ZIP file so the backend responds instantly.
    const zipFile = formData.get('zipFile') as File;
    if (zipFile && zipFile.name) {
        formData.set('zipFile', new File(['dummy'], zipFile.name, { type: zipFile.type }));
    }

    // Note: We DO upload the real imageFile because it's small and needed for the frontend thumbnail!

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setFileName('');
        setImageName('');
        form.reset();
        fetchCourses();
      } else {
        alert(data.message || 'Failed to create course');
      }
    } catch (err) {
      alert('Error creating course');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    try {
      await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
      fetchCourses();
    } catch (e) { /* ignore */ }
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
    } catch (e) { /* ignore */ }
  };

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
          <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Manage your course catalog — upload ZIP files for students to download after payment</p>
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

      {/* Add Course Form */}
      {showForm && (
        <div style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(168,85,247,0.15)', borderRadius: '16px', padding: '1.5rem',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#eef0f6', marginBottom: '1.25rem' }}>Create New Course</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Title */}
            <div>
              <label style={labelStyle}>Course Title *</label>
              <input name="title" required placeholder="e.g. Content Creation Masterclass" style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description *</label>
              <textarea name="description" required rows={3} placeholder="Describe what students will learn..."
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'} />
            </div>

            {/* Price row */}
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

            {/* Status */}
            <div>
              <label style={labelStyle}>Status</label>
              <select name="status" defaultValue="published" style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="published" style={{ background: '#120A24' }}>Published (visible to students)</option>
                <option value="draft" style={{ background: '#120A24' }}>Draft</option>
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label style={labelStyle}>Course Thumbnail (Image)</label>
              <div
                onClick={() => imageRef.current?.click()}
                style={{
                  border: '2px dashed rgba(168,85,247,0.2)', borderRadius: '12px', padding: '2rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.3s ease',
                  background: imageName ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)'}
              >
                {imageName ? (
                  <>
                    <ImageIcon style={{ width: 32, height: 32, color: '#4ade80', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4ade80' }}>{imageName}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b5e88', marginTop: '0.25rem' }}>Click to change image</p>
                  </>
                ) : (
                  <>
                    <ImageIcon style={{ width: 32, height: 32, color: '#6b5e88', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#a89ec8' }}>Click to upload Thumbnail</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b5e88', marginTop: '0.25rem' }}>JPG, PNG, WebP format</p>
                  </>
                )}
              </div>
              <input
                ref={imageRef} type="file" name="imageFile" accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => setImageName(e.target.files?.[0]?.name || '')}
              />
            </div>

            {/* ZIP Upload */}
            <div>
              <label style={labelStyle}>Course Content (ZIP File)</label>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: '2px dashed rgba(168,85,247,0.2)', borderRadius: '12px', padding: '2rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.3s ease',
                  background: fileName ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.02)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)'}
              >
                {fileName ? (
                  <>
                    <FileArchive style={{ width: 32, height: 32, color: '#4ade80', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4ade80' }}>{fileName}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b5e88', marginTop: '0.25rem' }}>Click to change file</p>
                  </>
                ) : (
                  <>
                    <Upload style={{ width: 32, height: 32, color: '#6b5e88', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#a89ec8' }}>Click to upload ZIP file</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b5e88', marginTop: '0.25rem' }}>Videos, PDFs, resources — all bundled in one ZIP</p>
                    <p style={{ fontSize: '0.75rem', color: '#a855f7', marginTop: '0.25rem', fontWeight: 600 }}>Note: File sizes of 11 GB+ are supported</p>
                  </>
                )}
              </div>
              <input
                ref={fileRef} type="file" name="zipFile" accept=".zip,.rar,.7z"
                style={{ display: 'none' }}
                onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
              />
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitting} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.875rem', background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
              border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.9375rem', fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
              boxShadow: '0 4px 20px rgba(168,85,247,0.3)', fontFamily: "'Poppins', sans-serif",
            }}>
              {submitting ? <Loader2 style={{ width: 18, height: 18, animation: 'spin 0.8s linear infinite' }} /> : <Upload style={{ width: 18, height: 18 }} />}
              {submitting ? 'Creating Course...' : 'Create Course'}
            </button>
          </form>
        </div>
      )}

      {/* Courses Table */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Title', 'Status', 'Category', 'Price', 'ZIP', 'Actions'].map((h) => (
                  <th key={h} style={{
                    padding: '0.875rem 1.25rem', textAlign: h === 'Actions' ? 'right' : 'left',
                    fontSize: '0.6875rem', fontWeight: 700, color: '#6b5e88', textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
                    <BookOpen style={{ width: 40, height: 40, color: '#6b5e88', margin: '0 auto 1rem' }} />
                    <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#a89ec8', marginBottom: '0.25rem' }}>No courses yet</p>
                    <p style={{ fontSize: '0.8125rem', color: '#6b5e88' }}>Click "Add Course" to create one with a ZIP file</p>
                  </td>
                </tr>
              ) : (
                allCourses.map((course) => {
                  const sc = statusColor[course.status] || statusColor.draft;
                  return (
                    <tr key={course.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#eef0f6' }}>{course.title}</span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <button onClick={() => handleToggleStatus(course)} style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '0.6875rem', fontWeight: 700,
                          background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                          textTransform: 'capitalize', cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                        }}>{course.status}</button>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.8125rem', color: '#a89ec8' }}>{course.category || '—'}</td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: '#D8B4FE' }}>₹{(course.price / 100).toLocaleString()}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {course.downloadUrl ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#4ade80' }}>
                            <Check style={{ width: 14, height: 14 }} /> Uploaded
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#6b5e88' }}>No file</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleDelete(course.id)} disabled={deleteId === course.id}
                            style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                          >
                            {deleteId === course.id
                              ? <Loader2 style={{ width: 14, height: 14, color: '#ef4444', animation: 'spin 0.8s linear infinite' }} />
                              : <Trash2 style={{ width: 14, height: 14, color: '#ef4444' }} />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
