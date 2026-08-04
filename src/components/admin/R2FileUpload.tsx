'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileArchive, FileText, Video as VideoIcon, Image as ImageIcon, X, RefreshCw, Check, AlertCircle } from 'lucide-react';

interface R2FileUploadProps {
  label: string;
  accept: string;
  maxSizeMB: number;
  assetType: 'thumbnail' | 'pdf' | 'zip' | 'video';
  courseSlug?: string;
  onUploadSuccess: (data: { objectKey: string; filename: string; mimeType: string; size: number }) => void;
  onUploadError?: (error: string) => void;
}

export function R2FileUpload({
  label,
  accept,
  maxSizeMB,
  assetType,
  courseSlug = 'foundation-course',
  onUploadSuccess,
  onUploadError,
}: R2FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);

  const resetState = () => {
    setSelectedFile(null);
    setProgress(0);
    setUploading(false);
    setSuccess(false);
    setError(null);
    setPreviewUrl(null);
    if (activeXhrRef.current) {
      activeXhrRef.current.abort();
      activeXhrRef.current = null;
    }
  };

  const handleFileSelect = (file: File) => {
    resetState();

    if (file.size > maxSizeMB * 1024 * 1024) {
      const err = `File size (${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB) exceeds maximum allowed (${maxSizeMB / 1024} GB)`;
      setError(err);
      if (onUploadError) onUploadError(err);
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    startUpload(file);
  };

  const startUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setProgress(0);

    const SINGLE_PART_LIMIT = 5 * 1024 * 1024 * 1024; // 5 GB limit for single PUT

    if (file.size > SINGLE_PART_LIMIT) {
      // ── S3 Chunked Multipart Upload for Multi-GB files (>5 GB, e.g. 11.8 GB ZIP) ──
      try {
        const CHUNK_SIZE = 20 * 1024 * 1024; // 20 MB chunks
        const initRes = await fetch('/api/upload/multipart/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            courseSlug,
            chunkSize: CHUNK_SIZE,
          }),
        });

        const initData = await initRes.json();
        if (!initRes.ok || !initData.success) {
          throw new Error(initData.error?.message || initData.message || 'Failed to initialize multipart upload');
        }

        const { uploadId, objectKey, partUrls, totalParts } = initData.data;
        const uploadedParts: { ETag: string; PartNumber: number }[] = [];
        let bytesUploaded = 0;

        for (let i = 0; i < totalParts; i++) {
          const partNumber = i + 1;
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);
          const partUrl = partUrls[i];

          const etag = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            activeXhrRef.current = xhr;

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const currentUploaded = bytesUploaded + e.loaded;
                const percent = Math.round((currentUploaded / file.size) * 100);
                setProgress(Math.min(percent, 99));
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const rawETag = xhr.getResponseHeader('ETag') || xhr.getResponseHeader('etag') || `part-${partNumber}`;
                resolve(rawETag.replace(/^"|"$/g, ''));
              } else {
                reject(new Error(`Part ${partNumber} upload failed with status ${xhr.status}`));
              }
            };

            xhr.onerror = () => reject(new Error(`Network/CORS error during upload of part ${partNumber}. Check Cloudflare R2 CORS configuration.`));
            xhr.onabort = () => reject(new Error('Upload cancelled'));

            xhr.open('PUT', partUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/octet-stream');
            xhr.send(chunk);
          });

          bytesUploaded += chunk.size;
          uploadedParts.push({ ETag: etag, PartNumber: partNumber });
        }

        activeXhrRef.current = null;

        // Complete multipart upload
        const completeRes = await fetch('/api/upload/multipart/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            objectKey,
            uploadId,
            parts: uploadedParts,
            filename: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            assetType,
          }),
        });

        const completeData = await completeRes.json();
        if (!completeRes.ok || !completeData.success) {
          throw new Error(completeData.error?.message || 'Failed to finalize multipart upload');
        }

        setUploading(false);
        setSuccess(true);
        setProgress(100);
        onUploadSuccess({
          objectKey,
          filename: file.name,
          mimeType: file.type || 'application/zip',
          size: file.size,
        });
      } catch (err: unknown) {
        activeXhrRef.current = null;
        setUploading(false);
        const errMsg = err instanceof Error ? err.message : 'Multipart upload failed';
        if (errMsg !== 'Upload cancelled') {
          setError(errMsg);
          if (onUploadError) onUploadError(errMsg);
        }
      }
    } else {
      // ── Direct Cloudflare R2 Presigned Upload for files <= 5 GB ──
      try {
        const presignRes = await fetch('/api/upload/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type || (assetType === 'thumbnail' ? 'image/png' : 'application/octet-stream'),
            size: file.size,
            courseSlug,
          }),
        });

        const presignData = await presignRes.json();
        if (!presignRes.ok || !presignData.success) {
          throw new Error(presignData.error?.message || presignData.message || 'Failed to initialize R2 upload');
        }

        const { presignedUrl, objectKey } = presignData.data;

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          activeXhrRef.current = xhr;

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              setProgress(percent);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Direct R2 upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error (CORS blocked): Check your Cloudflare R2 bucket CORS configuration for PUT requests.'));
          xhr.onabort = () => reject(new Error('Upload cancelled'));

          xhr.open('PUT', presignedUrl, true);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.send(file);
        });

        activeXhrRef.current = null;

        const confirmRes = await fetch('/api/upload/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            objectKey,
            filename: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            assetType,
          }),
        });

        const confirmData = await confirmRes.json();
        if (!confirmRes.ok || !confirmData.success) {
          throw new Error(confirmData.error?.message || 'Failed to confirm metadata');
        }

        setUploading(false);
        setSuccess(true);
        setProgress(100);
        onUploadSuccess({
          objectKey,
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
        });
      } catch (err: unknown) {
        activeXhrRef.current = null;
        setUploading(false);
        const errMsg = err instanceof Error ? err.message : 'Upload failed';
        if (errMsg !== 'Upload cancelled') {
          setError(errMsg);
          if (onUploadError) onUploadError(errMsg);
        }
      }
    }
  };

  const renderIcon = () => {
    if (assetType === 'thumbnail') return <ImageIcon style={{ width: 28, height: 28, color: '#A855F7' }} />;
    if (assetType === 'pdf') return <FileText style={{ width: 28, height: 28, color: '#38BDF8' }} />;
    if (assetType === 'zip') return <FileArchive style={{ width: 28, height: 28, color: '#F59E0B' }} />;
    return <VideoIcon style={{ width: 28, height: 28, color: '#EC4899' }} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#a89ec8' }}>
        {label} <span style={{ fontSize: '0.75rem', color: '#6b5e88' }}>(Max {maxSizeMB >= 1000 ? `${(maxSizeMB / 1000).toFixed(0)} GB` : `${maxSizeMB} MB`})</span>
      </label>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
        }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#A855F7' : success ? 'rgba(74,222,128,0.4)' : error ? 'rgba(239,68,68,0.4)' : 'rgba(168,85,247,0.2)'}`,
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: uploading ? 'default' : 'pointer',
          background: dragOver ? 'rgba(168,85,247,0.08)' : success ? 'rgba(74,222,128,0.03)' : error ? 'rgba(239,68,68,0.03)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.3s ease',
          position: 'relative',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />

        {previewUrl ? (
          <img src={previewUrl} alt="Preview" style={{ maxHeight: '80px', borderRadius: '8px', objectFit: 'cover', marginBottom: '0.5rem' }} />
        ) : (
          <div style={{ marginBottom: '0.5rem' }}>{renderIcon()}</div>
        )}

        {selectedFile ? (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: success ? '#4ade80' : error ? '#f87171' : '#eef0f6' }}>
              {selectedFile.name} ({(selectedFile.size / (1024 * 1024 * (selectedFile.size > 1024*1024*1024 ? 1024 : 1))).toFixed(1)} {selectedFile.size > 1024*1024*1024 ? 'GB' : 'MB'})
            </p>

            {uploading && (
              <div style={{ marginTop: '0.75rem', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#D8B4FE', marginBottom: '0.25rem' }}>
                  <span>{selectedFile.size > 5 * 1024 * 1024 * 1024 ? 'Chunked Multipart Uploading to R2...' : 'Uploading directly to Cloudflare R2...'}</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #A855F7, #4ADE80)', transition: 'width 0.2s ease' }} />
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); resetState(); }}
                  style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <X style={{ width: 12, height: 12 }} /> Cancel Upload
                </button>
              </div>
            )}

            {success && (
              <p style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                <Check style={{ width: 14, height: 14 }} /> Uploaded securely to R2
              </p>
            )}

            {error && (
              <div style={{ marginTop: '0.5rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                  <AlertCircle style={{ width: 14, height: 14 }} /> {error}
                </p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); startUpload(selectedFile); }}
                  style={{ marginTop: '0.25rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <RefreshCw style={{ width: 12, height: 12 }} /> Retry
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#a89ec8' }}>
              Drag & Drop file or <span style={{ color: '#A855F7', textDecoration: 'underline' }}>Browse</span>
            </p>
            <p style={{ fontSize: '0.75rem', color: '#6b5e88', marginTop: '0.25rem' }}>
              Accepted: {accept}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
