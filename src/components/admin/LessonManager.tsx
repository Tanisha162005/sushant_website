'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, RefreshCw, Video, Check, AlertCircle, X, Loader2, Download } from 'lucide-react';

interface LessonData {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  videoKey: string;
  duration: number | null;
  fileSize: number | null;
  displayOrder: number;
}

interface LessonManagerProps {
  courseId: string;
  courseSlug: string;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min >= 60) {
    const hr = Math.floor(min / 60);
    const remainMin = min % 60;
    return `${hr}h ${remainMin}m`;
  }
  return sec > 0 ? `${min}m ${sec}s` : `${min} min`;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

export function LessonManager({ courseId, courseSlug }: LessonManagerProps) {
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingLesson, setAddingLesson] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Upload state per-lesson
  const [uploadingLessonId, setUploadingLessonId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fetchLessons = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/lessons`);
      const data = await res.json();
      if (data.success) setLessons(data.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [courseId]);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  // Upload video to R2 via presigned URL
  const uploadVideo = async (file: File, lessonId: string, isReplace: boolean = false) => {
    setUploadingLessonId(lessonId);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // 1. Get presigned URL
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || 'video/mp4',
          size: file.size,
          courseSlug,
        }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok || !presignData.success) {
        throw new Error(presignData.error?.message || presignData.message || 'Failed to get presigned URL');
      }

      const { presignedUrl, objectKey } = presignData.data;

      // 2. Upload directly to R2
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        activeXhrRef.current = xhr;
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Network error (CORS blocked): Check your Cloudflare R2 CORS rules for PUT requests.'));
        xhr.onabort = () => reject(new Error('Upload cancelled'));
        xhr.open('PUT', presignedUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.send(file);
      });

      activeXhrRef.current = null;

      // 3. Update lesson with new videoKey
      if (isReplace) {
        await fetch(`/api/admin/courses/${courseId}/lessons/${lessonId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoKey: objectKey, fileSize: file.size }),
        });
      }

      setUploadingLessonId(null);
      setUploadProgress(100);
      return objectKey;
    } catch (err) {
      activeXhrRef.current = null;
      setUploadingLessonId(null);
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
      throw err;
    }
  };

  // Add a new lesson
  const handleAddLesson = async (file: File) => {
    if (!newTitle.trim()) return;
    setAddingLesson(true);

    try {
      // Upload video first to get objectKey
      const tempId = 'new-lesson';
      setUploadingLessonId(tempId);
      setUploadProgress(0);

      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || 'video/mp4',
          size: file.size,
          courseSlug,
        }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok || !presignData.success) throw new Error(presignData.message || 'Presign failed');

      const { presignedUrl, objectKey } = presignData.data;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        activeXhrRef.current = xhr;
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Network error (CORS blocked): Check your Cloudflare R2 CORS rules for PUT requests.'));
        xhr.open('PUT', presignedUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.send(file);
      });

      activeXhrRef.current = null;
      setUploadingLessonId(null);

      // Create lesson in DB
      const durationSec = newDuration ? Math.round(parseFloat(newDuration) * 60) : null;
      await fetch(`/api/admin/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          videoKey: objectKey,
          duration: durationSec,
          fileSize: file.size,
        }),
      });

      setNewTitle('');
      setNewDescription('');
      setNewDuration('');
      await fetchLessons();
    } catch (err) {
      activeXhrRef.current = null;
      setUploadingLessonId(null);
      const msg = err instanceof Error ? err.message : 'Failed to add lesson';
      setUploadError(msg);
    }

    setAddingLesson(false);
  };

  // Delete lesson
  const handleDelete = async (lessonId: string) => {
    setDeletingId(lessonId);
    try {
      await fetch(`/api/admin/courses/${courseId}/lessons/${lessonId}`, { method: 'DELETE' });
      await fetchLessons();
    } catch { /* ignore */ }
    setDeletingId(null);
  };

  // Move up/down
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newLessons = [...lessons];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newLessons.length) return;
    [newLessons[index], newLessons[targetIdx]] = [newLessons[targetIdx], newLessons[index]];
    setLessons(newLessons);
    await fetch(`/api/admin/courses/${courseId}/lessons/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: newLessons.map(l => l.id) }),
    });
  };

  // Drag & drop reorder
  const handleDragEnd = async () => {
    if (dragIndex === null || dragOverIndex === null || dragIndex === dragOverIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newLessons = [...lessons];
    const [dragged] = newLessons.splice(dragIndex, 1);
    newLessons.splice(dragOverIndex, 0, dragged);
    setLessons(newLessons);
    setDragIndex(null);
    setDragOverIndex(null);
    await fetch(`/api/admin/courses/${courseId}/lessons/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: newLessons.map(l => l.id) }),
    });
  };

  // Replace video
  const handleReplaceVideo = (lessonId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/mp4,video/webm';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        await uploadVideo(file, lessonId, true);
        await fetchLessons();
      } catch { /* error is set in state */ }
    };
    input.click();
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    transition: 'all 0.2s ease',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#eef0f6',
    fontSize: '0.8125rem',
    outline: 'none',
    fontFamily: "'Poppins', sans-serif",
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Summary
  const totalDuration = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
  const totalSize = lessons.reduce((sum, l) => sum + (l.fileSize || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header + Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#eef0f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Video style={{ width: 18, height: 18, color: '#EC4899' }} />
            Course Lessons ({lessons.length})
          </h4>
          {lessons.length > 0 && (
            <p style={{ fontSize: '0.75rem', color: '#6b5e88', marginTop: '0.25rem' }}>
              Total: {formatDuration(totalDuration)} · {formatSize(totalSize)}
            </p>
          )}
        </div>
      </div>

      {/* Lesson List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b5e88' }}>
          <Loader2 style={{ width: 20, height: 20, animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
              onDragEnd={handleDragEnd}
              style={{
                ...cardStyle,
                borderColor: dragOverIndex === index ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.06)',
                opacity: dragIndex === index ? 0.5 : 1,
              }}
            >
              {/* Drag handle */}
              <div style={{ cursor: 'grab', color: '#6b5e88', flexShrink: 0 }}>
                <GripVertical style={{ width: 16, height: 16 }} />
              </div>

              {/* Lesson number */}
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: '#D8B4FE', flexShrink: 0,
              }}>
                {String(index + 1).padStart(2, '0')}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#eef0f6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {lesson.title}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.125rem', fontSize: '0.6875rem', color: '#6b5e88' }}>
                  <span>{formatDuration(lesson.duration)}</span>
                  <span>{formatSize(lesson.fileSize)}</span>
                </div>
              </div>

              {/* Upload progress for this lesson */}
              {uploadingLessonId === lesson.id && (
                <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#A855F7', transition: 'width 0.2s ease' }} />
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                <button onClick={() => handleMove(index, 'up')} disabled={index === 0}
                  title="Move up"
                  style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1 }}>
                  <ChevronUp style={{ width: 12, height: 12, color: '#a89ec8' }} />
                </button>
                <button onClick={() => handleMove(index, 'down')} disabled={index === lessons.length - 1}
                  title="Move down"
                  style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: index === lessons.length - 1 ? 'default' : 'pointer', opacity: index === lessons.length - 1 ? 0.3 : 1 }}>
                  <ChevronDown style={{ width: 12, height: 12, color: '#a89ec8' }} />
                </button>
                <button onClick={() => handleReplaceVideo(lesson.id)}
                  title="Replace video"
                  style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <RefreshCw style={{ width: 12, height: 12, color: '#A855F7' }} />
                </button>
                <button onClick={() => handleDelete(lesson.id)} disabled={deletingId === lesson.id}
                  title="Delete lesson"
                  style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  {deletingId === lesson.id
                    ? <Loader2 style={{ width: 12, height: 12, color: '#ef4444', animation: 'spin 0.8s linear infinite' }} />
                    : <Trash2 style={{ width: 12, height: 12, color: '#ef4444' }} />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px' }}>
          <AlertCircle style={{ width: 14, height: 14, color: '#f87171', flexShrink: 0 }} />
          <p style={{ fontSize: '0.75rem', color: '#f87171', flex: 1 }}>{uploadError}</p>
          <button onClick={() => setUploadError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <X style={{ width: 12, height: 12, color: '#f87171' }} />
          </button>
        </div>
      )}

      {/* New upload progress */}
      {uploadingLessonId === 'new-lesson' && (
        <div style={{ padding: '0.75rem', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#D8B4FE', marginBottom: '0.375rem' }}>
            <span>Uploading lesson video to R2...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #A855F7, #EC4899)', transition: 'width 0.2s ease' }} />
          </div>
        </div>
      )}

      {/* Add Lesson Form */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed rgba(168,85,247,0.2)',
        borderRadius: '12px',
        padding: '1rem',
      }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#a89ec8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <Plus style={{ width: 14, height: 14 }} /> Add New Lesson
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input
            placeholder="Lesson Title *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Duration (minutes)"
            type="number"
            min="0"
            step="0.5"
            value={newDuration}
            onChange={(e) => setNewDuration(e.target.value)}
            style={inputStyle}
          />
        </div>

        <input
          placeholder="Lesson Description (optional)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          style={{ ...inputStyle, marginBottom: '0.5rem' }}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleAddLesson(file);
            e.target.value = '';
          }}
        />

        <button
          onClick={() => {
            if (!newTitle.trim()) {
              setUploadError('Lesson title is required');
              return;
            }
            fileInputRef.current?.click();
          }}
          disabled={addingLesson || uploadingLessonId === 'new-lesson'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            width: '100%', padding: '0.625rem',
            background: addingLesson ? 'rgba(168,85,247,0.1)' : 'linear-gradient(135deg, #A855F7, #7C3AED)',
            border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8125rem', fontWeight: 600,
            cursor: addingLesson ? 'not-allowed' : 'pointer', opacity: addingLesson ? 0.7 : 1,
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          {addingLesson ? (
            <><Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} /> Adding Lesson...</>
          ) : (
            <><Plus style={{ width: 14, height: 14 }} /> Select Video & Add Lesson</>
          )}
        </button>
      </div>
    </div>
  );
}
