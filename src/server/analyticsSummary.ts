import type { Request } from 'express';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { dailyAnalyticsSummary } from '../db/schema.ts';

export function getDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function parseUserAgentCategories(userAgent: string): {
  deviceCategory: 'mobile' | 'tablet' | 'desktop';
  browserCategory: string;
  osCategory: string;
} {
  const ua = userAgent.toLowerCase();

  let deviceCategory: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (/ipad|tablet|playbook|silk|(android(?!.*mobi))/i.test(ua)) {
    deviceCategory = 'tablet';
  } else if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    deviceCategory = 'mobile';
  }

  let browserCategory = 'Other';
  if (ua.includes('edg/')) browserCategory = 'Edge';
  else if (ua.includes('opr/') || ua.includes('opera')) browserCategory = 'Opera';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browserCategory = 'Chrome';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browserCategory = 'Safari';
  else if (ua.includes('firefox/')) browserCategory = 'Firefox';

  let osCategory = 'Other';
  if (ua.includes('windows')) osCategory = 'Windows';
  else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) osCategory = 'iOS';
  else if (ua.includes('mac os') || ua.includes('macintosh')) osCategory = 'macOS';
  else if (ua.includes('android')) osCategory = 'Android';
  else if (ua.includes('linux')) osCategory = 'Linux';

  return { deviceCategory, browserCategory, osCategory };
}

export function extractApproximateGeo(req: Request): {
  country: string;
  region: string;
  city: string;
} {
  const headerVal = (name: string): string => {
    const val = req.headers[name];
    return typeof val === 'string' ? val.trim().slice(0, 80) : '';
  };

  const country =
    headerVal('x-appengine-country') ||
    headerVal('cf-ipcountry') ||
    headerVal('x-vercel-ip-country') ||
    headerVal('x-country-code') ||
    'Unknown';

  const region =
    headerVal('x-appengine-region') ||
    headerVal('x-vercel-ip-country-region') ||
    '';

  const city =
    headerVal('x-appengine-city') ||
    headerVal('x-vercel-ip-city') ||
    '';

  return {
    country: country === 'ZZ' || !country ? 'Unknown' : country,
    region,
    city,
  };
}

export type SummaryCounterDelta = Partial<{
  totalVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  sessionsCount: number;
  linkedinClicks: number;
  emailClicks: number;
  phoneClicks: number;
  githubClicks: number;
  whatsappClicks: number;
  resumeDownloads: number;
  enquiriesCount: number;
  projectViews: number;
}>;

export async function incrementDailySummary(
  delta: SummaryCounterDelta,
  summaryDate: string = getDateKey()
): Promise<void> {
  try {
    await db
      .insert(dailyAnalyticsSummary)
      .values({
        summaryDate,
        totalVisitors: delta.totalVisitors ?? 0,
        uniqueVisitors: delta.uniqueVisitors ?? 0,
        pageViews: delta.pageViews ?? 0,
        sessionsCount: delta.sessionsCount ?? 0,
        linkedinClicks: delta.linkedinClicks ?? 0,
        emailClicks: delta.emailClicks ?? 0,
        phoneClicks: delta.phoneClicks ?? 0,
        githubClicks: delta.githubClicks ?? 0,
        whatsappClicks: delta.whatsappClicks ?? 0,
        resumeDownloads: delta.resumeDownloads ?? 0,
        enquiriesCount: delta.enquiriesCount ?? 0,
        projectViews: delta.projectViews ?? 0,
      })
      .onConflictDoUpdate({
        target: dailyAnalyticsSummary.summaryDate,
        set: {
          totalVisitors: sql`${dailyAnalyticsSummary.totalVisitors} + ${delta.totalVisitors ?? 0}`,
          uniqueVisitors: sql`${dailyAnalyticsSummary.uniqueVisitors} + ${delta.uniqueVisitors ?? 0}`,
          pageViews: sql`${dailyAnalyticsSummary.pageViews} + ${delta.pageViews ?? 0}`,
          sessionsCount: sql`${dailyAnalyticsSummary.sessionsCount} + ${delta.sessionsCount ?? 0}`,
          linkedinClicks: sql`${dailyAnalyticsSummary.linkedinClicks} + ${delta.linkedinClicks ?? 0}`,
          emailClicks: sql`${dailyAnalyticsSummary.emailClicks} + ${delta.emailClicks ?? 0}`,
          phoneClicks: sql`${dailyAnalyticsSummary.phoneClicks} + ${delta.phoneClicks ?? 0}`,
          githubClicks: sql`${dailyAnalyticsSummary.githubClicks} + ${delta.githubClicks ?? 0}`,
          whatsappClicks: sql`${dailyAnalyticsSummary.whatsappClicks} + ${delta.whatsappClicks ?? 0}`,
          resumeDownloads: sql`${dailyAnalyticsSummary.resumeDownloads} + ${delta.resumeDownloads ?? 0}`,
          enquiriesCount: sql`${dailyAnalyticsSummary.enquiriesCount} + ${delta.enquiriesCount ?? 0}`,
          projectViews: sql`${dailyAnalyticsSummary.projectViews} + ${delta.projectViews ?? 0}`,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.error('Failed to increment daily analytics summary:', err);
  }
}

export async function ensureSummaryRow(summaryDate: string): Promise<void> {
  const existing = await db
    .select({ id: dailyAnalyticsSummary.id })
    .from(dailyAnalyticsSummary)
    .where(eq(dailyAnalyticsSummary.summaryDate, summaryDate))
    .limit(1);
  if (existing.length === 0) {
    await db
      .insert(dailyAnalyticsSummary)
      .values({ summaryDate })
      .onConflictDoNothing({ target: dailyAnalyticsSummary.summaryDate });
  }
}
