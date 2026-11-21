import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  Clock,
  Download,
  ExternalLink,
  FolderKanban,
  Github,
  Globe,
  Info,
  Linkedin,
  Mail,
  MessageSquare,
  Monitor,
  MousePointerClick,
  Phone,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAdminAuth } from '../../context/AdminAuthContext';
import type { ActivityEventRecord } from '../../types/portfolio';
import {
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
  AdminSkeleton,
  buildRangeQuery,
  DateRangeSelector,
  formatDateTime,
  formatDuration,
  type DateRangeFilterState,
} from './AdminShared';

interface AnalyticsPayload {
  dateRange: { label: string; start: string; end: string };
  summary: {
    totalVisitors: number;
    uniqueVisitors: number;
    returningVisitors: number;
    pageViews: number;
    sessions: number;
    avgSessionDuration: number;
    bounceRate: number;
    contactSubmissions: number;
    resumeDownloads: number;
  };
  chartSeries: Array<{
    date: string;
    visitors: number;
    uniqueVisitors: number;
    cumulativeVisitors: number;
    pageViews: number;
    resumeDownloads: number;
    submissions: number;
    socialClicks: number;
    projectEngagement: number;
  }>;
  geography: Array<{ country: string; region: string; city: string; sessions: number }>;
  devices: Array<{ name: string; value: number }>;
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0D1220',
  borderColor: '#1E293B',
  borderRadius: '10px',
  fontSize: '12px',
  color: '#F8FAFC',
};

export const AnalyticsView: React.FC = () => {
  const { adminFetch } = useAdminAuth();
  const [filter, setFilter] = useState<DateRangeFilterState>({ range: '30d', from: '', to: '' });
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildRangeQuery(filter);
      const res = await adminFetch(`/api/admin/analytics?${qs}`);
      if (!res.ok) throw new Error('Failed to load visitor analytics.');
      setData(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [adminFetch, filter]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Website Visitor Analytics"
        subtitle="Traffic trends, engagement metrics, bounce rate, device distribution, and coarse geography."
        actions={<DateRangeSelector value={filter} onChange={setFilter} />}
      />

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-200">
          {error}
        </div>
      )}

      {loading && !data ? (
        <AdminSkeleton rows={6} />
      ) : data ? (
        <>
          {/* Summary KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <AdminCard className="p-4">
              <p className="text-[11px] text-[#94A3B8]">Total Sessions</p>
              <p className="mt-1.5 text-xl font-bold text-[#F8FAFC] tabular-nums">
                {data.summary.totalVisitors}
              </p>
            </AdminCard>
            <AdminCard className="p-4">
              <p className="text-[11px] text-[#94A3B8]">Unique Visitors</p>
              <p className="mt-1.5 text-xl font-bold text-[#3B82F6] tabular-nums">
                {data.summary.uniqueVisitors}
              </p>
            </AdminCard>
            <AdminCard className="p-4">
              <p className="text-[11px] text-[#94A3B8]">Page Views</p>
              <p className="mt-1.5 text-xl font-bold text-[#F8FAFC] tabular-nums">
                {data.summary.pageViews}
              </p>
            </AdminCard>
            <AdminCard className="p-4">
              <p className="text-[11px] text-[#94A3B8]">Avg Duration</p>
              <p className="mt-1.5 text-xl font-bold text-cyan-400 tabular-nums">
                {formatDuration(data.summary.avgSessionDuration)}
              </p>
            </AdminCard>
            <AdminCard className="p-4">
              <p className="text-[11px] text-[#94A3B8]" title="Sessions with <=1 view and <10s duration">
                Bounce Rate
              </p>
              <p className="mt-1.5 text-xl font-bold text-amber-400 tabular-nums">
                {data.summary.bounceRate}%
              </p>
            </AdminCard>
            <AdminCard className="p-4">
              <p className="text-[11px] text-[#94A3B8]">Returning Visitors</p>
              <p className="mt-1.5 text-xl font-bold text-emerald-400 tabular-nums">
                {data.summary.returningVisitors}
              </p>
            </AdminCard>
          </div>

          {/* Primary Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdminCard className="p-5">
              <h2 className="text-sm font-semibold text-[#F8FAFC] mb-1">
                Daily Visitors &amp; Page Views
              </h2>
              <p className="text-xs text-[#94A3B8] mb-4">{data.dateRange.label}</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chartSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      name="Sessions"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.18}
                    />
                    <Area
                      type="monotone"
                      dataKey="pageViews"
                      name="Page Views"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.14}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </AdminCard>

            <AdminCard className="p-5">
              <h2 className="text-sm font-semibold text-[#F8FAFC] mb-1">
                Conversions &amp; Engagement Trends
              </h2>
              <p className="text-xs text-[#94A3B8] mb-4">
                Resume downloads, enquiries, social clicks, and project engagement
              </p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chartSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="socialClicks" name="Social Clicks" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="projectEngagement" name="Project Views" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="resumeDownloads" name="Resumes" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="submissions" name="Enquiries" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AdminCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AdminCard className="p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold text-[#F8FAFC] mb-1">
                Cumulative Visitor Growth
              </h2>
              <p className="text-xs text-[#94A3B8] mb-4">
                Cumulative unique visitors within the selected window
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.chartSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Line
                      type="monotone"
                      dataKey="cumulativeVisitors"
                      name="Cumulative Unique Visitors"
                      stroke="#22D3EE"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </AdminCard>

            <AdminCard className="p-5 space-y-5">
              <div>
                <h2 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-[#3B82F6]" />
                  <span>Device Distribution</span>
                </h2>
                <div className="mt-3 space-y-2.5">
                  {data.devices.length === 0 ? (
                    <p className="text-xs text-slate-500">No device telemetry recorded yet.</p>
                  ) : (
                    data.devices.map((d) => {
                      const total = data.summary.sessions || 1;
                      const pct = Math.round((d.value / total) * 100);
                      return (
                        <div key={d.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="capitalize text-[#F8FAFC]">{d.name}</span>
                            <span className="text-[#94A3B8] tabular-nums">
                              {d.value} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-xs font-semibold text-[#F8FAFC] flex items-center gap-2 mb-2">
                  <Globe className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>Approximate Geography</span>
                </h3>
                {data.geography.length === 0 ? (
                  <p className="text-xs text-slate-500">No location headers recorded yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs">
                    {data.geography.map((g, i) => (
                      <div key={i} className="flex justify-between text-[#94A3B8]">
                        <span className="truncate text-[#F8FAFC]">
                          {[g.city !== '—' ? g.city : null, g.country].filter(Boolean).join(', ')}
                        </span>
                        <span className="font-mono tabular-nums">{g.sessions}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AdminCard>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0D1220] p-4 flex items-start gap-2.5 text-xs text-[#94A3B8]">
            <Info className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
            <p>
              Bounce rate strictly counts sessions with &le; 1 page view and &lt; 10 seconds active
              duration. Geographical entries use coarse proxy-level metadata without storing raw
              visitor IP addresses.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
};

interface ActivityPayload {
  dateRange: { label: string };
  totals: {
    linkedinClicks: number;
    emailClicks: number;
    phoneClicks: number;
    githubClicks: number;
    whatsappClicks: number;
    resumeAttempts: number;
    resumeSuccesses: number;
  };
  projectGithubBreakdown: Array<{ name: string; clicks: number }>;
  dailyTrends: Array<{
    date: string;
    linkedin: number;
    email: number;
    phone: number;
    github: number;
    resume: number;
  }>;
  histories: {
    linkedin: ActivityEventRecord[];
    email: ActivityEventRecord[];
    phone: ActivityEventRecord[];
    github: ActivityEventRecord[];
    whatsapp: ActivityEventRecord[];
    resume: ActivityEventRecord[];
  };
  recentAll: ActivityEventRecord[];
}

interface ProjectAnalyticsRow {
  id: number;
  slug: string;
  title: string;
  category: string;
  isPublished: boolean;
  cardViews: number;
  detailViews: number;
  githubClicks: number;
  liveDemoClicks: number;
  totalEngagement: number;
}

export type ActivityTabKey = 'all' | 'social' | 'contact' | 'resume' | 'projects';

export const ActivityView: React.FC<{ initialTab?: ActivityTabKey }> = ({
  initialTab = 'all',
}) => {
  const { adminFetch } = useAdminAuth();
  const [tab, setTab] = useState<ActivityTabKey>(initialTab);
  const [filter, setFilter] = useState<DateRangeFilterState>({ range: '30d', from: '', to: '' });
  const [activity, setActivity] = useState<ActivityPayload | null>(null);
  const [projectRows, setProjectRows] = useState<ProjectAnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildRangeQuery(filter);
      const [actRes, projRes] = await Promise.all([
        adminFetch(`/api/admin/activity?${qs}`),
        adminFetch(`/api/admin/projects/analytics?${qs}`),
      ]);
      if (!actRes.ok || !projRes.ok) {
        throw new Error('Failed to load interaction activity.');
      }
      setActivity(await actRes.json());
      const body = await projRes.json();
      setProjectRows(body.projects || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load interaction activity.');
    } finally {
      setLoading(false);
    }
  }, [adminFetch, filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabs: { key: ActivityTabKey; label: string }[] = [
    { key: 'all', label: 'All Activity Logs' },
    { key: 'social', label: 'Social Clicks' },
    { key: 'contact', label: 'Contact Clicks' },
    { key: 'resume', label: 'Resume Downloads' },
    { key: 'projects', label: 'Project Engagement' },
  ];

  const activeRows: ActivityEventRecord[] = activity
    ? tab === 'social'
      ? [...activity.histories.linkedin, ...activity.histories.github].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      : tab === 'contact'
      ? [
          ...activity.histories.email,
          ...activity.histories.phone,
          ...activity.histories.whatsapp,
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      : tab === 'resume'
      ? activity.histories.resume
      : activity.recentAll
    : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Interaction & Engagement Logs"
        subtitle="Track outbound LinkedIn/GitHub clicks, contact click attempts, resume PDF deliveries, and project engagement."
        actions={<DateRangeSelector value={filter} onChange={setFilter} />}
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
              tab === t.key
                ? 'bg-[#3B82F6] border-[#3B82F6] text-white'
                : 'bg-[#111827] border-slate-800 text-[#94A3B8] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-200">
          {error}
        </div>
      )}

      {loading && !activity ? (
        <AdminSkeleton rows={5} />
      ) : activity ? (
        <>
          {/* Totals Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <AdminCard className="p-4">
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <Linkedin className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>LinkedIn Clicks</span>
              </div>
              <p className="mt-1.5 text-xl font-bold text-[#F8FAFC] tabular-nums">
                {activity.totals.linkedinClicks}
              </p>
            </AdminCard>
            <AdminCard className="p-4">
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <Github className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>GitHub Clicks</span>
              </div>
              <p className="mt-1.5 text-xl font-bold text-[#F8FAFC] tabular-nums">
                {activity.totals.githubClicks}
              </p>
            </AdminCard>
            <AdminCard className="p-4">
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>Email Clicks</span>
              </div>
              <p className="mt-1.5 text-xl font-bold text-[#F8FAFC] tabular-nums">
                {activity.totals.emailClicks}
              </p>
            </AdminCard>
            <AdminCard className="p-4">
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Phone Clicks</span>
              </div>
              <p className="mt-1.5 text-xl font-bold text-[#F8FAFC] tabular-nums">
                {activity.totals.phoneClicks}
              </p>
            </AdminCard>
            <AdminCard className="p-4">
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Clicks</span>
              </div>
              <p className="mt-1.5 text-xl font-bold text-[#F8FAFC] tabular-nums">
                {activity.totals.whatsappClicks}
              </p>
            </AdminCard>
            <AdminCard className="p-4">
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resume PDFs Sent</span>
              </div>
              <p className="mt-1.5 text-xl font-bold text-[#F8FAFC] tabular-nums">
                {activity.totals.resumeSuccesses}
                <span className="ml-1 text-[11px] font-normal text-[#94A3B8]">
                  / {activity.totals.resumeAttempts} req
                </span>
              </p>
            </AdminCard>
          </div>

          {/* Honest Measurement Disclaimers */}
          <div className="rounded-xl border border-slate-800 bg-[#0D1220] p-4 flex items-start gap-2.5 text-xs text-[#94A3B8]">
            <Info className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
            <p>
              <strong>Accurate Scope:</strong> LinkedIn &amp; GitHub metrics track outbound clicks
              from this portfolio (not third-party internal profile views). Email, Phone, and
              WhatsApp counts record click attempts on `mailto:`, `tel:`, and `wa.me` links. Resume
              success counts reflect completed server PDF responses (`application/pdf`).
            </p>
          </div>

          {tab === 'projects' ? (
            <AdminCard className="overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800/80 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-[#3B82F6]" />
                <h3 className="text-sm font-semibold text-[#F8FAFC]">
                  Project Engagement Breakdown
                </h3>
              </div>
              {projectRows.length === 0 ? (
                <div className="p-6">
                  <AdminEmptyState
                    title="No Projects Available"
                    description="Create or publish projects in Portfolio Management to track project views and repository clicks."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0D1220] text-[#94A3B8] border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3 font-medium">Project</th>
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium">Card Views</th>
                        <th className="px-4 py-3 font-medium">Detail Opens</th>
                        <th className="px-4 py-3 font-medium">GitHub Clicks</th>
                        <th className="px-4 py-3 font-medium">Live Demo Clicks</th>
                        <th className="px-4 py-3 font-medium">Total Engagement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {projectRows.map((p) => (
                        <tr key={p.id}>
                          <td className="px-4 py-3 font-medium text-[#F8FAFC]">{p.title}</td>
                          <td className="px-4 py-3 text-[#94A3B8]">{p.category}</td>
                          <td className="px-4 py-3 tabular-nums text-[#F8FAFC]">{p.cardViews}</td>
                          <td className="px-4 py-3 tabular-nums text-[#F8FAFC]">{p.detailViews}</td>
                          <td className="px-4 py-3 tabular-nums text-[#3B82F6]">{p.githubClicks}</td>
                          <td className="px-4 py-3 tabular-nums text-[#8B5CF6]">{p.liveDemoClicks}</td>
                          <td className="px-4 py-3 tabular-nums font-semibold text-emerald-400">
                            {p.totalEngagement}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AdminCard>
          ) : (
            <>
              {tab === 'social' && activity.projectGithubBreakdown.length > 0 && (
                <AdminCard className="p-5">
                  <h3 className="text-sm font-semibold text-[#F8FAFC] mb-3">
                    GitHub Clicks by Source / Project
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {activity.projectGithubBreakdown.map((item) => (
                      <div
                        key={item.name}
                        className="rounded-xl border border-slate-800 bg-[#0D1220] px-4 py-3 flex items-center justify-between text-xs"
                      >
                        <span className="text-[#F8FAFC] truncate">{item.name}</span>
                        <span className="font-mono font-semibold text-[#3B82F6] tabular-nums">
                          {item.clicks}
                        </span>
                      </div>
                    ))}
                  </div>
                </AdminCard>
              )}

              <AdminCard className="overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                    <MousePointerClick className="w-4 h-4 text-[#3B82F6]" />
                    <span>Recorded Event History</span>
                  </h3>
                  <span className="text-xs font-mono text-[#94A3B8]">
                    {activeRows.length} events
                  </span>
                </div>

                {activeRows.length === 0 ? (
                  <div className="p-6">
                    <AdminEmptyState
                      icon={<Activity className="w-5 h-5" />}
                      title="No Recorded Events in This Period"
                      description="Real visitor interactions matching this category will populate automatically as visitors engage with your portfolio."
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0D1220] text-[#94A3B8] border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3 font-medium">Event</th>
                          <th className="px-4 py-3 font-medium">Source / Section</th>
                          <th className="px-4 py-3 font-medium">Target / Project</th>
                          <th className="px-4 py-3 font-medium">Device</th>
                          <th className="px-4 py-3 font-medium">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {activeRows.map((evt) => (
                          <tr key={evt.id} className="hover:bg-[#172033]/40">
                            <td className="px-4 py-3 font-mono text-[#3B82F6]">{evt.eventName}</td>
                            <td className="px-4 py-3 text-[#F8FAFC]">
                              {evt.sourceLabel || evt.sectionName || evt.pagePath}
                            </td>
                            <td className="px-4 py-3 text-[#94A3B8]">
                              {evt.projectTitle || evt.targetCategory || '—'}
                            </td>
                            <td className="px-4 py-3 capitalize text-[#94A3B8]">
                              {evt.deviceCategory}
                            </td>
                            <td className="px-4 py-3 text-[#94A3B8] whitespace-nowrap">
                              {formatDateTime(evt.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </AdminCard>
            </>
          )}
        </>
      ) : null}
    </div>
  );
};
