import React from 'react';
import { Calendar, CheckCircle2, AlertCircle, X } from 'lucide-react';

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | '90d'
  | 'this_month'
  | 'prev_month'
  | 'custom';

export interface DateRangeFilterState {
  range: DateRangePreset;
  from: string;
  to: string;
}

export const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'prev_month', label: 'Previous Month' },
  { value: 'custom', label: 'Custom Range' },
];

export function buildRangeQuery(filter: DateRangeFilterState): string {
  const params = new URLSearchParams();
  params.set('range', filter.range);
  if (filter.range === 'custom' && filter.from && filter.to) {
    params.set('from', filter.from);
    params.set('to', filter.to);
  }
  return params.toString();
}

export const DateRangeSelector: React.FC<{
  value: DateRangeFilterState;
  onChange: (next: DateRangeFilterState) => void;
}> = ({ value, onChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-[#111827] px-3 py-2 text-xs text-[#F8FAFC]">
        <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" />
        <select
          value={value.range}
          onChange={(e) =>
            onChange({ ...value, range: e.target.value as DateRangePreset })
          }
          aria-label="Select analytics date range"
          className="bg-transparent text-xs font-medium text-[#F8FAFC] focus:outline-none cursor-pointer"
        >
          {DATE_RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#111827] text-[#F8FAFC]">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {value.range === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
            aria-label="Start date"
            className="rounded-xl border border-slate-800 bg-[#111827] px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:border-[#3B82F6] focus:outline-none"
          />
          <span className="text-xs text-[#94A3B8]">to</span>
          <input
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
            aria-label="End date"
            className="rounded-xl border border-slate-800 bg-[#111827] px-2.5 py-1.5 text-xs text-[#F8FAFC] focus:border-[#3B82F6] focus:outline-none"
          />
        </div>
      )}
    </div>
  );
};

export const AdminCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div
    className={`rounded-2xl border border-slate-800/90 bg-[#111827] shadow-[0_12px_32px_rgba(0,0,0,0.28)] ${className}`}
  >
    {children}
  </div>
);

export const AdminPageHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800/80">
    <div>
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#F8FAFC]">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-[#94A3B8]">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
  </div>
);

export const AdminSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-14 rounded-xl bg-[#172033]/70 border border-slate-800/70" />
    ))}
  </div>
);

export const AdminEmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="rounded-2xl border border-dashed border-slate-800 bg-[#111827]/70 p-10 text-center flex flex-col items-center justify-center">
    {icon && (
      <div className="w-11 h-11 rounded-xl bg-[#172033] border border-slate-800 flex items-center justify-center text-[#3B82F6] mb-3">
        {icon}
      </div>
    )}
    <h3 className="text-sm font-semibold text-[#F8FAFC]">{title}</h3>
    <p className="mt-1 text-xs sm:text-sm text-[#94A3B8] max-w-md">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const AdminConfirmModal: React.FC<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-[#F8FAFC]">{title}</h3>
        <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">{message}</p>
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-700 bg-[#172033] text-xs font-medium text-[#F8FAFC] hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-medium text-white transition-colors disabled:opacity-50 ${
              danger
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-[#3B82F6] hover:bg-blue-500'
            }`}
          >
            {busy ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export interface AdminToastState {
  type: 'success' | 'error';
  message: string;
}

export const AdminToast: React.FC<{
  toast: AdminToastState | null;
  onClose: () => void;
}> = ({ toast, onClose }) => {
  if (!toast) return null;
  return (
    <div
      role="status"
      className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border px-4 py-3 shadow-2xl flex items-start gap-2.5 text-xs ${
        toast.type === 'success'
          ? 'border-emerald-500/40 bg-[#0D1220]/95 text-emerald-200'
          : 'border-red-500/40 bg-[#0D1220]/95 text-red-200'
      }`}
    >
      {toast.type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
      )}
      <span className="flex-1 leading-relaxed">{toast.message}</span>
      <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const inputClass =
  'w-full rounded-xl border border-slate-800 bg-[#080B14] px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder-slate-500 focus:border-[#3B82F6] focus:outline-none transition-colors';

export const labelClass = 'block text-xs font-medium text-[#94A3B8] mb-1.5';
