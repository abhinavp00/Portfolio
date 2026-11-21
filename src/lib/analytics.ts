import type { AnalyticsEventName } from '../types/portfolio';

const VISITOR_KEY = 'ap_anon_visitor_id';
const SESSION_KEY = 'ap_session_id';
const CONSENT_KEY = 'ap_analytics_consent';

export type ConsentPreference = 'granted' | 'denied' | 'unset';

let analyticsEnabledInSettings = true;
let requireConsentInSettings = true;
const sessionDedupeCache = new Set<string>();
let sessionStartTimestamp = Date.now();

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}_${Date.now().toString(36)}`;
}

export function getConsentPreference(): ConsentPreference {
  if (typeof window === 'undefined') return 'unset';
  try {
    const val = window.localStorage.getItem(CONSENT_KEY);
    if (val === 'granted' || val === 'denied') return val;
    return 'unset';
  } catch {
    return 'unset';
  }
}

export function setConsentPreference(pref: 'granted' | 'denied'): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONSENT_KEY, pref);
  } catch {
    // Storage restricted
  }
}

export function configureAnalyticsPolicy(options: {
  enableAnalytics: boolean;
  requireCookieConsent: boolean;
}): void {
  analyticsEnabledInSettings = options.enableAnalytics;
  requireConsentInSettings = options.requireCookieConsent;
}

export function isTrackingPermitted(): boolean {
  if (!analyticsEnabledInSettings) return false;
  if (typeof window === 'undefined') return false;
  // Do not track admin dashboard routes as public portfolio visits
  if (window.location.pathname.startsWith('/admin')) return false;

  const pref = getConsentPreference();
  if (pref === 'denied') return false;
  if (requireConsentInSettings && pref !== 'granted') return false;
  return true;
}

export function getAnonymousVisitorId(): string {
  if (typeof window === 'undefined') return 'anon_ssr';
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = generateId('vis');
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return generateId('vis');
  }
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'sess_ssr';
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateId('sess');
      window.sessionStorage.setItem(SESSION_KEY, id);
      sessionStartTimestamp = Date.now();
    }
    return id;
  } catch {
    return generateId('sess');
  }
}

export function getDeviceCategory(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function getCampaignParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const val = params.get(key);
    if (val) result[key] = val.slice(0, 120);
  }
  return result;
}

export interface TrackEventOptions {
  source?: string;
  section?: string;
  destination?: string;
  projectId?: string;
  projectTitle?: string;
  dedupeKey?: string;
  metadata?: Record<string, string | number | boolean>;
}

export function trackEvent(
  eventName: AnalyticsEventName,
  options: TrackEventOptions = {}
): void {
  if (!isTrackingPermitted()) return;

  if (options.dedupeKey) {
    const key = `${eventName}:${options.dedupeKey}`;
    if (sessionDedupeCache.has(key)) return;
    sessionDedupeCache.add(key);
  }

  const payload = {
    eventId: generateId('evt'),
    visitorId: getAnonymousVisitorId(),
    sessionId: getSessionId(),
    eventName,
    pagePath: window.location.pathname || '/',
    sectionName: options.section || '',
    sourceLabel: options.source || '',
    targetCategory: options.destination || '',
    projectId: options.projectId || '',
    projectTitle: options.projectTitle || '',
    deviceCategory: getDeviceCategory(),
    referrer: document.referrer ? document.referrer.slice(0, 500) : '',
    campaignParams: getCampaignParams(),
    metadata: options.metadata || {},
  };

  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const queued = navigator.sendBeacon('/api/analytics/event', blob);
      if (queued) return;
    }
  } catch {
    // Fallback to fetch keepalive
  }

  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Silent failure for telemetry so user UX is never disrupted
  });
}

export function sendSessionHeartbeat(): void {
  if (!isTrackingPermitted()) return;
  const elapsedSeconds = Math.max(
    1,
    Math.min(14400, Math.round((Date.now() - sessionStartTimestamp) / 1000))
  );
  const body = JSON.stringify({
    visitorId: getAnonymousVisitorId(),
    sessionId: getSessionId(),
    durationSeconds: elapsedSeconds,
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/heartbeat', blob);
      return;
    }
  } catch {
    // Fallback
  }

  fetch('/api/analytics/heartbeat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}
