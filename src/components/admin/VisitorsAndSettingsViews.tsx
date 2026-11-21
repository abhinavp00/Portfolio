import React, { useCallback, useEffect, useState } from 'react';
import {
  Clock,
  Globe,
  Monitor,
  Plus,
  Save,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import type { ActivityEventRecord, PortfolioSettingsData } from '../../types/portfolio';
import {
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
  AdminSkeleton,
  AdminToast,
  buildRangeQuery,
  DateRangeSelector,
  formatDateTime,
  formatDuration,
  inputClass,
  labelClass,
  type AdminToastState,
  type DateRangeFilterState,
} from './AdminShared';

interface VisitorSessionRow {
  id: number;
  sessionId: string;
  visitorId: string;
  startedAt: string;
  lastActivityAt: string;
  durationSeconds: number;
  pageViewsCount: number;
  landingPage: string;
  referrer: string;
  deviceCategory: string;
  browserCategory: string;
  osCategory: string;
  country: string;
  region: string;
  city: string;
  isReturning: boolean;
  visitorTotalVisits: number;
}

export const VisitorsView: React.FC = () => {
  const { adminFetch } = useAdminAuth();
  const [filter, setFilter] = useState<DateRangeFilterState>({ range: '30d', from: '', to: '' });
  const [device, setDevice] = useState('all');
  const [country, setCountry] = useState('all');
  const [visitorType, setVisitorType] = useState('all');
  const [sessions, setSessions] = useState<VisitorSessionRow[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<{
    session: VisitorSessionRow;
    timeline: ActivityEventRecord[];
  } | null>(null);

  const loadVisitors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams(buildRangeQuery(filter));
      if (device !== 'all') qs.set('device', device);
      if (country !== 'all') qs.set('country', country);
      if (visitorType !== 'all') qs.set('visitorType', visitorType);
      const res = await adminFetch(`/api/admin/visitors?${qs.toString()}`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Failed to load visitor sessions.');
      }
      const body = await res.json();
      setSessions(body.sessions || []);
      setCountries(body.countries || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load visitor sessions.');
    } finally {
      setLoading(false);
    }
  }, [adminFetch, filter, device, country, visitorType]);

  useEffect(() => {
    loadVisitors();
  }, [loadVisitors]);

  const openSessionTimeline = async (sessionId: string) => {
    try {
      const res = await adminFetch(`/api/admin/visitors/session/${encodeURIComponent(sessionId)}`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setError(errBody.error || 'Failed to load session timeline.');
        return;
      }
      setSelectedSession(await res.json());
    } catch {
      setError('Unable to load session timeline.');
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Visitor Sessions & Timelines"
        subtitle="Inspect anonymized visitor sessions, device metadata, and chronological interaction timelines."
        actions={<DateRangeSelector value={filter} onChange={setFilter} />}
      />

      <AdminCard className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            aria-label="Filter by device"
            className={inputClass}
          >
            <option value="all">All Devices</option>
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
            <option value="mobile">Mobile</option>
          </select>

          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            aria-label="Filter by country"
            className={inputClass}
          >
            <option value="all">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={visitorType}
            onChange={(e) => setVisitorType(e.target.value)}
            aria-label="Filter by visitor type"
            className={inputClass}
          >
            <option value="all">New &amp; Returning Visitors</option>
            <option value="new">New Visitors Only</option>
            <option value="returning">Returning Visitors Only</option>
          </select>
        </div>
      </AdminCard>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <AdminSkeleton rows={5} />
      ) : sessions.length === 0 ? (
        <AdminEmptyState
          icon={<Users className="w-5 h-5" />}
          title="No Visitor Sessions Recorded Yet"
          description="Privacy-respecting session logs will appear here when visitors view your portfolio with analytics enabled."
        />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1220] text-[#94A3B8] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-medium">Visitor ID</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Device / OS</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Views / Duration</th>
                  <th className="px-4 py-3 font-medium">Started</th>
                  <th className="px-4 py-3 font-medium text-right">Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-[#172033]/40">
                    <td className="px-4 py-3 font-mono text-[11px] text-[#3B82F6]">
                      {s.visitorId.slice(0, 14)}...
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] border ${
                          s.isReturning
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                            : 'border-blue-500/40 bg-blue-500/15 text-blue-300'
                        }`}
                      >
                        {s.isReturning ? `Returning (${s.visitorTotalVisits})` : 'New'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#F8FAFC]">
                      <span className="capitalize">{s.deviceCategory}</span> · {s.browserCategory || 'Other'} /{' '}
                      {s.osCategory || 'Other'}
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8]">
                      {[s.city, s.country].filter(Boolean).join(', ') || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-[#F8FAFC] tabular-nums">
                      {s.pageViewsCount} views · {formatDuration(s.durationSeconds)}
                    </td>
                    <td className="px-4 py-3 text-[#94A3B8] whitespace-nowrap">
                      {formatDateTime(s.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openSessionTimeline(s.sessionId)}
                        className="px-2.5 py-1 rounded-lg border border-slate-700 bg-[#0D1220] hover:border-[#3B82F6] text-[11px] text-[#F8FAFC]"
                      >
                        View Timeline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      )}

      {/* Session Timeline Modal */}
      {selectedSession && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-800 bg-[#111827] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono text-[#3B82F6]">
                  {selectedSession.session.sessionId}
                </p>
                <h3 className="text-sm font-semibold text-[#F8FAFC]">
                  Session Activity Timeline ({selectedSession.timeline.length} events)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-800 bg-[#0D1220] p-3">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Device</span>
                  </div>
                  <p className="mt-1 text-[#F8FAFC] capitalize">
                    {selectedSession.session.deviceCategory} ({selectedSession.session.browserCategory || 'Other'})
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#0D1220] p-3">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Coarse Geo</span>
                  </div>
                  <p className="mt-1 text-[#F8FAFC]">
                    {[selectedSession.session.city, selectedSession.session.country]
                      .filter(Boolean)
                      .join(', ') || 'Unknown'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#0D1220] p-3">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Duration</span>
                  </div>
                  <p className="mt-1 text-[#F8FAFC]">
                    {formatDuration(selectedSession.session.durationSeconds)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-l-2 border-[#3B82F6]/40 pl-4 ml-1">
                {selectedSession.timeline.map((evt) => (
                  <div
                    key={evt.id}
                    className="rounded-xl border border-slate-800 bg-[#0D1220] p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-mono font-medium text-[#3B82F6]">{evt.eventName}</p>
                      <p className="text-[#94A3B8]">
                        {evt.projectTitle || evt.sectionName || evt.sourceLabel || evt.pagePath}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-500 whitespace-nowrap">
                      {formatDateTime(evt.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface AdminUserRow {
  id: number;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
}

export const SettingsView: React.FC = () => {
  const { adminFetch, adminProfile } = useAdminAuth();
  const [settings, setSettings] = useState<PortfolioSettingsData | null>(null);
  const [admins, setAdmins] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [toast, setToast] = useState<AdminToastState | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to load settings.');
      const body = await res.json();
      setSettings(body.settings);
      setAdmins(body.adminUsers || []);
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to load settings.',
      });
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to update settings.');
      setSettings(await res.json());
      setToast({ type: 'success', message: 'Portfolio & privacy settings saved.' });
    } catch (err: unknown) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Save failed.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrune = async () => {
    try {
      const res = await adminFetch('/api/admin/settings/prune-analytics', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({
          type: 'error',
          message: body.error || 'Failed to prune analytics records.',
        });
        return;
      }
      setToast({
        type: 'success',
        message: `Pruned analytics older than ${body.retentionDays} days.`,
      });
    } catch {
      setToast({ type: 'error', message: 'Network error while pruning analytics.' });
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    const res = await adminFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email: newEmail.trim(), displayName: newName.trim() }),
    });
    const body = await res.json();
    if (!res.ok) {
      setToast({ type: 'error', message: body.error || 'Failed to add admin.' });
      return;
    }
    setNewEmail('');
    setNewName('');
    setToast({ type: 'success', message: `Authorized ${body.email} as administrator.` });
    loadSettings();
  };

  const toggleAdminActive = async (row: AdminUserRow) => {
    const res = await adminFetch(`/api/admin/users/${row.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    const body = await res.json();
    if (!res.ok) {
      setToast({ type: 'error', message: body.error || 'Unable to update administrator.' });
      return;
    }
    loadSettings();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Settings & Privacy Controls"
        subtitle="Configure portfolio metadata, analytics consent rules, data retention, and authorized administrators."
      />

      {loading || !settings ? (
        <AdminSkeleton rows={5} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminCard className="p-6">
            <h2 className="text-sm font-semibold text-[#F8FAFC] mb-4">
              Portfolio &amp; Analytics Configuration
            </h2>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className={labelClass}>Public Website Title</label>
                <input
                  type="text"
                  value={settings.siteTitle}
                  onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Footer Copyright Text</label>
                <input
                  type="text"
                  value={settings.footerCopyright}
                  onChange={(e) => setSettings({ ...settings, footerCopyright: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Analytics Retention Period (Days)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={7}
                    max={3650}
                    value={settings.dataRetentionDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        dataRetentionDays: Number(e.target.value) || 180,
                      })
                    }
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handlePrune}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-[#172033] hover:border-amber-500/50 text-xs font-medium text-[#F8FAFC] shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Prune Now</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                {[
                  {
                    key: 'enableAnalytics' as const,
                    label: 'Enable Privacy-Conscious Visitor Analytics',
                  },
                  {
                    key: 'requireCookieConsent' as const,
                    label: 'Require Visitor Consent Banner Before Tracking',
                  },
                  {
                    key: 'whatsappEnabled' as const,
                    label: 'Show WhatsApp Contact Button (if number is configured)',
                  },
                  {
                    key: 'maintenanceMode' as const,
                    label: 'Maintenance Mode Notice',
                  },
                ].map((toggle) => (
                  <label
                    key={toggle.key}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#0D1220] px-3.5 py-2.5 cursor-pointer"
                  >
                    <span className="text-xs text-[#F8FAFC]">{toggle.label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(settings[toggle.key])}
                      onChange={(e) =>
                        setSettings({ ...settings, [toggle.key]: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#3B82F6]"
                    />
                  </label>
                ))}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] px-5 py-2.5 text-xs font-semibold text-white"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </form>
          </AdminCard>

          <AdminCard className="p-6 space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#3B82F6]" />
                <span>Authorized Administrators</span>
              </h2>
              <p className="mt-1 text-xs text-[#94A3B8]">
                Only active administrator accounts listed below can access `/admin/*`.
              </p>
            </div>

            <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="admin@email.com"
                className={`${inputClass} sm:col-span-2`}
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#3B82F6] hover:bg-blue-500 px-3 py-2 text-xs font-semibold text-white"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Authorize</span>
              </button>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Display name (optional)"
                className={`${inputClass} sm:col-span-3`}
              />
            </form>

            <div className="divide-y divide-slate-800/80">
              {admins.map((a) => (
                <div key={a.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium text-[#F8FAFC] truncate">
                      {a.displayName}{' '}
                      {a.email === adminProfile?.email && (
                        <span className="ml-1 text-[10px] font-mono text-[#3B82F6]">(You)</span>
                      )}
                    </p>
                    <p className="text-[#94A3B8] truncate">{a.email}</p>
                    <p className="text-[10px] text-slate-500">
                      Last login: {formatDateTime(a.lastLoginAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={a.email === adminProfile?.email}
                    onClick={() => toggleAdminActive(a)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium disabled:opacity-40 ${
                      a.isActive
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                        : 'border-slate-700 bg-slate-800 text-slate-400'
                    }`}
                  >
                    {a.isActive ? 'Active' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>
      )}

      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
