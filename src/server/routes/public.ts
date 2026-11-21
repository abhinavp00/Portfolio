import crypto from 'crypto';
import { Router } from 'express';
import { asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import {
  analyticsEvents,
  anonymousVisitors,
  certifications,
  contactInformation,
  education,
  enquiries,
  enquiryStatusHistory,
  mediaAssets,
  portfolioProfile,
  portfolioSettings,
  professionalExperience,
  projects,
  resumeFiles,
  services,
  skillCategories,
  skills,
  visitorSessions,
} from '../../db/schema.ts';
import { ensureDatabaseSeeded } from '../seed.ts';
import { createRateLimiter } from '../rateLimit.ts';
import {
  extractApproximateGeo,
  incrementDailySummary,
  parseUserAgentCategories,
} from '../analyticsSummary.ts';
import { broadcastActivity } from '../realtime.ts';
import { verifyStoredResumeBuffer } from '../resumeProcessor.ts';

const ALLOWED_EVENTS = new Set([
  'page_view',
  'session_start',
  'section_view',
  'project_view',
  'project_detail_view',
  'github_click',
  'linkedin_click',
  'email_click',
  'phone_click',
  'whatsapp_click',
  'resume_download_attempt',
  'resume_download_success',
  'contact_form_start',
  'contact_form_submit',
  'contact_form_success',
  'contact_form_error',
  'external_link_click',
]);

const ALLOWED_CATEGORIES = new Set([
  'Job Opportunity',
  'Internship Opportunity',
  'Freelance Project',
  'Website Development',
  'Data Analytics',
  'Collaboration',
  'General Enquiry',
  'Other',
]);

const enquiryLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  label: 'enquiry',
});

const analyticsLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 150,
  label: 'analytics',
});

export function createPublicRouter(): Router {
  const router = Router();

  // Synchronized Public Portfolio Bundle
  router.get('/portfolio/public', async (_req, res) => {
    try {
      await ensureDatabaseSeeded();

      const [
        profileRows,
        experienceRows,
        projectRows,
        categoryRows,
        skillRows,
        serviceRows,
        educationRows,
        certificationRows,
        contactRows,
        settingsRows,
        activeResumeRows,
      ] = await Promise.all([
        db.select().from(portfolioProfile).limit(1),
        db
          .select()
          .from(professionalExperience)
          .where(eq(professionalExperience.isPublished, true))
          .orderBy(asc(professionalExperience.displayOrder), asc(professionalExperience.id)),
        db
          .select()
          .from(projects)
          .where(eq(projects.isPublished, true))
          .orderBy(asc(projects.displayOrder), asc(projects.id)),
        db
          .select()
          .from(skillCategories)
          .where(eq(skillCategories.isPublished, true))
          .orderBy(asc(skillCategories.displayOrder), asc(skillCategories.id)),
        db
          .select()
          .from(skills)
          .where(eq(skills.isEnabled, true))
          .orderBy(asc(skills.displayOrder), asc(skills.id)),
        db
          .select()
          .from(services)
          .where(eq(services.isPublished, true))
          .orderBy(asc(services.displayOrder), asc(services.id)),
        db
          .select()
          .from(education)
          .where(eq(education.isPublished, true))
          .orderBy(asc(education.displayOrder), asc(education.id)),
        db
          .select()
          .from(certifications)
          .where(eq(certifications.isPublished, true))
          .orderBy(asc(certifications.displayOrder), asc(certifications.id)),
        db.select().from(contactInformation).limit(1),
        db.select().from(portfolioSettings).limit(1),
        db
          .select({
            id: resumeFiles.id,
            versionNumber: resumeFiles.versionNumber,
            fileName: resumeFiles.fileName,
            fileFormat: resumeFiles.fileFormat,
            mimeType: resumeFiles.mimeType,
            fileSizeBytes: resumeFiles.fileSizeBytes,
            sha256Hash: resumeFiles.sha256Hash,
            isActive: resumeFiles.isActive,
            uploadedByEmail: resumeFiles.uploadedByEmail,
            createdAt: resumeFiles.createdAt,
            updatedAt: resumeFiles.updatedAt,
          })
          .from(resumeFiles)
          .where(eq(resumeFiles.isActive, true))
          .orderBy(desc(resumeFiles.versionNumber))
          .limit(1),
      ]);

      const skillsByCategory = new Map<number, typeof skillRows>();
      for (const s of skillRows) {
        const list = skillsByCategory.get(s.categoryId) || [];
        list.push(s);
        skillsByCategory.set(s.categoryId, list);
      }

      const enrichedCategories = categoryRows.map((cat) => ({
        ...cat,
        skills: skillsByCategory.get(cat.id) || [],
      }));

      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.json({
        profile: profileRows[0] || null,
        experiences: experienceRows,
        projects: projectRows,
        skillCategories: enrichedCategories,
        services: serviceRows,
        education: educationRows,
        certifications: certificationRows,
        contact: contactRows[0] || null,
        settings: settingsRows[0] || null,
        activeResume: activeResumeRows[0] || null,
      });
    } catch (error) {
      console.error('Error loading public portfolio:', error);
      res.status(500).json({ error: 'Unable to load portfolio content right now.' });
    }
  });

  // Active Resume Metadata
  router.get('/resume/active', async (_req, res) => {
    try {
      await ensureDatabaseSeeded();
      const rows = await db
        .select({
          id: resumeFiles.id,
          versionNumber: resumeFiles.versionNumber,
          fileName: resumeFiles.fileName,
          fileFormat: resumeFiles.fileFormat,
          mimeType: resumeFiles.mimeType,
          fileSizeBytes: resumeFiles.fileSizeBytes,
          sha256Hash: resumeFiles.sha256Hash,
          isActive: resumeFiles.isActive,
          createdAt: resumeFiles.createdAt,
          updatedAt: resumeFiles.updatedAt,
        })
        .from(resumeFiles)
        .where(eq(resumeFiles.isActive, true))
        .orderBy(desc(resumeFiles.versionNumber))
        .limit(1);

      res.setHeader('Cache-Control', 'no-store');
      if (!rows[0]) {
        res.status(404).json({ error: 'No active resume is currently published.' });
        return;
      }
      res.json(rows[0]);
    } catch (error) {
      console.error('Error fetching active resume metadata:', error);
      res.status(500).json({ error: 'Failed to check active resume.' });
    }
  });

  // Active Resume Stream (Database-backed original format & filename, never stale cached)
  router.get('/resume/download', async (req, res) => {
    try {
      await ensureDatabaseSeeded();
      const rows = await db
        .select()
        .from(resumeFiles)
        .where(eq(resumeFiles.isActive, true))
        .orderBy(desc(resumeFiles.versionNumber))
        .limit(1);

      const active = rows[0];
      if (!active) {
        res.status(404).json({ error: 'No active resume file is available for download.' });
        return;
      }

      const buffer = Buffer.from(active.fileDataBase64, 'base64');
      const format = active.fileFormat || 'PDF';
      if (!verifyStoredResumeBuffer(buffer, format)) {
        res.status(500).json({ error: 'Stored resume file failed integrity check.' });
        return;
      }

      const safeFileName = active.fileName.replace(/["\\/\r\n]/g, '_');
      const isInline = req.query.inline === '1' && format.toUpperCase() === 'PDF';

      res.setHeader('Content-Type', active.mimeType || 'application/octet-stream');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader(
        'Content-Disposition',
        `${isInline ? 'inline' : 'attachment'}; filename="${safeFileName}"`
      );
      res.setHeader('Content-Length', String(buffer.length));
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Record successful server file delivery ONLY if visitor consent & analytics permit (passed via query)
      const shouldTrack = !isInline && req.query.track === '1';
      const visitorId =
        typeof req.query.vid === 'string' ? req.query.vid.slice(0, 64) : '';
      const sessionId =
        typeof req.query.sid === 'string' ? req.query.sid.slice(0, 64) : '';
      const sourceLabel =
        typeof req.query.src === 'string' ? req.query.src.slice(0, 64) : 'portfolio';

      res.status(200).send(buffer);

      if (shouldTrack && visitorId && sessionId) {
        const uaInfo = parseUserAgentCategories(req.headers['user-agent'] || '');
        const eventId = `evt_${crypto.randomUUID()}`;
        const now = new Date();
        db.insert(analyticsEvents)
          .values({
            eventId,
            visitorId,
            sessionId,
            eventName: 'resume_download_success',
            pagePath: '/',
            sectionName: sourceLabel,
            sourceLabel,
            targetCategory: `resume_${format.toLowerCase()}`,
            deviceCategory: uaInfo.deviceCategory,
            metadata: {
              resumeId: active.id,
              versionNumber: active.versionNumber,
              fileName: active.fileName,
              fileFormat: format,
            },
            createdAt: now,
          })
          .then(async () => {
            await incrementDailySummary({ resumeDownloads: 1 });
            broadcastActivity({
              eventId,
              eventName: 'resume_download_success',
              pagePath: '/',
              sectionName: sourceLabel,
              sourceLabel,
              projectTitle: active.fileName,
              deviceCategory: uaInfo.deviceCategory,
              createdAt: now.toISOString(),
            });
          })
          .catch((err) => console.error('Failed to record resume_download_success:', err));
      }
    } catch (error) {
      console.error('Error streaming active resume:', error);
      res.status(500).json({ error: 'Unable to download resume right now.' });
    }
  });

  // Media Asset Serving (uploaded icons, certificates, images)
  router.get('/media/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid media ID.' });
        return;
      }

      const rows = await db
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.id, id))
        .limit(1);

      const asset = rows[0];
      if (!asset) {
        res.status(404).json({ error: 'Media asset not found.' });
        return;
      }

      const buffer = Buffer.from(asset.dataBase64, 'base64');
      res.setHeader('Content-Type', asset.mimeType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Length', String(buffer.length));
      res.setHeader('Cache-Control', 'public, max-age=3600');
      if (asset.mimeType === 'image/svg+xml') {
        res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
      }
      if (asset.mimeType === 'application/pdf') {
        const safeName = asset.fileName.replace(/["\\/\r\n]/g, '_');
        const inline = req.query.download !== '1';
        res.setHeader(
          'Content-Disposition',
          `${inline ? 'inline' : 'attachment'}; filename="${safeName}"`
        );
      }
      res.status(200).send(buffer);
    } catch (error) {
      console.error('Error serving media asset:', error);
      res.status(500).json({ error: 'Unable to serve media asset.' });
    }
  });

  // Public Contact Form Enquiry Submission
  router.post('/enquiries', enquiryLimiter, async (req, res) => {
    try {
      await ensureDatabaseSeeded();
      const body = req.body ?? {};
      const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim() : '';
      const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 32) : '';
      const categoryRaw = typeof body.category === 'string' ? body.category.trim() : 'General Enquiry';
      const category = ALLOWED_CATEGORIES.has(categoryRaw) ? categoryRaw : 'Other';
      const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
      const message = typeof body.message === 'string' ? body.message.trim() : '';
      const sourcePage =
        typeof body.sourcePage === 'string' ? body.sourcePage.slice(0, 120) : '/';
      const referrer =
        typeof body.referrer === 'string' ? body.referrer.slice(0, 300) : '';
      const campaignSource =
        typeof body.campaignSource === 'string' ? body.campaignSource.slice(0, 120) : '';

      if (fullName.length < 2 || fullName.length > 120) {
        res.status(400).json({ error: 'Please enter a valid full name (2–120 characters).' });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email) || email.length > 160) {
        res.status(400).json({ error: 'Please provide a valid email address.' });
        return;
      }
      if (subject.length < 3 || subject.length > 200) {
        res.status(400).json({ error: 'Please enter a subject (3–200 characters).' });
        return;
      }
      if (message.length < 10 || message.length > 5000) {
        res.status(400).json({ error: 'Please enter a message (10–5000 characters).' });
        return;
      }

      const uaInfo = parseUserAgentCategories(req.headers['user-agent'] || '');
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
      const enquiryCode = `ENQ-${dateStr}-${randomSuffix}`;

      const inserted = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(enquiries)
          .values({
            enquiryCode,
            fullName,
            email,
            phone,
            category,
            subject,
            message,
            status: 'new',
            isImportant: false,
            sourcePage,
            referrer,
            campaignSource,
            deviceCategory: uaInfo.deviceCategory,
          })
          .returning();

        await tx.insert(enquiryStatusHistory).values({
          enquiryId: created.id,
          previousStatus: null,
          newStatus: 'new',
          changedByEmail: 'public_visitor',
        });

        return created;
      });

      await incrementDailySummary({ enquiriesCount: 1 });

      // Broadcast safe real-time alert without exposing visitor message content in analytics
      broadcastActivity({
        eventId: `enq_${inserted.enquiryCode}`,
        eventName: 'contact_form_success',
        pagePath: sourcePage,
        sectionName: 'contact',
        sourceLabel: category,
        projectTitle: enquiryCode,
        deviceCategory: uaInfo.deviceCategory,
        createdAt: inserted.createdAt.toISOString(),
      });

      res.status(201).json({
        ok: true,
        enquiryCode: inserted.enquiryCode,
        createdAt: inserted.createdAt,
      });
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      res.status(500).json({ error: 'Failed to submit your enquiry. Please try again.' });
    }
  });

  // Centralized Analytics Event Collection
  router.post('/analytics/event', analyticsLimiter, async (req, res) => {
    try {
      await ensureDatabaseSeeded();
      const settingsRows = await db.select().from(portfolioSettings).limit(1);
      if (settingsRows[0] && !settingsRows[0].enableAnalytics) {
        res.status(202).json({ tracked: false, reason: 'analytics_disabled' });
        return;
      }

      const body = req.body ?? {};
      const eventName = typeof body.eventName === 'string' ? body.eventName.trim() : '';
      if (!ALLOWED_EVENTS.has(eventName)) {
        res.status(400).json({ error: 'Unsupported analytics event type.' });
        return;
      }

      const visitorId =
        typeof body.visitorId === 'string' && body.visitorId.trim()
          ? body.visitorId.trim().slice(0, 80)
          : '';
      const sessionId =
        typeof body.sessionId === 'string' && body.sessionId.trim()
          ? body.sessionId.trim().slice(0, 80)
          : '';

      if (!visitorId || !sessionId) {
        res.status(400).json({ error: 'visitorId and sessionId are required.' });
        return;
      }

      const eventId =
        typeof body.eventId === 'string' && body.eventId.trim()
          ? body.eventId.trim().slice(0, 80)
          : `evt_${crypto.randomUUID()}`;
      const pagePath =
        typeof body.pagePath === 'string' ? body.pagePath.slice(0, 120) : '/';
      const sectionName =
        typeof body.sectionName === 'string' ? body.sectionName.slice(0, 80) : '';
      const sourceLabel =
        typeof body.sourceLabel === 'string' ? body.sourceLabel.slice(0, 80) : '';
      const targetCategory =
        typeof body.targetCategory === 'string' ? body.targetCategory.slice(0, 80) : '';
      const projectId =
        typeof body.projectId === 'string' ? body.projectId.slice(0, 80) : '';
      const projectTitle =
        typeof body.projectTitle === 'string' ? body.projectTitle.slice(0, 120) : '';
      const referrer =
        typeof body.referrer === 'string' ? body.referrer.slice(0, 300) : '';

      const campaignParamsRaw =
        body.campaignParams && typeof body.campaignParams === 'object'
          ? (body.campaignParams as Record<string, unknown>)
          : {};
      const campaignParams: Record<string, string> = {};
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
        const val = campaignParamsRaw[key];
        if (typeof val === 'string' && val.trim()) {
          campaignParams[key] = val.trim().slice(0, 100);
        }
      }

      // Whitelist non-sensitive metadata keys only
      const rawMeta =
        body.metadata && typeof body.metadata === 'object'
          ? (body.metadata as Record<string, unknown>)
          : {};
      const safeMeta: Record<string, string | number | boolean> = {};
      for (const [k, v] of Object.entries(rawMeta)) {
        if (['password', 'email', 'phone', 'message', 'token'].includes(k.toLowerCase())) continue;
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          safeMeta[k.slice(0, 40)] = typeof v === 'string' ? v.slice(0, 120) : v;
        }
      }

      const uaInfo = parseUserAgentCategories(req.headers['user-agent'] || '');
      const deviceCategory =
        body.deviceCategory === 'mobile' ||
        body.deviceCategory === 'tablet' ||
        body.deviceCategory === 'desktop'
          ? body.deviceCategory
          : uaInfo.deviceCategory;

      const geo = extractApproximateGeo(req);
      const now = new Date();

      // Check existing visitor & session
      const existingVisitorRows = await db
        .select()
        .from(anonymousVisitors)
        .where(eq(anonymousVisitors.visitorId, visitorId))
        .limit(1);

      const isNewVisitor = existingVisitorRows.length === 0;
      const isReturningVisitor = !isNewVisitor;

      if (isNewVisitor) {
        await db
          .insert(anonymousVisitors)
          .values({
            visitorId,
            firstVisitAt: now,
            lastVisitAt: now,
            visitCount: 1,
            deviceCategory,
            browserCategory: uaInfo.browserCategory,
            osCategory: uaInfo.osCategory,
            country: geo.country,
            region: geo.region,
            city: geo.city,
          })
          .onConflictDoNothing({ target: anonymousVisitors.visitorId });
      } else {
        await db
          .update(anonymousVisitors)
          .set({
            lastVisitAt: now,
            deviceCategory,
            browserCategory: uaInfo.browserCategory,
            osCategory: uaInfo.osCategory,
            ...(geo.country !== 'Unknown' ? { country: geo.country } : {}),
            ...(geo.region ? { region: geo.region } : {}),
            ...(geo.city ? { city: geo.city } : {}),
          })
          .where(eq(anonymousVisitors.visitorId, visitorId));
      }

      const existingSessionRows = await db
        .select()
        .from(visitorSessions)
        .where(eq(visitorSessions.sessionId, sessionId))
        .limit(1);

      const isNewSession = existingSessionRows.length === 0;
      if (isNewSession) {
        if (!isNewVisitor) {
          await db
            .update(anonymousVisitors)
            .set({ visitCount: sql`${anonymousVisitors.visitCount} + 1` })
            .where(eq(anonymousVisitors.visitorId, visitorId));
        }

        await db
          .insert(visitorSessions)
          .values({
            sessionId,
            visitorId,
            startedAt: now,
            lastActivityAt: now,
            durationSeconds: 0,
            pageViewsCount: eventName === 'page_view' ? 1 : 0,
            eventsCount: 1,
            isReturning: isReturningVisitor,
            landingPage: pagePath,
            referrer,
            campaignSource: campaignParams.utm_source || '',
            deviceCategory,
            browserCategory: uaInfo.browserCategory,
            osCategory: uaInfo.osCategory,
            country: geo.country,
            region: geo.region,
            city: geo.city,
          })
          .onConflictDoNothing({ target: visitorSessions.sessionId });
      } else {
        const startedAtMs = existingSessionRows[0].startedAt.getTime();
        const computedDuration = Math.max(
          existingSessionRows[0].durationSeconds,
          Math.min(14400, Math.round((now.getTime() - startedAtMs) / 1000))
        );

        await db
          .update(visitorSessions)
          .set({
            lastActivityAt: now,
            durationSeconds: computedDuration,
            pageViewsCount:
              eventName === 'page_view'
                ? sql`${visitorSessions.pageViewsCount} + 1`
                : existingSessionRows[0].pageViewsCount,
            eventsCount: sql`${visitorSessions.eventsCount} + 1`,
          })
          .where(eq(visitorSessions.sessionId, sessionId));
      }

      const insertedEvent = await db
        .insert(analyticsEvents)
        .values({
          eventId,
          visitorId,
          sessionId,
          eventName,
          pagePath,
          sectionName,
          sourceLabel,
          targetCategory,
          projectId,
          projectTitle,
          deviceCategory,
          referrer,
          campaignParams,
          metadata: safeMeta,
          createdAt: now,
        })
        .onConflictDoNothing({ target: analyticsEvents.eventId })
        .returning();

      if (insertedEvent.length > 0) {
        await incrementDailySummary({
          totalVisitors: isNewSession ? 1 : 0,
          uniqueVisitors: isNewVisitor ? 1 : 0,
          sessionsCount: isNewSession ? 1 : 0,
          pageViews: eventName === 'page_view' ? 1 : 0,
          linkedinClicks: eventName === 'linkedin_click' ? 1 : 0,
          emailClicks: eventName === 'email_click' ? 1 : 0,
          phoneClicks: eventName === 'phone_click' ? 1 : 0,
          githubClicks: eventName === 'github_click' ? 1 : 0,
          whatsappClicks: eventName === 'whatsapp_click' ? 1 : 0,
          projectViews:
            eventName === 'project_view' || eventName === 'project_detail_view' ? 1 : 0,
        });

        broadcastActivity({
          eventId,
          eventName,
          pagePath,
          sectionName,
          sourceLabel,
          projectTitle,
          deviceCategory,
          createdAt: now.toISOString(),
        });
      }

      res.status(201).json({ tracked: true, eventId });
    } catch (error) {
      console.error('Analytics event ingestion failed:', error);
      res.status(500).json({ error: 'Unable to record event.' });
    }
  });

  // Session engagement heartbeat
  router.post('/analytics/heartbeat', analyticsLimiter, async (req, res) => {
    try {
      const body = req.body ?? {};
      const sessionId =
        typeof body.sessionId === 'string' ? body.sessionId.trim().slice(0, 80) : '';
      const durationSeconds = Number(body.durationSeconds);

      if (!sessionId || !Number.isFinite(durationSeconds) || durationSeconds < 0) {
        res.status(400).json({ error: 'Invalid heartbeat payload.' });
        return;
      }

      const clamped = Math.min(14400, Math.round(durationSeconds));
      await db
        .update(visitorSessions)
        .set({
          lastActivityAt: new Date(),
          durationSeconds: sql`GREATEST(${visitorSessions.durationSeconds}, ${clamped})`,
        })
        .where(eq(visitorSessions.sessionId, sessionId));

      res.json({ ok: true });
    } catch (error) {
      console.error('Heartbeat update error:', error);
      res.status(500).json({ error: 'Heartbeat failed.' });
    }
  });

  return router;
}
