import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Award,
  Code2,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import type {
  CertificationData,
  EducationData,
  ServiceData,
  SkillCategoryData,
  SkillItemData,
} from '../../types/portfolio';
import {
  AdminCard,
  AdminConfirmModal,
  AdminPageHeader,
  AdminSkeleton,
  AdminToast,
  inputClass,
  labelClass,
  type AdminToastState,
} from './AdminShared';

export const SkillsManager: React.FC = () => {
  const { adminFetch } = useAdminAuth();
  const [categories, setCategories] = useState<SkillCategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCat, setEditingCat] = useState<Partial<SkillCategoryData> | null>(null);
  const [editingSkill, setEditingSkill] = useState<Partial<SkillItemData> | null>(null);
  const [toast, setToast] = useState<AdminToastState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/skill-categories');
      if (!res.ok) throw new Error('Failed to load skills.');
      setCategories(await res.json());
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load skills.',
      });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;
    try {
      const isEdit = Boolean(editingCat.id);
      const res = await adminFetch(
        isEdit ? `/api/admin/skill-categories/${editingCat.id}` : '/api/admin/skill-categories',
        { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(editingCat) }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: 'error', message: body.error || 'Failed to save category.' });
        return;
      }
      setEditingCat(null);
      setToast({ type: 'success', message: 'Skill category saved.' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Network error saving category.' });
    }
  };

  const saveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill) return;
    try {
      const isEdit = Boolean(editingSkill.id);
      const res = await adminFetch(
        isEdit ? `/api/admin/skills/${editingSkill.id}` : '/api/admin/skills',
        { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(editingSkill) }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: 'error', message: body.error || 'Failed to save skill.' });
        return;
      }
      setEditingSkill(null);
      setToast({ type: 'success', message: 'Skill saved.' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Network error saving skill.' });
    }
  };

  const toggleSkill = async (skill: SkillItemData) => {
    try {
      const res = await adminFetch(`/api/admin/skills/${skill.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isEnabled: !skill.isEnabled }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setToast({ type: 'error', message: body.error || 'Failed to toggle skill.' });
        return;
      }
      await load();
    } catch {
      setToast({ type: 'error', message: 'Network error updating skill.' });
    }
  };

  const deleteSkill = async (id: number) => {
    try {
      const res = await adminFetch(`/api/admin/skills/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setToast({ type: 'error', message: body.error || 'Failed to delete skill.' });
        return;
      }
      setToast({ type: 'success', message: 'Skill deleted.' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Network error deleting skill.' });
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      const res = await adminFetch(`/api/admin/skill-categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setToast({ type: 'error', message: body.error || 'Failed to delete category.' });
        return;
      }
      setToast({ type: 'success', message: 'Skill category deleted.' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Network error deleting category.' });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Skills & Technologies Manager"
        subtitle="Manage skill categories, individual tools, enable/disable visibility, and ordering."
        actions={
          <button
            type="button"
            onClick={() =>
              setEditingCat({ title: '', description: '', iconKey: 'analytics', isPublished: true })
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        }
      />

      {loading ? (
        <AdminSkeleton rows={4} />
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <AdminCard key={cat.id} className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#3B82F6]" />
                    <span>{cat.title}</span>
                    {!cat.isPublished && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">
                        Hidden
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{cat.description}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingSkill({ categoryId: cat.id, name: '', proficiency: '', isEnabled: true })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-xs text-blue-200"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Skill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCat(cat)}
                    className="p-1.5 rounded-lg border border-slate-700 bg-[#0D1220] text-slate-300"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCategory(cat.id)}
                    className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] text-slate-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {cat.skills.map((skill) => (
                  <div
                    key={skill.id}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs ${
                      skill.isEnabled
                        ? 'border-slate-700 bg-[#0D1220] text-[#F8FAFC]'
                        : 'border-slate-800 bg-[#080B14] text-slate-500 line-through'
                    }`}
                  >
                    <span>{skill.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      title={skill.isEnabled ? 'Disable' : 'Enable'}
                      className="text-slate-400 hover:text-[#3B82F6]"
                    >
                      {skill.isEnabled ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSkill(skill)}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSkill(skill.id)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {editingCat && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#111827] p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#F8FAFC]">
                {editingCat.id ? 'Edit Category' : 'Add Skill Category'}
              </h3>
              <button type="button" onClick={() => setEditingCat(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={saveCategory} className="space-y-3">
              <div>
                <label className={labelClass}>Category Title *</label>
                <input
                  type="text"
                  required
                  value={editingCat.title || ''}
                  onChange={(e) => setEditingCat({ ...editingCat, title: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <input
                  type="text"
                  value={editingCat.description || ''}
                  onChange={(e) => setEditingCat({ ...editingCat, description: e.target.value })}
                  className={inputClass}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-[#F8FAFC]">
                <input
                  type="checkbox"
                  checked={editingCat.isPublished !== false}
                  onChange={(e) => setEditingCat({ ...editingCat, isPublished: e.target.checked })}
                  className="accent-[#3B82F6]"
                />
                <span>Published</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingCat(null)} className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#3B82F6] text-xs font-semibold text-white">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingSkill && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#111827] p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#F8FAFC]">
                {editingSkill.id ? 'Edit Skill' : 'Add Skill'}
              </h3>
              <button type="button" onClick={() => setEditingSkill(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={saveSkill} className="space-y-3">
              <div>
                <label className={labelClass}>Skill / Technology Name *</label>
                <input
                  type="text"
                  required
                  value={editingSkill.name || ''}
                  onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Proficiency Label (Optional)</label>
                <input
                  type="text"
                  value={editingSkill.proficiency || ''}
                  onChange={(e) => setEditingSkill({ ...editingSkill, proficiency: e.target.value })}
                  placeholder="e.g. Advanced"
                  className={inputClass}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-[#F8FAFC]">
                <input
                  type="checkbox"
                  checked={editingSkill.isEnabled !== false}
                  onChange={(e) => setEditingSkill({ ...editingSkill, isEnabled: e.target.checked })}
                  className="accent-[#3B82F6]"
                />
                <span>Enabled on Portfolio</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingSkill(null)} className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#3B82F6] text-xs font-semibold text-white">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export const ServicesManager: React.FC = () => {
  const { adminFetch } = useAdminAuth();
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<ServiceData> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceData | null>(null);
  const [toast, setToast] = useState<AdminToastState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/services');
      if (!res.ok) throw new Error('Failed to load services.');
      setServices(await res.json());
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load services.',
      });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const isEdit = Boolean(editing.id);
      const res = await adminFetch(
        isEdit ? `/api/admin/services/${editing.id}` : '/api/admin/services',
        { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(editing) }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: 'error', message: body.error || 'Failed to save service.' });
        return;
      }
      setEditing(null);
      setToast({ type: 'success', message: 'Service saved.' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Network error saving service.' });
    }
  };

  const moveItem = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= services.length) return;
    const prev = services;
    const next = [...services];
    const [removed] = next.splice(idx, 1);
    next.splice(target, 0, removed);
    setServices(next);
    try {
      const res = await adminFetch('/api/admin/services/reorder', {
        method: 'POST',
        body: JSON.stringify({ ids: next.map((x) => x.id) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setServices(prev);
        setToast({ type: 'error', message: body.error || 'Failed to reorder services.' });
        return;
      }
      await load();
    } catch {
      setServices(prev);
      setToast({ type: 'error', message: 'Network error reordering services.' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await adminFetch(`/api/admin/services/${deleteTarget.id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: 'error', message: body.error || 'Failed to delete service.' });
        return;
      }
      setDeleteTarget(null);
      setToast({ type: 'success', message: 'Service deleted.' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Network error deleting service.' });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Services Manager"
        subtitle="Manage offered engineering and analytics services."
        actions={
          <button
            type="button"
            onClick={() =>
              setEditing({
                title: '',
                description: '',
                iconName: 'barChart',
                technologies: [],
                isPublished: true,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Service</span>
          </button>
        }
      />

      {loading ? (
        <AdminSkeleton rows={4} />
      ) : (
        <div className="space-y-3">
          {services.map((srv, idx) => (
            <AdminCard key={srv.id} className="p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                  <h3 className="text-sm font-semibold text-[#F8FAFC]">{srv.title}</h3>
                  {!srv.isPublished && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#94A3B8] mt-1 line-clamp-1">{srv.description}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => moveItem(idx, -1)}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] text-slate-400 disabled:opacity-30"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(idx, 1)}
                  disabled={idx === services.length - 1}
                  className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] text-slate-400 disabled:opacity-30"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(srv)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#0D1220] text-xs text-[#F8FAFC]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(srv)}
                  className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] text-slate-400 hover:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {editing && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#111827] p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#F8FAFC]">
                {editing.id ? 'Edit Service' : 'Add Service'}
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className={labelClass}>Service Title *</label>
                <input
                  type="text"
                  required
                  value={editing.title || ''}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Description *</label>
                <textarea
                  rows={3}
                  required
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Icon Style</label>
                <select
                  value={editing.iconName || 'barChart'}
                  onChange={(e) => setEditing({ ...editing, iconName: e.target.value })}
                  className={inputClass}
                >
                  <option value="barChart">Data &amp; Analytics</option>
                  <option value="server">Backend / API</option>
                  <option value="layers">Full Stack Web</option>
                  <option value="bot">AI &amp; Agentic</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Technologies (comma-separated)</label>
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
              <label className="inline-flex items-center gap-2 text-xs text-[#F8FAFC]">
                <input
                  type="checkbox"
                  checked={editing.isPublished !== false}
                  onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })}
                  className="accent-[#3B82F6]"
                />
                <span>Published</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#3B82F6] text-xs font-semibold text-white">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Service?"
        message={deleteTarget ? `Delete "${deleteTarget.title}"?` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export const EducationManager: React.FC = () => {
  const { adminFetch } = useAdminAuth();
  const [rows, setRows] = useState<EducationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<EducationData> | null>(null);
  const [toast, setToast] = useState<AdminToastState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/education');
      if (!res.ok) throw new Error('Failed to load education records.');
      setRows(await res.json());
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load education records.',
      });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const isEdit = Boolean(editing.id);
      const res = await adminFetch(
        isEdit ? `/api/admin/education/${editing.id}` : '/api/admin/education',
        { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(editing) }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: 'error', message: body.error || 'Failed to save education record.' });
        return;
      }
      setEditing(null);
      setToast({ type: 'success', message: 'Education record saved.' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Network error saving education record.' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await adminFetch(`/api/admin/education/${id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: 'error', message: body.error || 'Failed to delete education record.' });
        return;
      }
      setToast({ type: 'success', message: 'Education record deleted.' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Network error deleting education record.' });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Education Manager"
        subtitle="Manage degrees, institutions, universities, and academic performance."
        actions={
          <button
            type="button"
            onClick={() =>
              setEditing({
                qualification: '',
                institution: '',
                university: '',
                performance: '',
                periodLabel: '',
                isPublished: true,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Education</span>
          </button>
        }
      />

      {loading ? (
        <AdminSkeleton rows={3} />
      ) : (
        <div className="space-y-3">
          {rows.map((edu) => (
            <AdminCard key={edu.id} className="p-5 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#3B82F6]" />
                  <h3 className="text-sm font-semibold text-[#F8FAFC]">{edu.qualification}</h3>
                </div>
                <p className="text-xs text-[#94A3B8] mt-1">
                  {edu.institution} {edu.university ? `(${edu.university})` : ''} · {edu.periodLabel}{' '}
                  · {edu.performance}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(edu)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#0D1220] text-xs text-[#F8FAFC]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(edu.id)}
                  className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] text-slate-400 hover:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {editing && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#111827] p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#F8FAFC]">
                {editing.id ? 'Edit Education' : 'Add Education'}
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className={labelClass}>Degree / Qualification *</label>
                <input
                  type="text"
                  required
                  value={editing.qualification || ''}
                  onChange={(e) => setEditing({ ...editing, qualification: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Institution *</label>
                <input
                  type="text"
                  required
                  value={editing.institution || ''}
                  onChange={(e) => setEditing({ ...editing, institution: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>University / Board</label>
                  <input
                    type="text"
                    value={editing.university || ''}
                    onChange={(e) => setEditing({ ...editing, university: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Period Label</label>
                  <input
                    type="text"
                    value={editing.periodLabel || ''}
                    onChange={(e) => setEditing({ ...editing, periodLabel: e.target.value })}
                    placeholder="2022 – 2025"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Percentage / CGPA</label>
                <input
                  type="text"
                  value={editing.performance || ''}
                  onChange={(e) => setEditing({ ...editing, performance: e.target.value })}
                  className={inputClass}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-[#F8FAFC]">
                <input
                  type="checkbox"
                  checked={editing.isPublished !== false}
                  onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })}
                  className="accent-[#3B82F6]"
                />
                <span>Published</span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#3B82F6] text-xs font-semibold text-white">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export const CertificationsManager: React.FC = () => {
  const { adminFetch } = useAdminAuth();
  const [rows, setRows] = useState<CertificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<CertificationData> | null>(null);
  const [toast, setToast] = useState<AdminToastState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/certifications');
      if (!res.ok) throw new Error('Failed to load certifications.');
      setRows(await res.json());
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to load certifications.',
      });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const uploadCertificateAsset = async (
    file: File | undefined,
    kind: 'pdf' | 'image'
  ) => {
    if (!file || !editing) return;
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('assetType', kind === 'pdf' ? 'certificate_pdf' : 'certificate_image');
      const res = await adminFetch('/api/admin/media/upload', { method: 'POST', body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: 'error', message: body.error || 'Upload failed.' });
        return;
      }
      if (kind === 'pdf') {
        setEditing({
          ...editing,
          certificatePdfAssetId: body.id,
          certificatePdfName: body.fileName,
        });
      } else {
        setEditing({
          ...editing,
          certificateImageAssetId: body.id,
          certificateImageUrl: body.url,
        });
      }
      setToast({ type: 'success', message: `Uploaded ${body.fileName}. Save to apply.` });
    } catch {
      setToast({ type: 'error', message: 'Network error uploading file.' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const isEdit = Boolean(editing.id);
      const res = await adminFetch(
        isEdit ? `/api/admin/certifications/${editing.id}` : '/api/admin/certifications',
        { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(editing) }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: 'error', message: body.error || 'Failed to save certification.' });
        return;
      }
      setEditing(null);
      setToast({ type: 'success', message: 'Certification saved.' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Network error saving certification.' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await adminFetch(`/api/admin/certifications/${id}`, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: 'error', message: body.error || 'Failed to delete certification.' });
        return;
      }
      setToast({ type: 'success', message: 'Certification deleted.' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Network error deleting certification.' });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Certifications Manager"
        subtitle="Manage certifications, issuing organizations, credential URLs, and certificate PDFs/images."
        actions={
          <button
            type="button"
            onClick={() =>
              setEditing({
                title: '',
                issuer: '',
                issueDate: '',
                credentialId: '',
                verificationUrl: '',
                isPublished: true,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Certification</span>
          </button>
        }
      />

      {loading ? (
        <AdminSkeleton rows={3} />
      ) : (
        <div className="space-y-3">
          {rows.map((cert) => (
            <AdminCard key={cert.id} className="p-5 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#8B5CF6]" />
                  <h3 className="text-sm font-semibold text-[#F8FAFC]">{cert.title}</h3>
                </div>
                <p className="text-xs text-[#94A3B8] mt-1">
                  {cert.issuer}
                  {cert.issueDate ? ` · ${cert.issueDate}` : ''}
                  {cert.certificatePdfName ? ` · PDF: ${cert.certificatePdfName}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(cert)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#0D1220] text-xs text-[#F8FAFC]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cert.id)}
                  className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] text-slate-400 hover:text-red-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {editing && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#111827] p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#F8FAFC]">
                {editing.id ? 'Edit Certification' : 'Add Certification'}
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className={labelClass}>Certification Title *</label>
                <input
                  type="text"
                  required
                  value={editing.title || ''}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Issuing Organization *</label>
                  <input
                    type="text"
                    required
                    value={editing.issuer || ''}
                    onChange={(e) => setEditing({ ...editing, issuer: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Issue Date</label>
                  <input
                    type="text"
                    value={editing.issueDate || ''}
                    onChange={(e) => setEditing({ ...editing, issueDate: e.target.value })}
                    placeholder="e.g. 2025"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Credential ID</label>
                  <input
                    type="text"
                    value={editing.credentialId || ''}
                    onChange={(e) => setEditing({ ...editing, credentialId: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Verification URL</label>
                  <input
                    type="url"
                    value={editing.verificationUrl || ''}
                    onChange={(e) => setEditing({ ...editing, verificationUrl: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-[#172033] text-xs text-[#F8FAFC] cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>{editing.certificatePdfName ? 'Replace PDF' : 'Upload PDF'}</span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => {
                      uploadCertificateAsset(e.target.files?.[0], 'pdf');
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
                <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-[#172033] text-xs text-[#F8FAFC] cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>{editing.certificateImageUrl ? 'Replace Image' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      uploadCertificateAsset(e.target.files?.[0], 'image');
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-[#F8FAFC]">
                <input
                  type="checkbox"
                  checked={editing.isPublished !== false}
                  onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })}
                  className="accent-[#3B82F6]"
                />
                <span>Published</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300">
                  Cancel
                </button>
                <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B82F6] text-xs font-semibold text-white">
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
