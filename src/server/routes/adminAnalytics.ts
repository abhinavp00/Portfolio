import { Router } from 'express';
import { and, asc, desc, eq, gte, ilike, inArray, lte } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import {
  analyticsEvents,
  anonymousVisitors,
  enquiries,
  projects,
  visitorSessions,
} from '../../db/schema.ts';
import { addRealtimeClient, removeRealtimeClient } from '../realtime.ts';

interface DateWindow {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  label: string;
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function endOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

function resolveDateRange(range?: string, fromStr?: string, toStr?: string): DateWindow {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const todayEnd = endOfUtcDay(now);
  const dayMs = 24 * 60 * 60 * 1000;

  let start = new Date(todayStart.getTime() - 29 * dayMs);
  let end = todayEnd;
  let label = 'Last 30 Days';

  switch (range) {
    case 'today': {
      start = todayStart;
      end = todayEnd;
      label = 'Today';
      break;
    }
    case 'yesterday': {
      start = new Date(todayStart.getTime() - dayMs);
      end = new Date(todayEnd.getTime() - dayMs);
      label = 'Yesterday';
      break;
    }
    case '7d': {
      start = new Date(todayStart.getTime() - 6 * dayMs);
      end = todayEnd;
      label = 'Last 7 Days';
      break;
    }
    case '30d': {
      start = new Date(todayStart.getTime() - 29 * dayMs);
      end = todayEnd;
      label = 'Last 30 Days';
      break;
    }
    case '90d': {
      start = new Date(todayStart.getTime() - 89 * dayMs);
      end = todayEnd;
      label = 'Last 90 Days';
      break;
    }
    case 'this_month': {
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      end = todayEnd;
      label = 'This Month';
      break;
    }
    case 'prev_month': {
      const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const prevMonthEnd = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999)
      );
      start = prevMonthStart;
      end = prevMonthEnd;
      label = 'Previous Month';
      break;
    }
    case 'custom': {
      if (fromStr && toStr) {
        const parsedFrom = new Date(fromStr);
        const parsedTo = new Date(toStr);
        if (!Number.isNaN(parsedFrom.getTime()) && !Number.isNaN(parsedTo.getTime())) {
          const [earlier, later] =
            parsedFrom.getTime() <= parsedTo.getTime()
              ? [parsedFrom, parsedTo]
              : [parsedTo, parsedFrom];
          start = startOfUtcDay(earlier);
          end = endOfUtcDay(later);
          label = `${earlier.toISOString().slice(0, 10)} to ${later.toISOString().slice(0, 10)}`;
        }
      }
      break;
    }
    default:
      break;
  }

  const spanMs = Math.max(dayMs, end.getTime() - start.getTime() + 1);
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - spanMs + 1);

  return { start, end, prevStart, prevEnd, label };
}

function buildDailyBuckets(start: Date, end: Date): string[] {
  const keys: string[] = [];
  const cursor = startOfUtcDay(start);
  const limit = startOfUtcDay(end);
  while (cursor.getTime() <= limit.getTime() && keys.length < 180) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function computeDelta(current: number, previous: number): {
  current: number;
  previous: number;
  changePercent: number | null;
} {
  if (previous === 0) {
    return {
      current,
      previous,
      changePercent: current === 0 ? 0 : null,
    };
  }
  const pct = Number((((current - previous) / previous) * 100).toFixed(1));
  return { current, previous, changePercent: pct };
}

export function createAdminAnalyticsRouter(): Router {
  const router = Router();

  // Real-time Activity SSE Stream
  router.get('/activity/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write(`event: connected\ndata: ${JSON.stringify({ connectedAt: new Date().toISOString() })}\n\n`);
    addRealtimeClient(res);

    const pingTimer = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(pingTimer);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(pingTimer);
      removeRealtimeClient(res);
    });
  });

  // Main Dashboard Overview
  router.get('/dashboard', async (req, res) => {
    try {
      const range = typeof req.query.range === 'string' ? req.query.range : '30d';
      const from = typeof req.query.from === 'string' ? req.query.from : undefined;
      const to = typeof req.query.to === 'string' ? req.query.to : undefined;
      const win = resolveDateRange(range, from, to);

      const [
        currSessions,
        prevSessions,
        currEvents,
        prevEvents,
        currEnquiries,
        prevEnquiries,
        recentActivity,
      ] = await Promise.all([
        db
          .select()
          .from(visitorSessions)
          .where(and(gte(visitorSessions.startedAt, win.start), lte(visitorSessions.startedAt, win.end))),
        db
          .select()
          .from(visitorSessions)
          .where(
            and(gte(visitorSessions.startedAt, win.prevStart), lte(visitorSessions.startedAt, win.prevEnd))
          ),
        db
          .select()
          .from(analyticsEvents)
          .where(and(gte(analyticsEvents.createdAt, win.start), lte(analyticsEvents.createdAt, win.end))),
        db
          .select()
          .from(analyticsEvents)
          .where(
            and(gte(analyticsEvents.createdAt, win.prevStart), lte(analyticsEvents.createdAt, win.prevEnd))
          ),
        db
          .select({ id: enquiries.id, createdAt: enquiries.createdAt })
          .from(enquiries)
          .where(and(gte(enquiries.createdAt, win.start), lte(enquiries.createdAt, win.end))),
        db
          .select({ id: enquiries.id })
          .from(enquiries)
          .where(and(gte(enquiries.createdAt, win.prevStart), lte(enquiries.createdAt, win.prevEnd))),
        db
          .select()
          .from(analyticsEvents)
          .orderBy(desc(analyticsEvents.createdAt))
          .limit(20),
      ]);

      const countEvents = (list: typeof currEvents, name: string) =>
        list.filter((e) => e.eventName === name).length;

      const currUnique = new Set(currSessions.map((s) => s.visitorId)).size;
      const prevUnique = new Set(prevSessions.map((s) => s.visitorId)).size;
      const currReturning = new Set(
        currSessions.filter((s) => s.isReturning).map((s) => s.visitorId)
      ).size;

      const currPageViews = countEvents(currEvents, 'page_view');
      const prevPageViews = countEvents(prevEvents, 'page_view');

      const currLinkedin = countEvents(currEvents, 'linkedin_click');
      const prevLinkedin = countEvents(prevEvents, 'linkedin_click');

      const currEmail = countEvents(currEvents, 'email_click');
      const prevEmail = countEvents(prevEvents, 'email_click');

      const currPhone = countEvents(currEvents, 'phone_click');
      const prevPhone = countEvents(prevEvents, 'phone_click');

      const currGithub = countEvents(currEvents, 'github_click');
      const currWhatsapp = countEvents(currEvents, 'whatsapp_click');

      const currResume = countEvents(currEvents, 'resume_download_success');
      const prevResume = countEvents(prevEvents, 'resume_download_success');

      const currProjectViews = currEvents.filter(
        (e) => e.eventName === 'project_view' || e.eventName === 'project_detail_view'
      ).length;

      const avgEngagementSeconds =
        currSessions.length > 0
          ? Math.round(
              currSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) /
                currSessions.length
            )
          : 0;

      // Most visited section
      const sectionCounts = new Map<string, number>();
      for (const e of currEvents) {
        if (e.eventName === 'section_view' && e.sectionName) {
          sectionCounts.set(e.sectionName, (sectionCounts.get(e.sectionName) || 0) + 1);
        }
      }
      let mostVisitedSection: { name: string; count: number } | null = null;
      for (const [name, cnt] of sectionCounts.entries()) {
        if (!mostVisitedSection || cnt > mostVisitedSection.count) {
          mostVisitedSection = { name, count: cnt };
        }
      }

      // Most viewed project
      const projectCounts = new Map<string, number>();
      for (const e of currEvents) {
        if (
          (e.eventName === 'project_view' || e.eventName === 'project_detail_view') &&
          (e.projectTitle || e.projectId)
        ) {
          const label = e.projectTitle || e.projectId;
          projectCounts.set(label, (projectCounts.get(label) || 0) + 1);
        }
      }
      let mostViewedProject: { name: string; count: number } | null = null;
      for (const [name, cnt] of projectCounts.entries()) {
        if (!mostViewedProject || cnt > mostViewedProject.count) {
          mostViewedProject = { name, count: cnt };
        }
      }

      // Build daily sparkline trends for top cards
      const dateKeys = buildDailyBuckets(win.start, win.end);
      const dayMap = new Map<
        string,
        {
          date: string;
          visitors: number;
          uniqueSet: Set<string>;
          pageViews: number;
          enquiries: number;
          linkedin: number;
          email: number;
          phone: number;
          resume: number;
        }
      >();
      for (const k of dateKeys) {
        dayMap.set(k, {
          date: k,
          visitors: 0,
          uniqueSet: new Set(),
          pageViews: 0,
          enquiries: 0,
          linkedin: 0,
          email: 0,
          phone: 0,
          resume: 0,
        });
      }

      for (const s of currSessions) {
        const k = s.startedAt.toISOString().slice(0, 10);
        const entry = dayMap.get(k);
        if (entry) {
          entry.visitors += 1;
          entry.uniqueSet.add(s.visitorId);
        }
      }
      for (const e of currEvents) {
        const k = e.createdAt.toISOString().slice(0, 10);
        const entry = dayMap.get(k);
        if (!entry) continue;
        if (e.eventName === 'page_view') entry.pageViews += 1;
        else if (e.eventName === 'linkedin_click') entry.linkedin += 1;
        else if (e.eventName === 'email_click') entry.email += 1;
        else if (e.eventName === 'phone_click') entry.phone += 1;
        else if (e.eventName === 'resume_download_success') entry.resume += 1;
      }
      for (const enq of currEnquiries) {
        const k = enq.createdAt.toISOString().slice(0, 10);
        const entry = dayMap.get(k);
        if (entry) entry.enquiries += 1;
      }

      const dailySeries = Array.from(dayMap.values()).map((d) => ({
        date: d.date,
        visitors: d.visitors,
        uniqueVisitors: d.uniqueSet.size,
        pageViews: d.pageViews,
        enquiries: d.enquiries,
        linkedin: d.linkedin,
        email: d.email,
        phone: d.phone,
        resume: d.resume,
      }));

      res.json({
        dateRange: {
          label: win.label,
          start: win.start.toISOString(),
          end: win.end.toISOString(),
        },
        cards: {
          totalVisitors: computeDelta(currSessions.length, prevSessions.length),
          uniqueVisitors: computeDelta(currUnique, prevUnique),
          totalPageViews: computeDelta(currPageViews, prevPageViews),
          totalEnquiries: computeDelta(currEnquiries.length, prevEnquiries.length),
          linkedinClicks: computeDelta(currLinkedin, prevLinkedin),
          emailClicks: computeDelta(currEmail, prevEmail),
          phoneClicks: computeDelta(currPhone, prevPhone),
          resumeDownloads: computeDelta(currResume, prevResume),
        },
        additional: {
          projectViews: currProjectViews,
          githubClicks: currGithub,
          contactFormSubmissions: currEnquiries.length,
          whatsappClicks: currWhatsapp,
          avgEngagementSeconds,
          mostVisitedSection,
          mostViewedProject,
          returningVisitors: currReturning,
        },
        dailySeries,
        recentActivity,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('GET /admin/dashboard error:', error);
      res.status(500).json({ error: 'Failed to load dashboard analytics.' });
    }
  });

  // Full Website Visitor Analytics
  router.get('/analytics', async (req, res) => {
    try {
      const range = typeof req.query.range === 'string' ? req.query.range : '30d';
      const from = typeof req.query.from === 'string' ? req.query.from : undefined;
      const to = typeof req.query.to === 'string' ? req.query.to : undefined;
      const win = resolveDateRange(range, from, to);

      const [sessions, events, periodEnquiries] = await Promise.all([
        db
          .select()
          .from(visitorSessions)
          .where(and(gte(visitorSessions.startedAt, win.start), lte(visitorSessions.startedAt, win.end))),
        db
          .select()
          .from(analyticsEvents)
          .where(and(gte(analyticsEvents.createdAt, win.start), lte(analyticsEvents.createdAt, win.end))),
        db
          .select({ id: enquiries.id, createdAt: enquiries.createdAt })
          .from(enquiries)
          .where(and(gte(enquiries.createdAt, win.start), lte(enquiries.createdAt, win.end))),
      ]);

      const uniqueVisitors = new Set(sessions.map((s) => s.visitorId)).size;
      const returningVisitors = new Set(
        sessions.filter((s) => s.isReturning).map((s) => s.visitorId)
      ).size;
      const pageViews = events.filter((e) => e.eventName === 'page_view').length;
      const resumeDownloads = events.filter((e) => e.eventName === 'resume_download_success').length;
      const avgSessionDuration =
        sessions.length > 0
          ? Math.round(
              sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / sessions.length
            )
          : 0;

      // Accurately defined Bounce Rate: sessions with <= 1 page view and < 10 seconds duration
      const bouncedSessions = sessions.filter(
        (s) => s.pageViewsCount <= 1 && s.durationSeconds < 10
      ).length;
      const bounceRate =
        sessions.length > 0 ? Number(((bouncedSessions / sessions.length) * 100).toFixed(1)) : 0;

      const dateKeys = buildDailyBuckets(win.start, win.end);
      const dayStats = new Map<
        string,
        {
          date: string;
          visitors: number;
          uniqueSet: Set<string>;
          pageViews: number;
          resumeDownloads: number;
          submissions: number;
          socialClicks: number;
          projectEngagement: number;
        }
      >();
      for (const k of dateKeys) {
        dayStats.set(k, {
          date: k,
          visitors: 0,
          uniqueSet: new Set(),
          pageViews: 0,
          resumeDownloads: 0,
          submissions: 0,
          socialClicks: 0,
          projectEngagement: 0,
        });
      }

      for (const s of sessions) {
        const k = s.startedAt.toISOString().slice(0, 10);
        const row = dayStats.get(k);
        if (row) {
          row.visitors += 1;
          row.uniqueSet.add(s.visitorId);
        }
      }
      for (const e of events) {
        const k = e.createdAt.toISOString().slice(0, 10);
        const row = dayStats.get(k);
        if (!row) continue;
        if (e.eventName === 'page_view') row.pageViews += 1;
        if (e.eventName === 'resume_download_success') row.resumeDownloads += 1;
        if (
          e.eventName === 'linkedin_click' ||
          e.eventName === 'github_click' ||
          e.eventName === 'email_click' ||
          e.eventName === 'phone_click' ||
          e.eventName === 'whatsapp_click'
        ) {
          row.socialClicks += 1;
        }
        if (e.eventName === 'project_view' || e.eventName === 'project_detail_view') {
          row.projectEngagement += 1;
        }
      }
      for (const enq of periodEnquiries) {
        const k = enq.createdAt.toISOString().slice(0, 10);
        const row = dayStats.get(k);
        if (row) row.submissions += 1;
      }

      let cumulativeVisitors = 0;
      const chartSeries = Array.from(dayStats.values()).map((d) => {
        cumulativeVisitors += d.uniqueSet.size;
        return {
          date: d.date,
          visitors: d.visitors,
          uniqueVisitors: d.uniqueSet.size,
          cumulativeVisitors,
          pageViews: d.pageViews,
          resumeDownloads: d.resumeDownloads,
          submissions: d.submissions,
          socialClicks: d.socialClicks,
          projectEngagement: d.projectEngagement,
        };
      });

      // Geographical aggregation (approximate)
      const geoMap = new Map<string, { country: string; region: string; city: string; sessions: number }>();
      for (const s of sessions) {
        const key = `${s.country}|${s.region}|${s.city}`;
        const curr = geoMap.get(key) || {
          country: s.country || 'Unknown',
          region: s.region || '—',
          city: s.city || '—',
          sessions: 0,
        };
        curr.sessions += 1;
        geoMap.set(key, curr);
      }

      // Device / Browser breakdowns
      const deviceMap = new Map<string, number>();
      for (const s of sessions) {
        deviceMap.set(s.deviceCategory, (deviceMap.get(s.deviceCategory) || 0) + 1);
      }

      res.json({
        dateRange: { label: win.label, start: win.start.toISOString(), end: win.end.toISOString() },
        summary: {
          totalVisitors: sessions.length,
          uniqueVisitors,
          returningVisitors,
          pageViews,
          sessions: sessions.length,
          avgSessionDuration,
          bounceRate,
          contactSubmissions: periodEnquiries.length,
          resumeDownloads,
        },
        chartSeries,
        geography: Array.from(geoMap.values()).sort((a, b) => b.sessions - a.sessions),
        devices: Array.from(deviceMap.entries()).map(([name, value]) => ({ name, value })),
      });
    } catch (error) {
      console.error('GET /admin/analytics error:', error);
      res.status(500).json({ error: 'Failed to load visitor analytics.' });
    }
  });

  // Social Media, Contact & Resume Click Activity
  router.get('/activity', async (req, res) => {
    try {
      const range = typeof req.query.range === 'string' ? req.query.range : '30d';
      const from = typeof req.query.from === 'string' ? req.query.from : undefined;
      const to = typeof req.query.to === 'string' ? req.query.to : undefined;
      const win = resolveDateRange(range, from, to);

      const events = await db
        .select()
        .from(analyticsEvents)
        .where(and(gte(analyticsEvents.createdAt, win.start), lte(analyticsEvents.createdAt, win.end)))
        .orderBy(desc(analyticsEvents.createdAt));

      const byType = (names: string[]) => events.filter((e) => names.includes(e.eventName));

      const linkedinEvents = byType(['linkedin_click']);
      const emailEvents = byType(['email_click']);
      const phoneEvents = byType(['phone_click']);
      const githubEvents = byType(['github_click']);
      const whatsappEvents = byType(['whatsapp_click']);
      const resumeAttempts = byType(['resume_download_attempt']);
      const resumeSuccesses = byType(['resume_download_success']);

      const projectGithubMap = new Map<string, number>();
      for (const e of githubEvents) {
        const label = e.projectTitle || (e.sourceLabel === 'navbar' || e.sourceLabel === 'footer' || e.sourceLabel === 'hero' || e.sourceLabel === 'contact' ? `Profile (${e.sourceLabel})` : e.sourceLabel || 'GitHub Profile');
        projectGithubMap.set(label, (projectGithubMap.get(label) || 0) + 1);
      }

      const dateKeys = buildDailyBuckets(win.start, win.end);
      const trendMap = new Map<
        string,
        { date: string; linkedin: number; email: number; phone: number; github: number; resume: number }
      >();
      for (const k of dateKeys) {
        trendMap.set(k, { date: k, linkedin: 0, email: 0, phone: 0, github: 0, resume: 0 });
      }
      for (const e of events) {
        const k = e.createdAt.toISOString().slice(0, 10);
        const row = trendMap.get(k);
        if (!row) continue;
        if (e.eventName === 'linkedin_click') row.linkedin += 1;
        if (e.eventName === 'email_click') row.email += 1;
        if (e.eventName === 'phone_click') row.phone += 1;
        if (e.eventName === 'github_click') row.github += 1;
        if (e.eventName === 'resume_download_success') row.resume += 1;
      }

      res.json({
        dateRange: { label: win.label },
        totals: {
          linkedinClicks: linkedinEvents.length,
          emailClicks: emailEvents.length,
          phoneClicks: phoneEvents.length,
          githubClicks: githubEvents.length,
          whatsappClicks: whatsappEvents.length,
          resumeAttempts: resumeAttempts.length,
          resumeSuccesses: resumeSuccesses.length,
        },
        projectGithubBreakdown: Array.from(projectGithubMap.entries()).map(([name, clicks]) => ({
          name,
          clicks,
        })),
        dailyTrends: Array.from(trendMap.values()),
        histories: {
          linkedin: linkedinEvents.slice(0, 100),
          email: emailEvents.slice(0, 100),
          phone: phoneEvents.slice(0, 100),
          github: githubEvents.slice(0, 100),
          whatsapp: whatsappEvents.slice(0, 100),
          resume: events
            .filter(
              (e) =>
                e.eventName === 'resume_download_attempt' ||
                e.eventName === 'resume_download_success'
            )
            .slice(0, 100),
        },
        recentAll: events.slice(0, 150),
      });
    } catch (error) {
      console.error('GET /admin/activity error:', error);
      res.status(500).json({ error: 'Failed to load interaction activity.' });
    }
  });

  // Visitor Activity Logs & Session Timelines
  router.get('/visitors', async (req, res) => {
    try {
      const range = typeof req.query.range === 'string' ? req.query.range : '30d';
      const from = typeof req.query.from === 'string' ? req.query.from : undefined;
      const to = typeof req.query.to === 'string' ? req.query.to : undefined;
      const device = typeof req.query.device === 'string' ? req.query.device : 'all';
      const country = typeof req.query.country === 'string' ? req.query.country : 'all';
      const visitorType = typeof req.query.visitorType === 'string' ? req.query.visitorType : 'all';
      const landingPage = typeof req.query.landingPage === 'string' ? req.query.landingPage : '';

      const win = resolveDateRange(range, from, to);

      const conditions = [
        gte(visitorSessions.startedAt, win.start),
        lte(visitorSessions.startedAt, win.end),
      ];
      if (device !== 'all') {
        conditions.push(eq(visitorSessions.deviceCategory, device));
      }
      if (country !== 'all') {
        conditions.push(eq(visitorSessions.country, country));
      }
      if (visitorType === 'returning') {
        conditions.push(eq(visitorSessions.isReturning, true));
      } else if (visitorType === 'new') {
        conditions.push(eq(visitorSessions.isReturning, false));
      }
      if (landingPage.trim()) {
        conditions.push(ilike(visitorSessions.landingPage, `%${landingPage.trim()}%`));
      }

      const [sessions, countryRows] = await Promise.all([
        db
          .select()
          .from(visitorSessions)
          .where(and(...conditions))
          .orderBy(desc(visitorSessions.startedAt))
          .limit(300),
        db
          .selectDistinct({ country: visitorSessions.country })
          .from(visitorSessions)
          .where(
            and(gte(visitorSessions.startedAt, win.start), lte(visitorSessions.startedAt, win.end))
          ),
      ]);

      const visitorIds = Array.from(new Set(sessions.map((s) => s.visitorId).filter(Boolean)));
      const visitors =
        visitorIds.length > 0
          ? await db
              .select()
              .from(anonymousVisitors)
              .where(inArray(anonymousVisitors.visitorId, visitorIds))
          : [];

      const visitorMap = new Map(visitors.map((v) => [v.visitorId, v]));
      const countries = countryRows.map((r) => r.country).filter(Boolean);

      res.json({
        dateRange: { label: win.label },
        countries,
        sessions: sessions.map((s) => ({
          ...s,
          visitorFirstVisit: visitorMap.get(s.visitorId)?.firstVisitAt || s.startedAt,
          visitorLastVisit: visitorMap.get(s.visitorId)?.lastVisitAt || s.lastActivityAt,
          visitorTotalVisits: visitorMap.get(s.visitorId)?.visitCount || 1,
        })),
      });
    } catch (error) {
      console.error('GET /admin/visitors error:', error);
      res.status(500).json({ error: 'Failed to load visitor logs.' });
    }
  });

  router.get('/visitors/session/:sessionId', async (req, res) => {
    try {
      const sessionId = req.params.sessionId;
      const [sessionRows, timeline] = await Promise.all([
        db
          .select()
          .from(visitorSessions)
          .where(eq(visitorSessions.sessionId, sessionId))
          .limit(1),
        db
          .select()
          .from(analyticsEvents)
          .where(eq(analyticsEvents.sessionId, sessionId))
          .orderBy(asc(analyticsEvents.createdAt)),
      ]);
      if (!sessionRows[0]) {
        res.status(404).json({ error: 'Session not found.' });
        return;
      }
      res.json({ session: sessionRows[0], timeline });
    } catch (error) {
      console.error('GET /admin/visitors/session/:sessionId error:', error);
      res.status(500).json({ error: 'Failed to load session timeline.' });
    }
  });

  // Project Engagement Analytics
  router.get('/projects/analytics', async (req, res) => {
    try {
      const range = typeof req.query.range === 'string' ? req.query.range : '30d';
      const from = typeof req.query.from === 'string' ? req.query.from : undefined;
      const to = typeof req.query.to === 'string' ? req.query.to : undefined;
      const win = resolveDateRange(range, from, to);

      const [allProjects, events] = await Promise.all([
        db.select().from(projects).orderBy(asc(projects.displayOrder), asc(projects.id)),
        db
          .select()
          .from(analyticsEvents)
          .where(and(gte(analyticsEvents.createdAt, win.start), lte(analyticsEvents.createdAt, win.end))),
      ]);

      const stats = allProjects.map((proj) => {
        const projEvents = events.filter(
          (e) =>
            e.projectId === proj.slug ||
            e.projectId === String(proj.id) ||
            e.projectTitle === proj.title
        );

        const cardViews = projEvents.filter((e) => e.eventName === 'project_view').length;
        const detailViews = projEvents.filter((e) => e.eventName === 'project_detail_view').length;
        const githubClicks = projEvents.filter((e) => e.eventName === 'github_click').length;
        const liveDemoClicks = projEvents.filter(
          (e) => e.eventName === 'external_link_click' && e.targetCategory === 'live_demo'
        ).length;

        return {
          id: proj.id,
          slug: proj.slug,
          title: proj.title,
          category: proj.category,
          isPublished: proj.isPublished,
          cardViews,
          detailViews,
          githubClicks,
          liveDemoClicks,
          totalEngagement: cardViews + detailViews + githubClicks + liveDemoClicks,
        };
      });

      res.json({
        dateRange: { label: win.label },
        projects: stats.sort((a, b) => b.totalEngagement - a.totalEngagement),
      });
    } catch (error) {
      console.error('GET /admin/projects/analytics error:', error);
      res.status(500).json({ error: 'Failed to load project analytics.' });
    }
  });

  return router;
}
