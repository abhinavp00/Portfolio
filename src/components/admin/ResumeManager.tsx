import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  Rocket,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import type { ResumePreviewData, ResumeSummaryData } from '../../types/portfolio';
import {
  AdminCard,
  AdminConfirmModal,
  AdminEmptyState,
  AdminPageHeader,
  AdminSkeleton,
  AdminToast,
  formatBytes,
  formatDateTime,
  type AdminToastState,
} from './AdminShared';

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt', '.rtf', '.odt'] as const;
const MAX_RESUME_BYTES = 10 * 1024 * 1024;
const ACCEPT_ATTR =
  '.pdf,.docx,.doc,.txt,.rtf,.odt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain,application/rtf,text/rtf,application/vnd.oasis.opendocument.text';

function getFormatBadgeStyle(format?: string): string {
  const fmt = (format || 'PDF').toUpperCase();
  switch (fmt) {
    case 'PDF':
      return 'bg-rose-500/15 border-rose-500/40 text-rose-300';
    case 'DOCX':
    case 'DOC':
      return 'bg-blue-500/15 border-blue-500/40 text-blue-300';
    case 'ODT':
      return 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300';
    case 'RTF':
      return 'bg-amber-500/15 border-amber-500/40 text-amber-300';
    case 'TXT':
      return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
    default:
      return 'bg-slate-700/40 border-slate-600 text-slate-300';
  }
}

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : '';
}

export const ResumeManager: React.FC = () => {
  const { adminFetch, getToken } = useAdminAuth();
  const [resumes, setResumes] = useState<ResumeSummaryData[]>([]);
  const [loading, setLoading] = useState(true);

  // Header quick PDF upload state (preserved workflow)
  const [quickPdfUploading, setQuickPdfUploading] = useState(false);

  // Drag-and-drop staged multi-format upload state
  const [isDragging, setIsDragging] = useState(false);
  const [dropUploading, setDropUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileMeta, setUploadFileMeta] = useState<{
    name: string;
    size: number;
    format: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stagedResume, setStagedResume] = useState<ResumeSummaryData | null>(null);

  const [toast, setToast] = useState<AdminToastState | null>(null);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ResumePreviewData | null>(null);
  const [previewTab, setPreviewTab] = useState<'formatted' | 'text'>('formatted');
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ResumeSummaryData | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const dragCounterRef = useRef(0);
  const dropInputRef = useRef<HTMLInputElement | null>(null);

  const loadResumes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/resumes');
      if (!res.ok) throw new Error('Failed to load resume versions.');
      const data = (await res.json()) as ResumeSummaryData[];
      setResumes(data);
      setStagedResume((prev) => {
        if (!prev) return null;
        const fresh = data.find((r) => r.id === prev.id);
        return fresh && !fresh.isActive ? fresh : null;
      });
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load resumes.',
      });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  useEffect(() => {
    return () => {
      if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
    };
  }, [previewPdfUrl]);

  // Preserved Quick Header Action: Upload New PDF Resume (immediate publish)
  const handleQuickPdfUpload = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setToast({
        type: 'error',
        message:
          'Quick PDF button accepts .pdf files. Use the Drag & Drop zone below for DOCX, DOC, TXT, RTF, or ODT resumes.',
      });
      return;
    }
    setQuickPdfUploading(true);
    try {
      const form = new FormData();
      form.append('resume', file);
      form.append('publishNow', 'true');
      const res = await adminFetch('/api/admin/resumes/upload', {
        method: 'POST',
        body: form,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Resume upload failed.');
      setStagedResume(null);
      setToast({
        type: 'success',
        message: `Uploaded ${body.fileName} (v${body.versionNumber}) and activated it on the public portfolio.`,
      });
      await loadResumes();
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Resume upload failed.',
      });
    } finally {
      setQuickPdfUploading(false);
    }
  };

  // Drag-and-drop & multi-format staged upload with XHR progress tracking
  const uploadWithProgress = async (file: File, publishNow: boolean): Promise<ResumeSummaryData> => {
    const token = await getToken();
    const form = new FormData();
    form.append('resume', file);
    form.append('publishNow', publishNow ? 'true' : 'false');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/resumes/upload', true);
      xhr.withCredentials = true;
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const pct = Math.min(96, Math.round((event.loaded / event.total) * 100));
          setUploadProgress(pct);
        }
      };

      xhr.onload = () => {
        setUploadProgress(100);
        try {
          const body = JSON.parse(xhr.responseText || '{}');
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(body as ResumeSummaryData);
          } else {
            reject(new Error(body.error || `Upload failed with status ${xhr.status}.`));
          }
        } catch {
          reject(new Error('Unexpected server response during resume upload.'));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error occurred while uploading resume.'));
      };

      xhr.onabort = () => {
        reject(new Error('Resume upload was cancelled.'));
      };

      xhr.send(form);
    });
  };

  const handleDropZoneFile = async (file: File | undefined) => {
    if (!file || dropUploading) return;
    setUploadError(null);

    const ext = getExtension(file.name);
    if (!SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number])) {
      const msg = `Unsupported file format "${ext || 'unknown'}". Supported formats: PDF, DOCX, DOC, TXT, RTF, ODT.`;
      setUploadError(msg);
      setToast({ type: 'error', message: msg });
      return;
    }

    if (file.size === 0) {
      const msg = 'The selected file is empty (0 bytes).';
      setUploadError(msg);
      setToast({ type: 'error', message: msg });
      return;
    }

    if (file.size > MAX_RESUME_BYTES) {
      const msg = 'File exceeds the 10 MB maximum upload limit.';
      setUploadError(msg);
      setToast({ type: 'error', message: msg });
      return;
    }

    const previousStagedId = stagedResume && !stagedResume.isActive ? stagedResume.id : null;

    setDropUploading(true);
    setUploadProgress(5);
    setUploadFileMeta({
      name: file.name,
      size: file.size,
      format: ext.replace('.', '').toUpperCase(),
    });

    try {
      // Stage first (publishNow = false) so previous active resume remains live until published
      const uploaded = await uploadWithProgress(file, false);

      // If replacing a previous unpublished staged file, clean up old staged version cleanly
      if (previousStagedId && previousStagedId !== uploaded.id) {
        await adminFetch(`/api/admin/resumes/${previousStagedId}`, { method: 'DELETE' }).catch(
          () => {}
        );
      }

      setStagedResume(uploaded);
      setToast({
        type: 'success',
        message: `Processed ${uploaded.fileName} (${uploaded.fileFormat || 'FILE'}). Review or click Publish Resume to make it live.`,
      });
      await loadResumes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Resume processing failed.';
      setUploadError(msg);
      setToast({ type: 'error', message: msg });
    } finally {
      setDropUploading(false);
      setTimeout(() => setUploadProgress(0), 600);
    }
  };

  const handleDiscardStaged = async () => {
    if (!stagedResume) return;
    const targetId = stagedResume.id;
    setBusyId(targetId);
    try {
      const res = await adminFetch(`/api/admin/resumes/${targetId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove staged resume.');
      setStagedResume(null);
      setUploadFileMeta(null);
      setUploadError(null);
      setToast({ type: 'success', message: 'Removed staged resume before publishing.' });
      await loadResumes();
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to remove staged resume.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleActivate = async (item: ResumeSummaryData) => {
    setBusyId(item.id);
    try {
      const res = await adminFetch(`/api/admin/resumes/${item.id}/activate`, { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to publish resume.');
      if (stagedResume?.id === item.id) {
        setStagedResume(null);
        setUploadFileMeta(null);
      }
      setToast({
        type: 'success',
        message: `Resume v${item.versionNumber} (${item.fileName}) is now published on your portfolio.`,
      });
      await loadResumes();
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Publication failed.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handlePreview = async (item: ResumeSummaryData) => {
    const fmt = (item.fileFormat || (getExtension(item.fileName).replace('.', '') || 'PDF')).toUpperCase();
    setPreviewLoading(true);
    setPreviewTitle(`v${item.versionNumber} — ${item.fileName}`);

    try {
      if (fmt === 'PDF') {
        const res = await adminFetch(`/api/admin/resumes/${item.id}/file`);
        if (!res.ok) throw new Error('Unable to load PDF preview.');
        const blob = await res.blob();
        if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
        const url = URL.createObjectURL(blob);
        setPreviewDoc(null);
        setPreviewPdfUrl(url);
      } else {
        const res = await adminFetch(`/api/admin/resumes/${item.id}/preview`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Unable to generate document preview.');
        if (previewPdfUrl) {
          URL.revokeObjectURL(previewPdfUrl);
          setPreviewPdfUrl(null);
        }
        setPreviewTab(body.previewType === 'text' ? 'text' : 'formatted');
        setPreviewDoc(body as ResumePreviewData);
      }
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to preview resume.',
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl(null);
    }
    setPreviewDoc(null);
  };

  const handleDownloadExact = async (item: ResumeSummaryData) => {
    try {
      const res = await adminFetch(`/api/admin/resumes/${item.id}/file?download=1`);
      if (!res.ok) throw new Error('Download failed.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Download failed.',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    try {
      const res = await adminFetch(`/api/admin/resumes/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete resume version.');
      if (stagedResume?.id === deleteTarget.id) {
        setStagedResume(null);
      }
      setToast({ type: 'success', message: `Deleted ${deleteTarget.fileName}.` });
      setDeleteTarget(null);
      await loadResumes();
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Delete failed.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleDropZoneFile(file);
    }
  };

  const activeResume = resumes.find((r) => r.isActive) || null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Resume Manager"
        subtitle="Drag & drop or upload PDF, Word, Text, RTF, or OpenDocument resumes, preview extracted contents, and publish to your live portfolio."
        actions={
          <label className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:brightness-110 px-4 py-2 text-xs font-semibold text-white cursor-pointer transition-all">
            <Upload className="w-3.5 h-3.5" />
            <span>{quickPdfUploading ? 'Uploading PDF...' : 'Upload New PDF Resume'}</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              disabled={quickPdfUploading || dropUploading}
              onChange={(e) => {
                handleQuickPdfUpload(e.target.files?.[0]);
                e.target.value = '';
              }}
              className="hidden"
            />
          </label>
        }
      />

      {loading ? (
        <AdminSkeleton rows={4} />
      ) : (
        <>
          {/* Currently Published Resume Spotlight */}
          <AdminCard className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/40 flex items-center justify-center text-[#3B82F6] shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#3B82F6]">
                      Currently Published Resume
                    </span>
                    {activeResume && (
                      <>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[11px] font-medium text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          Active v{activeResume.versionNumber}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md border font-mono text-[10px] font-semibold uppercase ${getFormatBadgeStyle(
                            activeResume.fileFormat
                          )}`}
                        >
                          {activeResume.fileFormat || 'PDF'}
                        </span>
                      </>
                    )}
                  </div>
                  {activeResume ? (
                    <>
                      <h2 className="mt-1 text-base font-semibold text-[#F8FAFC]">
                        {activeResume.fileName}
                      </h2>
                      <p className="mt-1 text-xs text-[#94A3B8]">
                        {formatBytes(activeResume.fileSizeBytes)} · Uploaded{' '}
                        {formatDateTime(activeResume.createdAt)} ·{' '}
                        <span className="font-mono text-slate-300">
                          {activeResume.downloadCount || 0} confirmed downloads
                        </span>
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-amber-300">
                      No active resume is currently published. Public download buttons are hidden until you upload or activate a resume.
                    </p>
                  )}
                </div>
              </div>

              {activeResume && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={previewLoading}
                    onClick={() => handlePreview(activeResume)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-[#172033] hover:border-[#3B82F6] px-3.5 py-2 text-xs font-medium text-[#F8FAFC] transition-colors disabled:opacity-60"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>Preview {activeResume.fileFormat || 'PDF'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadExact(activeResume)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-[#172033] hover:border-emerald-500 px-3.5 py-2 text-xs font-medium text-[#F8FAFC] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Exact File</span>
                  </button>
                </div>
              )}
            </div>
          </AdminCard>

          {/* Drag-and-Drop Multi-Format Resume Uploader & Staged Review */}
          <AdminCard className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[#F8FAFC]">
                  Drag & Drop Resume Upload
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Upload any supported resume format. Your currently published resume stays live until you confirm publication.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(['PDF', 'DOCX', 'DOC', 'TXT', 'RTF', 'ODT'] as const).map((fmt) => (
                  <span
                    key={fmt}
                    className={`px-2 py-0.5 rounded-md border font-mono text-[10px] font-semibold ${getFormatBadgeStyle(
                      fmt
                    )}`}
                  >
                    .{fmt.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>

            <div
              role="button"
              tabIndex={0}
              aria-label="Drag and drop resume file or click to browse"
              onClick={() => {
                if (!dropUploading) dropInputRef.current?.click();
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !dropUploading) {
                  e.preventDefault();
                  dropInputRef.current?.click();
                }
              }}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all cursor-pointer select-none ${
                isDragging
                  ? 'border-[#8B5CF6] bg-[#3B82F6]/10 shadow-[0_0_32px_rgba(139,92,246,0.22)] scale-[1.005]'
                  : dropUploading
                  ? 'border-[#3B82F6]/60 bg-[#0D1220] cursor-wait'
                  : 'border-slate-700/80 bg-[#0D1220]/70 hover:border-[#3B82F6]/70 hover:bg-[#0D1220]'
              }`}
            >
              <input
                ref={dropInputRef}
                type="file"
                accept={ACCEPT_ATTR}
                disabled={dropUploading}
                onChange={(e) => {
                  handleDropZoneFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
                className="hidden"
              />

              <div className="mx-auto flex flex-col items-center max-w-md">
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 transition-colors ${
                    isDragging
                      ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/60 text-[#C4B5FD]'
                      : 'bg-[#172033] border-slate-700 text-[#3B82F6]'
                  }`}
                >
                  {dropUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <UploadCloud className="w-6 h-6" />
                  )}
                </div>

                {dropUploading && uploadFileMeta ? (
                  <div className="w-full space-y-2.5">
                    <p className="text-sm font-medium text-[#F8FAFC]">
                      {uploadProgress < 96
                        ? `Uploading ${uploadFileMeta.name}...`
                        : `Validating & Extracting ${uploadFileMeta.format} content...`}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-[#94A3B8]">
                      <span className="font-mono">{uploadFileMeta.format}</span>
                      <span>·</span>
                      <span>{formatBytes(uploadFileMeta.size)}</span>
                      <span>·</span>
                      <span className="font-mono text-[#60A5FA]">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-[#F8FAFC]">
                      {isDragging
                        ? 'Drop your resume file to validate & stage'
                        : 'Drag & drop your resume here, or click to browse'}
                    </p>
                    <p className="mt-1.5 text-xs text-[#94A3B8]">
                      Supports PDF, Word (.docx, .doc), Plain Text (.txt), Rich Text (.rtf), and OpenDocument (.odt) up to 10 MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {uploadError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-100">Upload Validation Failed</p>
                  <p className="mt-0.5 text-red-200/90">{uploadError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadError(null)}
                  className="text-red-300 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Staged Resume Ready to Publish */}
            {stagedResume && (
              <div className="rounded-2xl border border-[#8B5CF6]/45 bg-[#121A2D] p-5 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 flex items-center justify-center text-[#C4B5FD] shrink-0">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#C4B5FD]">
                          Staged Upload — Ready to Publish
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md border font-mono text-[10px] font-semibold uppercase ${getFormatBadgeStyle(
                            stagedResume.fileFormat
                          )}`}
                        >
                          {stagedResume.fileFormat || 'FILE'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          v{stagedResume.versionNumber}
                        </span>
                      </div>
                      <h4 className="mt-1 text-sm font-semibold text-[#F8FAFC] break-all">
                        {stagedResume.fileName}
                      </h4>
                      <p className="mt-0.5 text-xs text-[#94A3B8]">
                        {formatBytes(stagedResume.fileSizeBytes)} · Integrity verified ·{' '}
                        {stagedResume.hasTextPreview
                          ? 'Text & readable preview extracted'
                          : 'Original document verified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={previewLoading}
                      onClick={() => handlePreview(stagedResume)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-[#0D1220] hover:border-[#3B82F6] px-3 py-2 text-xs font-medium text-[#F8FAFC] transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      disabled={dropUploading || busyId === stagedResume.id}
                      onClick={() => dropInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-[#0D1220] hover:border-slate-500 px-3 py-2 text-xs font-medium text-slate-200 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Replace File</span>
                    </button>
                    <button
                      type="button"
                      disabled={busyId === stagedResume.id}
                      onClick={handleDiscardStaged}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-[#0D1220] hover:border-red-500/60 px-3 py-2 text-xs font-medium text-slate-300 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                    <button
                      type="button"
                      disabled={busyId === stagedResume.id}
                      onClick={() => handleActivate(stagedResume)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:brightness-110 px-4 py-2 text-xs font-semibold text-white transition-all disabled:opacity-60"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      <span>
                        {busyId === stagedResume.id ? 'Publishing...' : 'Publish Resume'}
                      </span>
                    </button>
                  </div>
                </div>

                {stagedResume.extractedTextSnippet && (
                  <div className="rounded-xl border border-slate-800 bg-[#080B14]/80 px-4 py-3">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                      Extracted Content Preview
                    </p>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {stagedResume.extractedTextSnippet}
                    </p>
                  </div>
                )}
              </div>
            )}
          </AdminCard>

          {/* Version History Table */}
          <AdminCard className="overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#F8FAFC]">Resume Version History</h3>
              <span className="text-xs text-[#94A3B8] font-mono">
                {resumes.length} version{resumes.length === 1 ? '' : 's'}
              </span>
            </div>

            {resumes.length === 0 ? (
              <div className="p-6">
                <AdminEmptyState
                  icon={<FileText className="w-5 h-5" />}
                  title="No Resumes Uploaded"
                  description="Upload a supported resume document (PDF, DOCX, DOC, TXT, RTF, ODT) to make your resume available for download across your public portfolio."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0D1220] text-[#94A3B8] border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3 font-medium">Version</th>
                      <th className="px-5 py-3 font-medium">Filename</th>
                      <th className="px-5 py-3 font-medium">Format</th>
                      <th className="px-5 py-3 font-medium">Size</th>
                      <th className="px-5 py-3 font-medium">Uploaded</th>
                      <th className="px-5 py-3 font-medium">Downloads</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {resumes.map((r) => {
                      const fmt = (
                        r.fileFormat ||
                        getExtension(r.fileName).replace('.', '') ||
                        'PDF'
                      ).toUpperCase();
                      const isStaged = stagedResume?.id === r.id && !r.isActive;
                      return (
                        <tr key={r.id} className="hover:bg-[#172033]/40 transition-colors">
                          <td className="px-5 py-3.5 font-mono text-[#F8FAFC]">
                            v{r.versionNumber}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-[#F8FAFC]">{r.fileName}</td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md border font-mono text-[10px] font-semibold ${getFormatBadgeStyle(
                                fmt
                              )}`}
                            >
                              {fmt}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-[#94A3B8] tabular-nums">
                            {formatBytes(r.fileSizeBytes)}
                          </td>
                          <td className="px-5 py-3.5 text-[#94A3B8]">
                            {formatDateTime(r.createdAt)}
                          </td>
                          <td className="px-5 py-3.5 text-[#F8FAFC] tabular-nums">
                            {r.downloadCount || 0}
                          </td>
                          <td className="px-5 py-3.5">
                            {r.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[11px] text-emerald-300">
                                Active
                              </span>
                            ) : isStaged ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/40 text-[11px] text-purple-300">
                                Staged
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-400">
                                Archived
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                disabled={previewLoading}
                                onClick={() => handlePreview(r)}
                                title={`Preview ${fmt}`}
                                className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] hover:border-[#3B82F6] text-slate-300 hover:text-white"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadExact(r)}
                                title={`Download ${fmt}`}
                                className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] hover:border-emerald-500 text-slate-300 hover:text-white"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              {!r.isActive && (
                                <button
                                  type="button"
                                  disabled={busyId === r.id}
                                  onClick={() => handleActivate(r)}
                                  className="px-2.5 py-1 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 hover:bg-[#3B82F6]/30 text-[11px] font-medium text-blue-200"
                                >
                                  Publish
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(r)}
                                title="Delete version"
                                className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] hover:border-red-500/60 text-slate-400 hover:text-red-300"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>
        </>
      )}

      {/* Multi-Format Preview Modal (PDF iframe OR Rendered HTML / Plain Text Viewer) */}
      {(previewPdfUrl || previewDoc) && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-4xl h-[85vh] rounded-2xl border border-slate-800 bg-[#111827] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-sm font-semibold text-[#F8FAFC] truncate">
                  {previewTitle}
                </span>
                {previewDoc && (
                  <span
                    className={`px-2 py-0.5 rounded-md border font-mono text-[10px] font-semibold uppercase ${getFormatBadgeStyle(
                      previewDoc.fileFormat
                    )}`}
                  >
                    {previewDoc.fileFormat}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {previewDoc && previewDoc.previewType === 'html' && previewDoc.extractedText && (
                  <div className="inline-flex rounded-lg border border-slate-700 bg-[#0D1220] p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('formatted')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                        previewTab === 'formatted'
                          ? 'bg-[#3B82F6] text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileSpreadsheet className="w-3 h-3" />
                      Document View
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('text')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                        previewTab === 'text'
                          ? 'bg-[#3B82F6] text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileCode2 className="w-3 h-3" />
                      Extracted Text
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={closePreview}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {previewPdfUrl ? (
              <iframe
                src={previewPdfUrl}
                title={previewTitle}
                className="flex-1 w-full bg-white"
              />
            ) : previewDoc ? (
              <div className="flex-1 overflow-y-auto bg-[#080B14] p-6">
                {previewDoc.previewType === 'html' && previewTab === 'formatted' ? (
                  <div className="mx-auto max-w-3xl rounded-xl bg-white text-slate-900 p-8 sm:p-10 shadow-xl">
                    <div
                      className="space-y-3 text-sm leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-950 [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-slate-200 [&_h2]:pb-1 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-800 [&_h3]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_p]:text-slate-700 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_th]:border [&_th]:border-slate-200 [&_th]:p-2 [&_th]:bg-slate-50 [&_a]:text-blue-600 [&_a]:underline"
                      dangerouslySetInnerHTML={{
                        __html:
                          previewDoc.previewHtml ||
                          '<p>No formatted HTML preview available for this file.</p>',
                      }}
                    />
                  </div>
                ) : (
                  <pre className="mx-auto max-w-3xl rounded-xl border border-slate-800 bg-[#0D1220] p-6 text-xs sm:text-sm font-mono text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                    {previewDoc.extractedText ||
                      'No plain text could be extracted from this resume file.'}
                  </pre>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Resume Version?"
        message={
          deleteTarget
            ? `Are you sure you want to permanently delete "${deleteTarget.fileName}" (v${deleteTarget.versionNumber})?${
                deleteTarget.isActive
                  ? ' This is currently your active resume, so public downloads will be unavailable until another resume is published.'
                  : ''
              }`
            : ''
        }
        confirmLabel="Delete Resume"
        danger
        busy={Boolean(busyId)}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
