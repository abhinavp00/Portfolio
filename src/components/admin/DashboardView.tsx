import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Download,
  Eye,
  FolderKanban,
  Github,
  Linkedin,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  UserCheck,
  Users,
} from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useAdminAuth } from '../../context/AdminAuthContext';
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

interface DeltaMetric {
  current: number;
  previous: number;
  changePercent: number | null;
}

interface DashboardPayload {
  dateRange: { label: string; start: string; end: string };
  cards: {
    totalVisitors: DeltaMetric;
    uniqueVisitors: DeltaMetric;
    totalPageViews: DeltaMetric;
    totalEnquiries: DeltaMetric;
    linkedinClicks: DeltaMetric;
    emailClicks: DeltaMetric;
    phoneClicks: DeltaMetric;
    resumeDownloads: DeltaMetric;
  };
  additional: {
    projectViews: number;
    githubClicks: number;
    contactFormSubmissions: number;
    whatsappClicks: number;
    avgEngagementSeconds: number;
    mostVisitedSection: { name: string; count: number } | null;
    mostViewedProject: { name: string; count: number } | null;
    returningVisitors: number;
  };
  dailySeries: Array<{
    date: string;
    visitors: number;
    uniqueVisitors: number;
    pageViews: number;
    enquiries: number;
    linkedin: number;
    email: number;
    phone: number;
    resume: number;
  }>;
  recentActivity: Array<{
    id: number;
    eventId: string;
    eventName: string;
    pagePath: string;
    sectionName: string;
    sourceLabel: string;
    projectTitle: string;
    deviceCategory: string;
    createdAt: string;
  }>;
  generatedAt: string;
}

interface LiveFeedItem {
  id: string;
  title: string;
  detail: string;
  device: string;
  timestamp: string;
  kind: 'event' | 'enquiry';
}

function formatEventLabel(evt: {
  eventName: string;
  sectionName?: string;
  sourceLabel?: string;
  projectTitle?: string;
}): { title: string; detail: string } {
  switch (evt.eventName) {
    case 'page_view':
      return { title: 'Portfolio Page View', detail: 'Visited public portfolio' };
    case 'session_start':
      return { title: 'New Session Started', detail: evt.sourceLabel || 'Landing session' };
    case 'section_view':
      return { title: `Section Viewed: ${evt.sectionName || 'Section'}`, detail: 'Scroll view' };
    case 'project_view':
    case 'project_detail_view':
      return {
        title: `Project Engagement: ${evt.projectTitle || 'Project'}`,
        detail: evt.eventName === 'project_detail_view' ? 'Opened project breakdown' : 'Viewed card',
      };
    case 'linkedin_click':
      return {
        title: 'LinkedIn Outbound Click',
        detail: `Source: ${evt.sourceLabel || 'portfolio'}`,
      };
    case 'github_click':
      return {
        title: evt.projectTitle ? `GitHub Click: ${evt.projectTitle}` : 'GitHub Profile Click',
        detail: `Source: ${evt.sourceLabel || 'portfolio'}`,
      };
    case 'email_click':
      return { title: 'Email Click Attempt', detail: `Source: ${evt.sourceLabel || 'contact'}` };
    case 'phone_click':
      return { title: 'Phone Click Attempt', detail: `Source: ${evt.sourceLabel || 'contact'}` };
    case 'whatsapp_click':
      return { title: 'WhatsApp Click Attempt', detail: `Source: ${evt.sourceLabel || 'contact'}` };
    case 'resume_download_attempt':
      return { title: 'Resume Download Requested', detail: `Source: ${evt.sourceLabel || 'hero'}` };
    case 'resume_download_success':
      return {
        title: 'Resume PDF Delivered',
        detail: `Source: ${evt.sourceLabel || 'hero'}`,
      };
    case 'contact_form_submit':
      return { title: 'Enquiry Form Submitted', detail: 'Public contact section' };
    default:
      return { title: evt.eventName.replace(/_/g, ' '), detail: evt.sourceLabel || 'Activity' };
  }
}

export const DashboardView: React.FC<{ onNavigate: (path: string) => void }> = ({
  onNavigate,
}) => {
  const { adminFetch, getToken } = useAdminAuth();
  const [filter, setFilter] = useState<DateRangeFilterState>({
    range: '30d',
    from: '',
    to: '',
  });
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [liveItems, setLiveItems] = useState<LiveFeedItem[]>([]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = buildRangeQuery(filter);
      const res = await adminFetch(`/api/admin/dashboard?${qs}`);
      if (!res.ok) {
        throw new Error('Failed to load dashboard metrics.');
      }
      const payload = (await res.json()) as DashboardPayload;
      setData(payload);
      setLiveItems(
        (payload.recentActivity || []).map((evt) => {
          const formatted = formatEventLabel(evt);
          return {
            id: evt.eventId || String(evt.id),
            title: formatted.title,
            detail: formatted.detail,
            device: evt.deviceCategory || 'desktop',
            timestamp: evt.createdAt,
            kind: 'event',
          };
        })
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, [adminFetch, filter]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Authenticated SSE stream for live visitor events & new enquiries
  useEffect(() => {
    let controller: AbortController | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;
    let attempt = 0;

    async function connectStream() {
      if (closed) return;
      controller = new AbortController();
      const token = await getToken();
      if (closed) return;
      setLiveStatus('connecting');

      try {
        const headers = new Headers();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        const res = await fetch('/api/admin/activity/stream', {
          credentials: 'same-origin',
          headers,
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          setLiveStatus('offline');
          if (!closed && res.status !== 401) {
            const delayMs = Math.min(30000, 2000 * 2 ** Math.min(attempt, 4));
            attempt += 1;
            reconnectTimer = setTimeout(connectStream, delayMs);
          }
          return;
        }

        attempt = 0;
        setLiveStatus('connected');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!closed) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split('\n\n');
          buffer = frames.pop() || '';

          for (const frame of frames) {
            if (!frame.trim() || frame.startsWith(':')) continue;
            let eventType = 'message';
            let dataLine = '';
            for (const line of frame.split('\n')) {
              if (line.startsWith('event:')) eventType = line.slice(6).trim();
              if (line.startsWith('data:')) dataLine += line.slice(5).trim();
            }
            if (!dataLine) continue;
            try {
              const parsed = JSON.parse(dataLine);
              if (eventType === 'activity' || eventType === 'analytics_event') {
                const isEnquirySuccess = parsed.eventName === 'contact_form_success';
                const formatted = isEnquirySuccess
                  ? {
                      title: `New Enquiry Received (${parsed.sourceLabel || 'Portfolio'})`,
                      detail: parsed.projectTitle
                        ? `Reference: ${parsed.projectTitle}`
                        : 'Submitted via contact form',
                    }
                  : formatEventLabel(parsed);
                const itemId = parsed.eventId || `${Date.now()}-${Math.random()}`;
                setLiveItems((prev) => {
                  if (prev.some((existing) => existing.id === itemId)) {
                    return prev;
                  }
                  return [
                    {
                      id: itemId,
                      title: formatted.title,
                      detail: formatted.detail,
                      device: parsed.deviceCategory || 'desktop',
                      timestamp: parsed.createdAt || new Date().toISOString(),
                      kind: isEnquirySuccess ? 'enquiry' : 'event',
                    },
                    ...prev.slice(0, 24),
                  ];
                });
              } else if (eventType === 'new_enquiry') {
                setLiveItems((prev) => [
                  {
                    id: `enq-${parsed.enquiryCode}-${Date.now()}`,
                    title: `New Enquiry: ${parsed.fullName}`,
                    detail: `${parsed.category} — ${parsed.subject}`,
                    device: 'form',
                    timestamp: parsed.createdAt || new Date().toISOString(),
                    kind: 'enquiry',
                  },
                  ...prev.slice(0, 24),
                ]);
              }
            } catch {
              // Ignore malformed SSE payload
            }
          }
        }

        if (!closed) {
          setLiveStatus('offline');
          const delayMs = Math.min(30000, 2000 * 2 ** Math.min(attempt, 4));
          attempt += 1;
          reconnectTimer = setTimeout(connectStream, delayMs);
        }
      } catch {
        if (!closed) {
          setLiveStatus('offline');
          const delayMs = Math.min(30000, 2000 * 2 ** Math.min(attempt, 4));
          attempt += 1;
          reconnectTimer = setTimeout(connectStream, delayMs);
        }
      }
    }

    connectStream();
    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      controller?.abort();
    };
  }, [getToken]);

  const kpiCards = data
    ? [
        {
          label: 'Total Visitors',
          metric: data.cards.totalVisitors,
          icon: <Users className="w-4 h-4 text-[#3B82F6]" />,
          color: '#3B82F6',
          seriesKey: 'visitors' as const,
        },
        {
          label: 'Unique Visitors',
          metric: data.cards.uniqueVisitors,
          icon: <UserCheck className="w-4 h-4 text-[#8B5CF6]" />,
          color: '#8B5CF6',
          seriesKey: 'uniqueVisitors' as const,
        },
        {
          label: 'Total Page Views',
          metric: data.cards.totalPageViews,
          icon: <Eye className="w-4 h-4 text-cyan-400" />,
          color: '#22D3EE',
          seriesKey: 'pageViews' as const,
        },
        {
          label: 'Total Enquiries',
          metric: data.cards.totalEnquiries,
          icon: <MessageSquare className="w-4 h-4 text-emerald-400" />,
          color: '#10B981',
          seriesKey: 'enquiries' as const,
        },
        {
          label: 'LinkedIn Clicks',
          metric: data.cards.linkedinClicks,
          icon: <Linkedin className="w-4 h-4 text-[#3B82F6]" />,
          color: '#3B82F6',
          seriesKey: 'linkedin' as const,
        },
        {
          label: 'Email Clicks',
          metric: data.cards.emailClicks,
          icon: <Mail className="w-4 h-4 text-[#8B5CF6]" />,
          color: '#8B5CF6',
          seriesKey: 'email' as const,
        },
        {
          label: 'Phone Clicks',
          metric: data.cards.phoneClicks,
          icon: <Phone className="w-4 h-4 text-amber-400" />,
          color: '#F59E0B',
          seriesKey: 'phone' as const,
        },
        {
          label: 'Resume Downloads',
          metric: data.cards.resumeDownloads,
          icon: <Download className="w-4 h-4 text-emerald-400" />,
          color: '#10B981',
          seriesKey: 'resume' as const,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Welcome Back, Abhinav!"
        subtitle="Portfolio Management & Analytics"
        actions={
          <>
            <DateRangeSelector value={filter} onChange={setFilter} />
            <button
              type="button"
              onClick={loadDashboard}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#111827] hover:border-[#3B82F6]/60 px-3 py-2 text-xs font-medium text-[#F8FAFC] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#3B82F6] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </>
        }
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
          {/* Top 8 Primary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {kpiCards.map((card) => {
              const pct = card.metric.changePercent;
              const isPositive = pct !== null && pct >= 0;
              return (
                <AdminCard key={card.label} className="p-5 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#94A3B8]">{card.label}</span>
                    <div className="w-8 h-8 rounded-lg bg-[#172033] border border-slate-800 flex items-center justify-center">
                      {card.icon}
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className="text-2xl font-bold tracking-tight text-[#F8FAFC] tabular-nums">
                        {card.metric.current.toLocaleString()}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                        {pct === null ? (
                          <span className="text-slate-400">New vs 0 prev</span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-0.5 font-medium ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            {Math.abs(pct)}%
                          </span>
                        )}
                        <span className="text-slate-500">vs prev ({card.metric.previous})</span>
                      </div>
                    </div>

                    <div className="w-24 h-12 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.dailySeries}>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0D1220',
                              borderColor: '#1E293B',
                              fontSize: '11px',
                              borderRadius: '8px',
                            }}
                            labelFormatter={(l) => String(l)}
                          />
                          <Area
                            type="monotone"
                            dataKey={card.seriesKey}
                            stroke={card.color}
                            strokeWidth={2}
                            fill={card.color}
                            fillOpacity={0.16}
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </AdminCard>
              );
            })}
          </div>

          {/* Secondary Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
            <AdminCard className="p-4">
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <FolderKanban className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>Project Views</span>
              </div>
              <p className="mt-2 text-lg font-semibold text-[#F8FAFC] tabular-nums">
                {data.additional.projectViews}
              </p>
            </AdminCard>

            <AdminCard className="p-4">
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <Github className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>GitHub Clicks</span>
              </div>
              <p className="mt-2 text-lg font-semibold text-[#F8FAFC] tabular-nums">
                {data.additional.githubClicks}
              </p>
            </AdminCard>

            <AdminCard className="p-4">
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Form Submits</span>
              </div>
              <p className="mt-2 text-lg font-semibold text-[#F8FAFC] tabular-nums">
                {data.additional.contactFormSubmissions}
              </p>
            </AdminCard>

            <AdminCard className="p-4">
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Clicks</span>
              </div>
              <p className="mt-2 text-lg font-semibold text-[#F8FAFC] tabular-nums">
                {data.additional.whatsappClicks}
              </p>
            </AdminCard>

            <AdminCard className="p-4">
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Avg Engagement</span>
              </div>
              <p className="mt-2 text-lg font-semibold text-[#F8FAFC] tabular-nums">
                {formatDuration(data.additional.avgEngagementSeconds)}
              </p>
            </AdminCard>

            <AdminCard className="p-4">
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Returning</span>
              </div>
              <p className="mt-2 text-lg font-semibold text-[#F8FAFC] tabular-nums">
                {data.additional.returningVisitors}
              </p>
            </AdminCard>

            <AdminCard className="p-4 col-span-1">
              <p className="text-[11px] text-[#94A3B8]">Top Section</p>
              <p className="mt-2 text-xs font-semibold text-[#F8FAFC] truncate capitalize">
                {data.additional.mostVisitedSection
                  ? `${data.additional.mostVisitedSection.name} (${data.additional.mostVisitedSection.count})`
                  : 'No data yet'}
              </p>
            </AdminCard>

            <AdminCard className="p-4 col-span-1">
              <p className="text-[11px] text-[#94A3B8]">Top Project</p>
              <p className="mt-2 text-xs font-semibold text-[#F8FAFC] truncate">
                {data.additional.mostViewedProject
                  ? `${data.additional.mostViewedProject.name} (${data.additional.mostViewedProject.count})`
                  : 'No data yet'}
              </p>
            </AdminCard>
          </div>

          {/* Live Activity Feed & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <AdminCard className="lg:col-span-2 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-[#3B82F6]" />
                  <h2 className="text-sm font-semibold text-[#F8FAFC]">
                    Real-Time Portfolio Activity Feed
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                      liveStatus === 'connected'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : liveStatus === 'connecting'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                        : 'border-slate-700 bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        liveStatus === 'connected'
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-slate-400'
                      }`}
                    />
                    {liveStatus === 'connected'
                      ? 'Live Stream Active'
                      : liveStatus === 'connecting'
                      ? 'Connecting...'
                      : 'Stream Paused'}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                {liveItems.length === 0 ? (
                  <AdminEmptyState
                    icon={<Activity className="w-5 h-5" />}
                    title="No Recorded Visitor Activity Yet"
                    description="Real-time events such as page views, LinkedIn/GitHub/email clicks, resume downloads, and enquiries will stream here automatically when visitors interact with your public portfolio."
                  />
                ) : (
                  <div className="divide-y divide-slate-800/70 max-h-[420px] overflow-y-auto pr-1">
                    {liveItems.map((item) => (
                      <div
                        key={item.id}
                        className="py-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-[#F8FAFC] truncate">
                            {item.kind === 'enquiry' && (
                              <span className="inline-block mr-2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                                ENQUIRY
                              </span>
                            )}
                            {item.title}
                          </p>
                          <p className="text-[11px] text-[#94A3B8] truncate">{item.detail}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-block px-2 py-0.5 rounded bg-[#172033] text-[10px] font-mono text-slate-300">
                            {item.device}
                          </span>
                          <p className="mt-1 text-[11px] text-slate-500 tabular-nums">
                            {formatDateTime(item.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AdminCard>

            <div className="space-y-4">
              <AdminCard className="p-5">
                <h2 className="text-sm font-semibold text-[#F8FAFC] mb-3">Quick Shortcuts</h2>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('/admin/resume')}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-800 bg-[#0D1220] hover:border-[#3B82F6]/60 text-xs font-medium text-[#F8FAFC] transition-colors"
                  >
                    <span>Upload / Manage PDF Resume</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#3B82F6]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('/admin/enquiries')}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-800 bg-[#0D1220] hover:border-[#3B82F6]/60 text-xs font-medium text-[#F8FAFC] transition-colors"
                  >
                    <span>Review Contact Enquiries</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#3B82F6]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('/admin/projects')}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-800 bg-[#0D1220] hover:border-[#3B82F6]/60 text-xs font-medium text-[#F8FAFC] transition-colors"
                  >
                    <span>Manage Portfolio Projects</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#3B82F6]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('/admin/analytics')}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-800 bg-[#0D1220] hover:border-[#3B82F6]/60 text-xs font-medium text-[#F8FAFC] transition-colors"
                  >
                    <span>Detailed Visitor Charts</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#3B82F6]" />
                  </button>
                </div>
              </AdminCard>

              <AdminCard className="p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Measurement Scope
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  All figures reflect real recorded portfolio telemetry for{' '}
                  <strong className="text-[#F8FAFC]">{data.dateRange.label}</strong>. Outbound
                  clicks measure link clicks from your portfolio; email/phone clicks represent click
                  attempts rather than external app delivery. Last generated:{' '}
                  <span className="font-mono text-slate-300">{formatDateTime(data.generatedAt)}</span>.
                </p>
              </AdminCard>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
