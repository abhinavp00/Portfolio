import React, { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  History,
  Mail,
  MessageSquarePlus,
  Phone,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  ENQUIRY_CATEGORIES,
  type EnquiryData,
  type EnquiryStatus,
} from '../../types/portfolio';
import {
  AdminCard,
  AdminConfirmModal,
  AdminEmptyState,
  AdminPageHeader,
  AdminSkeleton,
  AdminToast,
  formatDateTime,
  inputClass,
  type AdminToastState,
} from './AdminShared';

const STATUS_OPTIONS: { value: EnquiryStatus; label: string; badge: string }[] = [
  { value: 'new', label: 'New', badge: 'bg-blue-500/15 text-blue-300 border-blue-500/40' },
  { value: 'unread', label: 'Unread', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/40' },
  { value: 'read', label: 'Read', badge: 'bg-slate-700/60 text-slate-200 border-slate-600' },
  { value: 'in_progress', label: 'In Progress', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40' },
  { value: 'replied', label: 'Replied', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' },
  { value: 'important', label: 'Important', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/40' },
  { value: 'archived', label: 'Archived', badge: 'bg-slate-800 text-slate-400 border-slate-700' },
];

interface HistoryAuditRow {
  id: number;
  enquiryId: number;
  previousStatus: string | null;
  newStatus: string;
  changedByEmail: string;
  createdAt: string;
  enquiryCode: string;
  fullName: string;
  subject: string;
}

export const EnquiriesManager: React.FC<{ initialTab?: 'inbox' | 'history' }> = ({
  initialTab = 'inbox',
}) => {
  const { adminFetch } = useAdminAuth();
  const [tab, setTab] = useState<'inbox' | 'history'>(initialTab);
  const [enquiries, setEnquiries] = useState<EnquiryData[]>([]);
  const [historyRows, setHistoryRows] = useState<HistoryAuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<EnquiryData | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EnquiryData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toast, setToast] = useState<AdminToastState | null>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (search.trim()) params.set('search', search.trim());
      const res = await adminFetch(`/api/admin/enquiries?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load enquiries.');
      setEnquiries(await res.json());
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load enquiries.',
      });
    } finally {
      setLoading(false);
    }
  }, [adminFetch, statusFilter, categoryFilter, search]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/enquiry-history');
      if (!res.ok) throw new Error('Failed to load status history.');
      setHistoryRows(await res.json());
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load history.',
      });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    if (tab === 'inbox') {
      loadInbox();
    } else {
      loadHistory();
    }
  }, [tab, loadInbox, loadHistory]);

  const openDetail = async (item: EnquiryData) => {
    try {
      const res = await adminFetch(`/api/admin/enquiries/${item.id}`);
      if (!res.ok) throw new Error('Failed to load enquiry details.');
      const detail = (await res.json()) as EnquiryData;
      setSelected(detail);
      // Automatically mark 'new' or 'unread' as 'read' when opened
      if (detail.status === 'new' || detail.status === 'unread') {
        const patchRes = await adminFetch(`/api/admin/enquiries/${item.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'read' }),
        });
        if (patchRes.ok) {
          const updated = await patchRes.json();
          setSelected((prev) => (prev ? { ...prev, status: updated.status } : prev));
          setEnquiries((prev) =>
            prev.map((row) => (row.id === item.id ? { ...row, status: updated.status } : row))
          );
        }
      }
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to open enquiry.',
      });
    }
  };

  const updateEnquiry = async (
    id: number,
    patch: { status?: EnquiryStatus; isImportant?: boolean }
  ) => {
    try {
      const res = await adminFetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Failed to update enquiry.');
      const updated = await res.json();
      setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
      if (selected?.id === id) {
        const detailRes = await adminFetch(`/api/admin/enquiries/${id}`);
        if (detailRes.ok) setSelected(await detailRes.json());
      }
      setToast({ type: 'success', message: 'Enquiry updated.' });
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Update failed.',
      });
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !noteInput.trim()) return;
    setSavingNote(true);
    try {
      const res = await adminFetch(`/api/admin/enquiries/${selected.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: noteInput.trim() }),
      });
      if (!res.ok) throw new Error('Failed to save internal note.');
      const createdNote = await res.json();
      setSelected((prev) =>
        prev ? { ...prev, notes: [createdNote, ...(prev.notes || [])] } : prev
      );
      setNoteInput('');
      setToast({ type: 'success', message: 'Internal note added.' });
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to save note.',
      });
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await adminFetch(`/api/admin/enquiries/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete enquiry.');
      setEnquiries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
      setToast({ type: 'success', message: 'Enquiry deleted.' });
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Delete failed.',
      });
    }
  };

  const copyValue = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  const badgeForStatus = (status: string) =>
    STATUS_OPTIONS.find((s) => s.value === status)?.badge ||
    'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Contact Enquiries"
        subtitle="Manage incoming portfolio enquiries, internal notes, and communication statuses."
        actions={
          <div className="inline-flex rounded-xl border border-slate-800 bg-[#111827] p-1">
            <button
              type="button"
              onClick={() => setTab('inbox')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === 'inbox' ? 'bg-[#3B82F6] text-white' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Enquiries Inbox
            </button>
            <button
              type="button"
              onClick={() => setTab('history')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === 'history' ? 'bg-[#3B82F6] text-white' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Status History</span>
            </button>
          </div>
        }
      />

      {tab === 'inbox' ? (
        <>
          <AdminCard className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, subject, or ID..."
                  className={`${inputClass} pl-9`}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className={inputClass}
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
                className={inputClass}
              >
                <option value="all">All Categories</option>
                {ENQUIRY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </AdminCard>

          {loading ? (
            <AdminSkeleton rows={5} />
          ) : enquiries.length === 0 ? (
            <AdminEmptyState
              icon={<Mail className="w-5 h-5" />}
              title="No Enquiries Found"
              description="Submitted enquiries from your public portfolio Contact section will appear here automatically."
            />
          ) : (
            <AdminCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0D1220] text-[#94A3B8] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-medium">ID</th>
                      <th className="px-4 py-3 font-medium">Visitor</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Subject</th>
                      <th className="px-4 py-3 font-medium">Received</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {enquiries.map((item) => (
                      <tr key={item.id} className="hover:bg-[#172033]/40 transition-colors">
                        <td className="px-4 py-3 font-mono text-[11px] text-[#3B82F6]">
                          {item.enquiryCode}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#F8FAFC] flex items-center gap-1.5">
                            {item.isImportant && (
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                            )}
                            <span>{item.fullName}</span>
                          </div>
                          <div className="text-[11px] text-[#94A3B8]">{item.email}</div>
                        </td>
                        <td className="px-4 py-3 text-[#94A3B8]">{item.category}</td>
                        <td className="px-4 py-3 text-[#F8FAFC] max-w-xs truncate">
                          {item.subject}
                        </td>
                        <td className="px-4 py-3 text-[#94A3B8] whitespace-nowrap">
                          {formatDateTime(item.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] capitalize ${badgeForStatus(
                              item.status
                            )}`}
                          >
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openDetail(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-[#0D1220] hover:border-[#3B82F6] text-[11px] text-[#F8FAFC]"
                            >
                              <Eye className="w-3 h-3 text-[#3B82F6]" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              aria-label="Delete enquiry"
                              className="p-1.5 rounded-lg border border-slate-800 bg-[#0D1220] hover:border-red-500/60 text-slate-400 hover:text-red-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminCard>
          )}
        </>
      ) : loading ? (
        <AdminSkeleton rows={5} />
      ) : historyRows.length === 0 ? (
        <AdminEmptyState
          icon={<History className="w-5 h-5" />}
          title="No Enquiry Status Changes Yet"
          description="Status updates and audit logs for portfolio enquiries will appear here."
        />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1220] text-[#94A3B8] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Enquiry</th>
                  <th className="px-4 py-3 font-medium">Visitor</th>
                  <th className="px-4 py-3 font-medium">Previous</th>
                  <th className="px-4 py-3 font-medium">New Status</th>
                  <th className="px-4 py-3 font-medium">Updated By</th>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {historyRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-mono text-[#3B82F6]">{row.enquiryCode}</td>
                    <td className="px-4 py-3 text-[#F8FAFC]">{row.fullName}</td>
                    <td className="px-4 py-3 text-slate-400 capitalize">
                      {row.previousStatus?.replace('_', ' ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] capitalize ${badgeForStatus(
                          row.newStatus
                        )}`}
                      >
                        {row.newStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8]">{row.changedByEmail}</td>
                    <td className="px-4 py-3 text-[#94A3B8]">{formatDateTime(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}

      {/* Enquiry Detail Modal / Drawer */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm"
        >
          <div className="w-full max-w-2xl h-full bg-[#111827] border-l border-slate-800 flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-mono text-[#3B82F6]">{selected.enquiryCode}</p>
                <h2 className="text-base font-semibold text-[#F8FAFC]">{selected.subject}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Visitor Info & Direct Actions */}
              <div className="rounded-xl border border-slate-800 bg-[#0D1220] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#F8FAFC]">{selected.fullName}</p>
                    <p className="text-[#94A3B8]">
                      {selected.category} · {formatDateTime(selected.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateEnquiry(selected.id, { isImportant: !selected.isImportant })
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium ${
                        selected.isImportant
                          ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                          : 'border-slate-700 bg-[#111827] text-slate-300'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>{selected.isImportant ? 'Important' : 'Mark Important'}</span>
                    </button>

                    <select
                      value={selected.status}
                      onChange={(e) =>
                        updateEnquiry(selected.id, { status: e.target.value as EnquiryStatus })
                      }
                      aria-label="Update enquiry status"
                      className="rounded-lg border border-slate-700 bg-[#111827] px-2.5 py-1.5 text-xs text-[#F8FAFC]"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(
                      `Re: ${selected.subject}`
                    )}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3B82F6] hover:bg-blue-500 text-white font-medium"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Reply via Email</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => copyValue('email', selected.email)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-[#111827] text-[#F8FAFC]"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{selected.email}</span>
                  </button>

                  {selected.phone && (
                    <>
                      <a
                        href={`tel:${selected.phone.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-[#111827] text-[#F8FAFC] hover:border-emerald-500"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Call {selected.phone}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyValue('phone', selected.phone)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#111827] text-slate-300"
                      >
                        {copiedField === 'phone' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>Copy Phone</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Message */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                  Complete Message
                </h3>
                <div className="rounded-xl border border-slate-800 bg-[#080B14] p-4 text-sm text-[#F8FAFC] leading-relaxed whitespace-pre-wrap">
                  {selected.message}
                </div>
              </div>

              {/* Tracking Info */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                  Attribution &amp; Device Info
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-xl border border-slate-800 bg-[#0D1220] p-3">
                    <p className="text-[10px] text-slate-500">Source Page</p>
                    <p className="mt-1 font-mono text-[#F8FAFC] truncate">
                      {selected.sourcePage || '/'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-[#0D1220] p-3">
                    <p className="text-[10px] text-slate-500">Device</p>
                    <p className="mt-1 font-mono text-[#F8FAFC] capitalize">
                      {selected.deviceCategory || 'desktop'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-[#0D1220] p-3">
                    <p className="text-[10px] text-slate-500">Campaign</p>
                    <p className="mt-1 font-mono text-[#F8FAFC] truncate">
                      {selected.campaignSource || 'Direct'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-[#0D1220] p-3">
                    <p className="text-[10px] text-slate-500">Referrer</p>
                    <p className="mt-1 font-mono text-[#F8FAFC] truncate">
                      {selected.referrer || 'None'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Private Internal Notes */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                  Private Internal Notes
                </h3>
                <form onSubmit={addNote} className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Add a private admin follow-up note..."
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    disabled={savingNote || !noteInput.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-500 text-white font-medium shrink-0 disabled:opacity-50"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                <div className="space-y-2">
                  {(selected.notes || []).length === 0 ? (
                    <p className="text-xs text-slate-500">No internal notes recorded yet.</p>
                  ) : (
                    (selected.notes || []).map((n) => (
                      <div
                        key={n.id}
                        className="rounded-xl border border-slate-800 bg-[#0D1220] p-3"
                      >
                        <p className="text-xs text-[#F8FAFC]">{n.note}</p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {n.authorEmail} · {formatDateTime(n.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Status Audit Log */}
              {(selected.statusHistory || []).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                    Status Audit History
                  </h3>
                  <div className="space-y-1.5">
                    {(selected.statusHistory || []).map((h) => (
                      <div
                        key={h.id}
                        className="text-[11px] text-[#94A3B8] flex items-center justify-between border-b border-slate-800/60 py-1.5"
                      >
                        <span>
                          {h.previousStatus || 'initial'} →{' '}
                          <strong className="text-[#F8FAFC]">{h.newStatus}</strong> by{' '}
                          {h.changedByEmail}
                        </span>
                        <span className="text-slate-500">{formatDateTime(h.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Enquiry?"
        message={
          deleteTarget
            ? `Permanently delete enquiry ${deleteTarget.enquiryCode} from ${deleteTarget.fullName}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete Enquiry"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
