import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  FolderKanban,
  Plus,
  Save,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import type { ExperienceData, ProjectData } from '../../types/portfolio';
import {
  AdminCard,
  AdminConfirmModal,
  AdminEmptyState,
  AdminPageHeader,
  AdminSkeleton,
  AdminToast,
  inputClass,
  labelClass,
  type AdminToastState,
} from './AdminShared';

export const ExperienceManager: React.FC = () => {
  const { adminFetch } = useAdminAuth();
  const [items, setItems] = useState<ExperienceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<ExperienceData> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExperienceData | null>(null);
  const [toast, setToast] = useState<AdminToastState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/experience');
      if (!res.ok) throw new Error('Failed to load experience entries.');
      setItems(await res.json());
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load experience entries.',
      });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing({
      companyName: '',
      jobTitle: '',
      location: 'Kerala, India',
      employmentType: 'Internship',
      startDate: '',
      endDate: '',
      periodLabel: '',
      isCurrent: false,
      responsibilities: [],
      achievements: [],
      technologies: [],
      companyLogoUrl: '',
      isPublished: true,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const isEdit = Boolean(editing.id);
      const res = await adminFetch(
        isEdit ? `/api/admin/experience/${editing.id}` : '/api/admin/experience',
        {
          method: isEdit ? 'PUT' : 'POST',
          body: JSON.stringify(editing),
        }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to save experience.');
      setEditing(null);
      setToast({ type: 'success', message: 'Experience entry saved.' });
      await load();
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Save failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (item: ExperienceData) => {
    try {
      const res = await adminFetch(`/api/admin/experience/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished: !item.isPublished }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: 'error', message: body.error || 'Failed to update publish state.' });
        return;
      }
      await load();
    } catch {
      setToast({ type: 'error', message: 'Network error updating experience entry.' });
    }
  };

  const moveItem = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const prev = items;
    const next = [...items];
    const [removed] = next.splice(idx, 1);
    next.splice(target, 0, removed);
    setItems(next);
    try {
      const res = await adminFetch('/api/admin/experience/reorder', {
        method: 'POST',
        body: JSON.stringify({ ids: next.map((x) => x.id) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setItems(prev);
        setToast({ type: 'error', message: body.error || 'Failed to reorder experience.' });
        return;
      }
      await load();
    } catch {
      setItems(prev);
      setToast({ type: 'error', message: 'Network error while reordering.' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await adminFetch(`/api/admin/experience/${deleteTarget.id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: 'error', message: body.error || 'Failed to delete experience entry.' });
        return;
      }
      setDeleteTarget(null);
      setToast({ type: 'success', message: 'Experience entry deleted.' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Network error deleting experience entry.' });
    }
  };

  const uploadLogo = async (file: File | undefined) => {
    if (!file || !editing) return;
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('assetType', 'company_logo');
      const res = await adminFetch('/api/admin/media/upload', { method: 'POST', body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: 'error', message: body.error || 'Logo upload failed.' });
        return;
      }
      setEditing({ ...editing, companyLogoUrl: body.url });
      setToast({ type: 'success', message: 'Company logo uploaded.' });
    } catch {
      setToast({ type: 'error', message: 'Network error uploading logo.' });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Experience Manager"
        subtitle="Add, edit, reorder, or unpublish roles displayed in your Professional Experience section."
        actions={
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Experience</span>
          </button>
        }
      />

      {loading ? (
        <AdminSkeleton rows={4} />
      ) : items.length === 0 ? (
        <AdminEmptyState
          icon={<Briefcase className="w-5 h-5" />}
          title="No Experience Entries"
          description="Add your internships or work roles to display them on your portfolio."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <AdminCard key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-[#3B82F6]">{item.indexLabel}</span>
                  <h3 className="text-sm font-semibold text-[#F8FAFC]">{item.jobTitle}</h3>
                  <span className="text-xs text-[#94A3B8]">· {item.companyName}</span>
                  {!item.isPublished && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#94A3B8]">
                  {item.periodLabel || 'Flexible'} · {item.employmentType} ·{' '}
                  {item.responsibilities.length} responsibilities
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => moveItem(idx, -1)}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] text-slate-400 hover:text-white disabled:opacity-30"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(idx, 1)}
                  disabled={idx === items.length - 1}
                  className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] text-slate-400 hover:text-white disabled:opacity-30"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => togglePublish(item)}
                  title={item.isPublished ? 'Unpublish' : 'Publish'}
                  className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] text-slate-300 hover:border-[#3B82F6]"
                >
                  {item.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#0D1220] hover:border-[#3B82F6] text-xs text-[#F8FAFC]"
                >
                  <Edit3 className="w-3 h-3 text-[#3B82F6]" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(item)}
                  className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] text-slate-400 hover:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* Experience Modal */}
      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-800 bg-[#111827] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#F8FAFC]">
                {editing.id ? 'Edit Experience' : 'Add New Experience'}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Company Name *</label>
                  <input
                    type="text"
                    required
                    value={editing.companyName || ''}
                    onChange={(e) => setEditing({ ...editing, companyName: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Job Title / Role *</label>
                  <input
                    type="text"
                    required
                    value={editing.jobTitle || ''}
                    onChange={(e) => setEditing({ ...editing, jobTitle: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <input
                    type="text"
                    value={editing.location || ''}
                    onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Employment Type</label>
                  <input
                    type="text"
                    value={editing.employmentType || ''}
                    onChange={(e) => setEditing({ ...editing, employmentType: e.target.value })}
                    placeholder="Internship / Full-time / Contract"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Display Period Label</label>
                  <input
                    type="text"
                    value={editing.periodLabel || ''}
                    onChange={(e) => setEditing({ ...editing, periodLabel: e.target.value })}
                    placeholder="e.g. Jan 2025 – Present"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Company Logo (Optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editing.companyLogoUrl || ''}
                      onChange={(e) => setEditing({ ...editing, companyLogoUrl: e.target.value })}
                      className={inputClass}
                    />
                    <label className="px-3 py-2 rounded-xl border border-slate-700 bg-[#172033] text-xs text-[#F8FAFC] cursor-pointer flex items-center">
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          uploadLogo(e.target.files?.[0]);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Responsibilities (one per line)</label>
                <textarea
                  rows={4}
                  value={(editing.responsibilities || []).join('\n')}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      responsibilities: e.target.value.split('\n').filter((x) => x.trim() !== ''),
                    })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Technologies Used (comma-separated)</label>
                <input
                  type="text"
                  value={(editing.technologies || []).join(', ')}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      technologies: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2 text-xs text-[#F8FAFC]">
                  <input
                    type="checkbox"
                    checked={Boolean(editing.isCurrent)}
                    onChange={(e) => setEditing({ ...editing, isCurrent: e.target.checked })}
                    className="accent-[#3B82F6]"
                  />
                  <span>Currently Working Here</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-[#F8FAFC]">
                  <input
                    type="checkbox"
                    checked={editing.isPublished !== false}
                    onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })}
                    className="accent-[#3B82F6]"
                  />
                  <span>Published</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-[#172033] text-xs text-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-500 text-xs font-semibold text-white"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Experience'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Experience Entry?"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.jobTitle} at ${deleteTarget.companyName}"?`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export const ProjectsManager: React.FC = () => {
  const { adminFetch } = useAdminAuth();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<ProjectData> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectData | null>(null);
  const [toast, setToast] = useState<AdminToastState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/projects');
      if (!res.ok) throw new Error('Failed to load projects.');
      setProjects(await res.json());
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load projects.',
      });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing({
      title: '',
      fullTitle: '',
      category: 'Python Full Stack',
      completed: '',
      description: '',
      stack: [],
      githubUrl: '',
      liveDemoUrl: '',
      imageUrl: '',
      imageAlt: '',
      contributions: [],
      achievements: [],
      previewType: 'standard',
      isFeatured: false,
      isPublished: true,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const isEdit = Boolean(editing.id);
      const res = await adminFetch(
        isEdit ? `/api/admin/projects/${editing.id}` : '/api/admin/projects',
        {
          method: isEdit ? 'PUT' : 'POST',
          body: JSON.stringify(editing),
        }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to save project.');
      setEditing(null);
      setToast({ type: 'success', message: 'Project saved and synchronized.' });
      await load();
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Save failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  const duplicateProject = async (proj: ProjectData) => {
    try {
      const res = await adminFetch(`/api/admin/projects/${proj.id}/duplicate`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: 'error', message: body.error || 'Failed to duplicate project.' });
        return;
      }
      setToast({ type: 'success', message: `Duplicated "${proj.title}" as draft.` });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Network error duplicating project.' });
    }
  };

  const toggleFlag = async (
    proj: ProjectData,
    patch: { isPublished?: boolean; isFeatured?: boolean }
  ) => {
    try {
      const res = await adminFetch(`/api/admin/projects/${proj.id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setToast({ type: 'error', message: body.error || 'Failed to update project.' });
        return;
      }
      await load();
    } catch {
      setToast({ type: 'error', message: 'Network error updating project.' });
    }
  };

  const moveItem = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= projects.length) return;
    const prev = projects;
    const next = [...projects];
    const [removed] = next.splice(idx, 1);
    next.splice(target, 0, removed);
    setProjects(next);
    try {
      const res = await adminFetch('/api/admin/projects/reorder', {
        method: 'POST',
        body: JSON.stringify({ ids: next.map((p) => p.id) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setProjects(prev);
        setToast({ type: 'error', message: body.error || 'Failed to reorder projects.' });
        return;
      }
      await load();
    } catch {
      setProjects(prev);
      setToast({ type: 'error', message: 'Network error reordering projects.' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await adminFetch(`/api/admin/projects/${deleteTarget.id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: 'error', message: body.error || 'Failed to delete project.' });
        return;
      }
      setDeleteTarget(null);
      setToast({ type: 'success', message: 'Project deleted.' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Network error deleting project.' });
    }
  };

  const uploadProjectImage = async (file: File | undefined) => {
    if (!file || !editing) return;
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('assetType', 'project');
      const res = await adminFetch('/api/admin/media/upload', { method: 'POST', body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: 'error', message: body.error || 'Image upload failed.' });
        return;
      }
      setEditing({ ...editing, imageUrl: body.url });
      setToast({ type: 'success', message: 'Project cover image uploaded.' });
    } catch {
      setToast({ type: 'error', message: 'Network error uploading project image.' });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Projects Manager"
        subtitle="Manage featured projects, case study breakdowns, tech stacks, GitHub links, and visibility."
        actions={
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>
        }
      />

      {loading ? (
        <AdminSkeleton rows={4} />
      ) : projects.length === 0 ? (
        <AdminEmptyState
          icon={<FolderKanban className="w-5 h-5" />}
          title="No Projects Yet"
          description="Add your featured engineering and analytics projects to showcase them on your portfolio."
        />
      ) : (
        <div className="space-y-3">
          {projects.map((proj, idx) => (
            <AdminCard
              key={proj.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-[#3B82F6]">{proj.numberLabel}</span>
                  <h3 className="text-sm font-semibold text-[#F8FAFC]">{proj.title}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#172033] text-[10px] text-[#94A3B8]">
                    {proj.category}
                  </span>
                  {proj.isFeatured && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-[10px] text-amber-300">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      Featured
                    </span>
                  )}
                  {!proj.isPublished && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#94A3B8] line-clamp-1">{proj.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {proj.stack.slice(0, 6).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded bg-[#0D1220] border border-slate-800 text-[10px] font-mono text-slate-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => moveItem(idx, -1)}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] text-slate-400 hover:text-white disabled:opacity-30"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(idx, 1)}
                  disabled={idx === projects.length - 1}
                  className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] text-slate-400 hover:text-white disabled:opacity-30"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleFlag(proj, { isFeatured: !proj.isFeatured })}
                  title="Toggle Featured"
                  className={`p-1.5 rounded-lg border bg-[#0D1220] ${
                    proj.isFeatured
                      ? 'border-amber-500/40 text-amber-400'
                      : 'border-slate-800 text-slate-400'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleFlag(proj, { isPublished: !proj.isPublished })}
                  title={proj.isPublished ? 'Unpublish' : 'Publish'}
                  className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] text-slate-300 hover:border-[#3B82F6]"
                >
                  {proj.isPublished ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => duplicateProject(proj)}
                  title="Duplicate project"
                  className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] text-slate-300 hover:border-[#3B82F6]"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(proj)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#0D1220] hover:border-[#3B82F6] text-xs text-[#F8FAFC]"
                >
                  <Edit3 className="w-3 h-3 text-[#3B82F6]" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(proj)}
                  className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] text-slate-400 hover:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {/* Project Modal */}
      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-800 bg-[#111827] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#F8FAFC]">
                {editing.id ? `Edit Project: ${editing.title}` : 'Add New Project'}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Short Title *</label>
                  <input
                    type="text"
                    required
                    value={editing.title || ''}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Full Title</label>
                  <input
                    type="text"
                    value={editing.fullTitle || ''}
                    onChange={(e) => setEditing({ ...editing, fullTitle: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <input
                    type="text"
                    value={editing.category || ''}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Completion Period / Status</label>
                  <input
                    type="text"
                    value={editing.completed || ''}
                    onChange={(e) => setEditing({ ...editing, completed: e.target.value })}
                    placeholder="e.g. Completed — 2025"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>GitHub Repository URL</label>
                  <input
                    type="url"
                    value={editing.githubUrl || ''}
                    onChange={(e) => setEditing({ ...editing, githubUrl: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Live Demo URL</label>
                  <input
                    type="url"
                    value={editing.liveDemoUrl || ''}
                    onChange={(e) => setEditing({ ...editing, liveDemoUrl: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Project Description *</label>
                <textarea
                  rows={3}
                  required
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Technology Stack (comma-separated)</label>
                <input
                  type="text"
                  value={(editing.stack || []).join(', ')}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      stack: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Project Cover Image (URL or Upload)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editing.imageUrl || ''}
                    onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
                    className={inputClass}
                  />
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 bg-[#172033] text-xs text-[#F8FAFC] cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        uploadProjectImage(e.target.files?.[0]);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className={labelClass}>Key Engineering Contributions (one per line)</label>
                <textarea
                  rows={4}
                  value={(editing.contributions || []).join('\n')}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      contributions: e.target.value.split('\n').filter((x) => x.trim() !== ''),
                    })
                  }
                  className={inputClass}
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2 text-xs text-[#F8FAFC]">
                  <input
                    type="checkbox"
                    checked={Boolean(editing.isFeatured)}
                    onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })}
                    className="accent-[#3B82F6]"
                  />
                  <span>Featured Project</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-[#F8FAFC]">
                  <input
                    type="checkbox"
                    checked={editing.isPublished !== false}
                    onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })}
                    className="accent-[#3B82F6]"
                  />
                  <span>Published</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-[#172033] text-xs text-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-500 text-xs font-semibold text-white"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Project?"
        message={deleteTarget ? `Permanently delete "${deleteTarget.title}"?` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
