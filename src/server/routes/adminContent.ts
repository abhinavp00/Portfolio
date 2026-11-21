import crypto from 'crypto';
import { Router } from 'express';
import multer from 'multer';
import { asc, desc, eq, max, sql } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import {
  adminSessions,
  adminUsers,
  analyticsEvents,
  certifications,
  contactInformation,
  education,
  mediaAssets,
  portfolioProfile,
  portfolioSettings,
  professionalExperience,
  projects,
  resumeFiles,
  services,
  skillCategories,
  skills,
} from '../../db/schema.ts';
import type { AdminAuthRequest } from '../auth.ts';
import { ensureDatabaseSeeded } from '../seed.ts';
import {
  MAX_RESUME_FILE_BYTES,
  processResumeUpload,
  ResumeValidationError,
} from '../resumeProcessor.ts';

const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_FILE_BYTES },
});

const uploadMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
});

const ALLOWED_MEDIA_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
]);

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || `item-${Date.now()}`
  );
}

function parsePositiveId(raw: unknown): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parsePositiveIdList(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(Number).filter((id) => Number.isInteger(id) && id > 0);
}

function validateMediaBuffer(buffer: Buffer, mimeType: string): string | null {
  if (!buffer || buffer.length === 0) {
    return 'Uploaded file is empty.';
  }
  switch (mimeType) {
    case 'application/pdf': {
      if (buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
        return 'Uploaded file is not a valid PDF document.';
      }
      return null;
    }
    case 'image/png': {
      const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      if (buffer.length < 8 || !buffer.subarray(0, 8).equals(pngSig)) {
        return 'Uploaded file is not a valid PNG image.';
      }
      return null;
    }
    case 'image/jpeg': {
      if (buffer.length < 3 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
        return 'Uploaded file is not a valid JPEG image.';
      }
      return null;
    }
    case 'image/webp': {
      if (
        buffer.length < 12 ||
        buffer.subarray(0, 4).toString('ascii') !== 'RIFF' ||
        buffer.subarray(8, 12).toString('ascii') !== 'WEBP'
      ) {
        return 'Uploaded file is not a valid WEBP image.';
      }
      return null;
    }
    case 'image/svg+xml': {
      const svgText = buffer.toString('utf8');
      if (!/<svg\b/i.test(svgText)) {
        return 'Uploaded SVG does not contain a valid <svg> root element.';
      }
      if (
        /<script\b/i.test(svgText) ||
        /\bon[a-z]+\s*=/i.test(svgText) ||
        /javascript\s*:/i.test(svgText) ||
        /<foreignObject\b/i.test(svgText)
      ) {
        return 'SVG files containing scripts or event handlers are not permitted.';
      }
      return null;
    }
    default:
      return 'Unsupported file type.';
  }
}

export function createAdminContentRouter(): Router {
  const router = Router();

  // Current Authenticated Admin User
  router.get('/me', (req: AdminAuthRequest, res) => {
    res.json({ user: req.adminUser });
  });

  // ---------------- PROFILE ----------------
  router.get('/profile', async (_req, res) => {
    try {
      await ensureDatabaseSeeded();
      const rows = await db.select().from(portfolioProfile).limit(1);
      res.json(rows[0] || null);
    } catch (error) {
      console.error('GET /admin/profile error:', error);
      res.status(500).json({ error: 'Failed to load profile.' });
    }
  });

  router.put('/profile', async (req, res) => {
    try {
      await ensureDatabaseSeeded();
      const body = req.body ?? {};
      const existing = await db.select().from(portfolioProfile).limit(1);
      if (!existing[0]) {
        res.status(404).json({ error: 'Profile record not found.' });
        return;
      }

      const [updated] = await db
        .update(portfolioProfile)
        .set({
          fullName: typeof body.fullName === 'string' ? body.fullName.trim() : existing[0].fullName,
          jobTitle: typeof body.jobTitle === 'string' ? body.jobTitle.trim() : existing[0].jobTitle,
          secondaryJobTitle:
            typeof body.secondaryJobTitle === 'string'
              ? body.secondaryJobTitle.trim()
              : existing[0].secondaryJobTitle,
          profileImageUrl:
            typeof body.profileImageUrl === 'string'
              ? body.profileImageUrl.trim()
              : existing[0].profileImageUrl,
          location: typeof body.location === 'string' ? body.location.trim() : existing[0].location,
          availabilityLabel:
            typeof body.availabilityLabel === 'string'
              ? body.availabilityLabel.trim()
              : existing[0].availabilityLabel,
          availabilityStatus:
            typeof body.availabilityStatus === 'string'
              ? body.availabilityStatus.trim()
              : existing[0].availabilityStatus,
          greeting: typeof body.greeting === 'string' ? body.greeting.trim() : existing[0].greeting,
          heroHeading:
            typeof body.heroHeading === 'string' ? body.heroHeading.trim() : existing[0].heroHeading,
          heroDescription:
            typeof body.heroDescription === 'string'
              ? body.heroDescription.trim()
              : existing[0].heroDescription,
          heroHighlights: Array.isArray(body.heroHighlights)
            ? body.heroHighlights.map(String)
            : existing[0].heroHighlights,
          focusAreas: Array.isArray(body.focusAreas)
            ? body.focusAreas.map(String)
            : existing[0].focusAreas,
          aboutSectionLabel:
            typeof body.aboutSectionLabel === 'string'
              ? body.aboutSectionLabel.trim()
              : existing[0].aboutSectionLabel,
          aboutHeading:
            typeof body.aboutHeading === 'string'
              ? body.aboutHeading.trim()
              : existing[0].aboutHeading,
          aboutDescription:
            typeof body.aboutDescription === 'string'
              ? body.aboutDescription.trim()
              : existing[0].aboutDescription,
          aboutParagraphs: Array.isArray(body.aboutParagraphs)
            ? body.aboutParagraphs.map(String).filter((p: string) => p.trim().length > 0)
            : existing[0].aboutParagraphs,
          professionalSummary:
            typeof body.professionalSummary === 'string'
              ? body.professionalSummary.trim()
              : existing[0].professionalSummary,
          careerObjective:
            typeof body.careerObjective === 'string'
              ? body.careerObjective.trim()
              : existing[0].careerObjective,
          professionalHighlights: Array.isArray(body.professionalHighlights)
            ? body.professionalHighlights
            : existing[0].professionalHighlights,
          personalInfo: Array.isArray(body.personalInfo)
            ? body.personalInfo
            : existing[0].personalInfo,
          isPublished:
            typeof body.isPublished === 'boolean' ? body.isPublished : existing[0].isPublished,
          updatedAt: new Date(),
        })
        .where(eq(portfolioProfile.id, existing[0].id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error('PUT /admin/profile error:', error);
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  });

  // ---------------- EXPERIENCE ----------------
  router.get('/experience', async (_req, res) => {
    try {
      await ensureDatabaseSeeded();
      const rows = await db
        .select()
        .from(professionalExperience)
        .orderBy(asc(professionalExperience.displayOrder), asc(professionalExperience.id));
      res.json(rows);
    } catch (error) {
      console.error('GET /admin/experience error:', error);
      res.status(500).json({ error: 'Failed to load experience entries.' });
    }
  });

  router.post('/experience', async (req, res) => {
    try {
      const b = req.body ?? {};
      if (!b.companyName || !b.jobTitle) {
        res.status(400).json({ error: 'Company name and job title are required.' });
        return;
      }
      const existing = await db.select({ id: professionalExperience.id }).from(professionalExperience);
      const nextOrder = existing.length + 1;
      const slug = `${slugify(`${b.companyName}-${b.jobTitle}`)}-${Date.now().toString(36)}`;
      const periodLabel =
        typeof b.periodLabel === 'string' && b.periodLabel.trim()
          ? b.periodLabel.trim()
          : [b.startDate, b.isCurrent ? 'Present' : b.endDate].filter(Boolean).join(' – ');

      const [created] = await db
        .insert(professionalExperience)
        .values({
          slug,
          indexLabel:
            typeof b.indexLabel === 'string' && b.indexLabel.trim()
              ? b.indexLabel.trim()
              : String(nextOrder).padStart(2, '0'),
          companyName: String(b.companyName).trim(),
          jobTitle: String(b.jobTitle).trim(),
          location: String(b.location || '').trim(),
          employmentType: String(b.employmentType || 'Internship').trim(),
          startDate: String(b.startDate || '').trim(),
          endDate: String(b.endDate || '').trim(),
          periodLabel,
          isCurrent: Boolean(b.isCurrent),
          responsibilities: Array.isArray(b.responsibilities) ? b.responsibilities.map(String) : [],
          achievements: Array.isArray(b.achievements) ? b.achievements.map(String) : [],
          technologies: Array.isArray(b.technologies) ? b.technologies.map(String) : [],
          companyLogoUrl: String(b.companyLogoUrl || '').trim(),
          displayOrder: typeof b.displayOrder === 'number' ? b.displayOrder : nextOrder,
          isPublished: b.isPublished !== false,
        })
        .returning();

      res.status(201).json(created);
    } catch (error) {
      console.error('POST /admin/experience error:', error);
      res.status(500).json({ error: 'Failed to create experience entry.' });
    }
  });

  router.put('/experience/:id', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid experience ID.' });
        return;
      }
      const b = req.body ?? {};
      const periodLabel =
        typeof b.periodLabel === 'string'
          ? b.periodLabel.trim()
          : [b.startDate, b.isCurrent ? 'Present' : b.endDate].filter(Boolean).join(' – ');

      const [updated] = await db
        .update(professionalExperience)
        .set({
          ...(b.indexLabel !== undefined ? { indexLabel: String(b.indexLabel) } : {}),
          ...(b.companyName !== undefined ? { companyName: String(b.companyName).trim() } : {}),
          ...(b.jobTitle !== undefined ? { jobTitle: String(b.jobTitle).trim() } : {}),
          ...(b.location !== undefined ? { location: String(b.location).trim() } : {}),
          ...(b.employmentType !== undefined ? { employmentType: String(b.employmentType).trim() } : {}),
          ...(b.startDate !== undefined ? { startDate: String(b.startDate).trim() } : {}),
          ...(b.endDate !== undefined ? { endDate: String(b.endDate).trim() } : {}),
          ...(periodLabel !== undefined ? { periodLabel } : {}),
          ...(typeof b.isCurrent === 'boolean' ? { isCurrent: b.isCurrent } : {}),
          ...(Array.isArray(b.responsibilities) ? { responsibilities: b.responsibilities.map(String) } : {}),
          ...(Array.isArray(b.achievements) ? { achievements: b.achievements.map(String) } : {}),
          ...(Array.isArray(b.technologies) ? { technologies: b.technologies.map(String) } : {}),
          ...(b.companyLogoUrl !== undefined ? { companyLogoUrl: String(b.companyLogoUrl).trim() } : {}),
          ...(typeof b.displayOrder === 'number' ? { displayOrder: b.displayOrder } : {}),
          ...(typeof b.isPublished === 'boolean' ? { isPublished: b.isPublished } : {}),
          updatedAt: new Date(),
        })
        .where(eq(professionalExperience.id, id))
        .returning();

      if (!updated) {
        res.status(404).json({ error: 'Experience entry not found.' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error('PUT /admin/experience/:id error:', error);
      res.status(500).json({ error: 'Failed to update experience entry.' });
    }
  });

  router.delete('/experience/:id', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid experience ID.' });
        return;
      }
      const deleted = await db
        .delete(professionalExperience)
        .where(eq(professionalExperience.id, id))
        .returning({ id: professionalExperience.id });
      if (deleted.length === 0) {
        res.status(404).json({ error: 'Experience entry not found.' });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /admin/experience/:id error:', error);
      res.status(500).json({ error: 'Failed to delete experience entry.' });
    }
  });

  router.post('/experience/reorder', async (req, res) => {
    try {
      const ids = parsePositiveIdList(req.body?.ids);
      if (ids.length === 0) {
        res.status(400).json({ error: 'Valid experience IDs are required for reordering.' });
        return;
      }
      await db.transaction(async (tx) => {
        for (let i = 0; i < ids.length; i++) {
          await tx
            .update(professionalExperience)
            .set({
              displayOrder: i + 1,
              indexLabel: String(i + 1).padStart(2, '0'),
              updatedAt: new Date(),
            })
            .where(eq(professionalExperience.id, ids[i]));
        }
      });
      res.json({ ok: true });
    } catch (error) {
      console.error('POST /admin/experience/reorder error:', error);
      res.status(500).json({ error: 'Failed to reorder experience entries.' });
    }
  });

  // ---------------- PROJECTS ----------------
  router.get('/projects', async (_req, res) => {
    try {
      await ensureDatabaseSeeded();
      const rows = await db
        .select()
        .from(projects)
        .orderBy(asc(projects.displayOrder), asc(projects.id));
      res.json(rows);
    } catch (error) {
      console.error('GET /admin/projects error:', error);
      res.status(500).json({ error: 'Failed to load projects.' });
    }
  });

  router.post('/projects', async (req, res) => {
    try {
      const b = req.body ?? {};
      if (!b.title || !b.description) {
        res.status(400).json({ error: 'Project title and description are required.' });
        return;
      }
      const existing = await db.select({ id: projects.id }).from(projects);
      const nextOrder = existing.length + 1;
      const slug = `${slugify(String(b.title))}-${Date.now().toString(36)}`;

      const [created] = await db
        .insert(projects)
        .values({
          slug,
          numberLabel:
            typeof b.numberLabel === 'string' && b.numberLabel.trim()
              ? b.numberLabel.trim()
              : String(nextOrder).padStart(2, '0'),
          title: String(b.title).trim(),
          fullTitle: String(b.fullTitle || b.title).trim(),
          category: String(b.category || 'Full Stack').trim(),
          completed: String(b.completed || '').trim(),
          description: String(b.description).trim(),
          stack: Array.isArray(b.stack) ? b.stack.map(String) : [],
          githubUrl: String(b.githubUrl || '').trim(),
          liveDemoUrl: String(b.liveDemoUrl || '').trim(),
          imageUrl: String(b.imageUrl || '').trim(),
          imageAlt: String(b.imageAlt || b.title).trim(),
          screenshots: Array.isArray(b.screenshots) ? b.screenshots.map(String) : [],
          contributions: Array.isArray(b.contributions) ? b.contributions.map(String) : [],
          achievements: Array.isArray(b.achievements) ? b.achievements.map(String) : [],
          previewType: String(b.previewType || 'standard'),
          isFeatured: Boolean(b.isFeatured),
          isPublished: b.isPublished !== false,
          displayOrder: typeof b.displayOrder === 'number' ? b.displayOrder : nextOrder,
        })
        .returning();

      res.status(201).json(created);
    } catch (error) {
      console.error('POST /admin/projects error:', error);
      res.status(500).json({ error: 'Failed to create project.' });
    }
  });

  router.put('/projects/:id', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid project ID.' });
        return;
      }
      const b = req.body ?? {};
      const [updated] = await db
        .update(projects)
        .set({
          ...(b.numberLabel !== undefined ? { numberLabel: String(b.numberLabel) } : {}),
          ...(b.title !== undefined ? { title: String(b.title).trim() } : {}),
          ...(b.fullTitle !== undefined ? { fullTitle: String(b.fullTitle).trim() } : {}),
          ...(b.category !== undefined ? { category: String(b.category).trim() } : {}),
          ...(b.completed !== undefined ? { completed: String(b.completed).trim() } : {}),
          ...(b.description !== undefined ? { description: String(b.description).trim() } : {}),
          ...(Array.isArray(b.stack) ? { stack: b.stack.map(String) } : {}),
          ...(b.githubUrl !== undefined ? { githubUrl: String(b.githubUrl).trim() } : {}),
          ...(b.liveDemoUrl !== undefined ? { liveDemoUrl: String(b.liveDemoUrl).trim() } : {}),
          ...(b.imageUrl !== undefined ? { imageUrl: String(b.imageUrl).trim() } : {}),
          ...(b.imageAlt !== undefined ? { imageAlt: String(b.imageAlt).trim() } : {}),
          ...(Array.isArray(b.screenshots) ? { screenshots: b.screenshots.map(String) } : {}),
          ...(Array.isArray(b.contributions) ? { contributions: b.contributions.map(String) } : {}),
          ...(Array.isArray(b.achievements) ? { achievements: b.achievements.map(String) } : {}),
          ...(b.previewType !== undefined ? { previewType: String(b.previewType) } : {}),
          ...(typeof b.isFeatured === 'boolean' ? { isFeatured: b.isFeatured } : {}),
          ...(typeof b.isPublished === 'boolean' ? { isPublished: b.isPublished } : {}),
          ...(typeof b.displayOrder === 'number' ? { displayOrder: b.displayOrder } : {}),
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id))
        .returning();

      if (!updated) {
        res.status(404).json({ error: 'Project not found.' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error('PUT /admin/projects/:id error:', error);
      res.status(500).json({ error: 'Failed to update project.' });
    }
  });

  router.post('/projects/:id/duplicate', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid project ID.' });
        return;
      }
      const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
      const source = rows[0];
      if (!source) {
        res.status(404).json({ error: 'Source project not found.' });
        return;
      }
      const existing = await db.select({ id: projects.id }).from(projects);
      const nextOrder = existing.length + 1;
      const [copy] = await db
        .insert(projects)
        .values({
          slug: `${source.slug}-copy-${Date.now().toString(36)}`,
          numberLabel: String(nextOrder).padStart(2, '0'),
          title: `${source.title} (Copy)`,
          fullTitle: source.fullTitle,
          category: source.category,
          completed: source.completed,
          description: source.description,
          stack: source.stack,
          githubUrl: source.githubUrl,
          liveDemoUrl: source.liveDemoUrl,
          imageUrl: source.imageUrl,
          imageAlt: source.imageAlt,
          screenshots: source.screenshots,
          contributions: source.contributions,
          achievements: source.achievements,
          previewType: source.previewType,
          isFeatured: false,
          isPublished: false,
          displayOrder: nextOrder,
        })
        .returning();

      res.status(201).json(copy);
    } catch (error) {
      console.error('POST /admin/projects/:id/duplicate error:', error);
      res.status(500).json({ error: 'Failed to duplicate project.' });
    }
  });

  router.delete('/projects/:id', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid project ID.' });
        return;
      }
      const deleted = await db
        .delete(projects)
        .where(eq(projects.id, id))
        .returning({ id: projects.id });
      if (deleted.length === 0) {
        res.status(404).json({ error: 'Project not found.' });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /admin/projects/:id error:', error);
      res.status(500).json({ error: 'Failed to delete project.' });
    }
  });

  router.post('/projects/reorder', async (req, res) => {
    try {
      const ids = parsePositiveIdList(req.body?.ids);
      if (ids.length === 0) {
        res.status(400).json({ error: 'Valid project IDs are required for reordering.' });
        return;
      }
      await db.transaction(async (tx) => {
        for (let i = 0; i < ids.length; i++) {
          await tx
            .update(projects)
            .set({
              displayOrder: i + 1,
              numberLabel: String(i + 1).padStart(2, '0'),
              updatedAt: new Date(),
            })
            .where(eq(projects.id, ids[i]));
        }
      });
      res.json({ ok: true });
    } catch (error) {
      console.error('POST /admin/projects/reorder error:', error);
      res.status(500).json({ error: 'Failed to reorder projects.' });
    }
  });

  // ---------------- SKILLS & CATEGORIES ----------------
  router.get('/skill-categories', async (_req, res) => {
    try {
      await ensureDatabaseSeeded();
      const [cats, skillItems] = await Promise.all([
        db
          .select()
          .from(skillCategories)
          .orderBy(asc(skillCategories.displayOrder), asc(skillCategories.id)),
        db.select().from(skills).orderBy(asc(skills.displayOrder), asc(skills.id)),
      ]);
      const byCat = new Map<number, typeof skillItems>();
      for (const s of skillItems) {
        const list = byCat.get(s.categoryId) || [];
        list.push(s);
        byCat.set(s.categoryId, list);
      }
      res.json(cats.map((c) => ({ ...c, skills: byCat.get(c.id) || [] })));
    } catch (error) {
      console.error('GET /admin/skill-categories error:', error);
      res.status(500).json({ error: 'Failed to load skills.' });
    }
  });

  router.post('/skill-categories', async (req, res) => {
    try {
      const b = req.body ?? {};
      if (!b.title) {
        res.status(400).json({ error: 'Category title is required.' });
        return;
      }
      const existing = await db.select({ id: skillCategories.id }).from(skillCategories);
      const [created] = await db
        .insert(skillCategories)
        .values({
          slug: `${slugify(String(b.title))}-${Date.now().toString(36)}`,
          title: String(b.title).trim(),
          description: String(b.description || '').trim(),
          iconKey: String(b.iconKey || 'analytics'),
          displayOrder: existing.length + 1,
          isPublished: b.isPublished !== false,
        })
        .returning();
      res.status(201).json({ ...created, skills: [] });
    } catch (error) {
      console.error('POST /admin/skill-categories error:', error);
      res.status(500).json({ error: 'Failed to create category.' });
    }
  });

  router.put('/skill-categories/:id', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid category ID.' });
        return;
      }
      const b = req.body ?? {};
      const [updated] = await db
        .update(skillCategories)
        .set({
          ...(b.title !== undefined ? { title: String(b.title).trim() } : {}),
          ...(b.description !== undefined ? { description: String(b.description).trim() } : {}),
          ...(b.iconKey !== undefined ? { iconKey: String(b.iconKey) } : {}),
          ...(typeof b.isPublished === 'boolean' ? { isPublished: b.isPublished } : {}),
          ...(typeof b.displayOrder === 'number' ? { displayOrder: b.displayOrder } : {}),
          updatedAt: new Date(),
        })
        .where(eq(skillCategories.id, id))
        .returning();
      if (!updated) {
        res.status(404).json({ error: 'Category not found.' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error('PUT /admin/skill-categories/:id error:', error);
      res.status(500).json({ error: 'Failed to update category.' });
    }
  });

  router.delete('/skill-categories/:id', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid category ID.' });
        return;
      }
      const deleted = await db
        .delete(skillCategories)
        .where(eq(skillCategories.id, id))
        .returning({ id: skillCategories.id });
      if (deleted.length === 0) {
        res.status(404).json({ error: 'Category not found.' });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /admin/skill-categories/:id error:', error);
      res.status(500).json({ error: 'Failed to delete category.' });
    }
  });

  router.post('/skill-categories/reorder', async (req, res) => {
    try {
      const ids = parsePositiveIdList(req.body?.ids);
      if (ids.length === 0) {
        res.status(400).json({ error: 'Valid category IDs are required.' });
        return;
      }
      await db.transaction(async (tx) => {
        for (let i = 0; i < ids.length; i++) {
          await tx
            .update(skillCategories)
            .set({ displayOrder: i + 1, updatedAt: new Date() })
            .where(eq(skillCategories.id, ids[i]));
        }
      });
      res.json({ ok: true });
    } catch (error) {
      console.error('POST /admin/skill-categories/reorder error:', error);
      res.status(500).json({ error: 'Failed to reorder categories.' });
    }
  });

  router.post('/skills', async (req, res) => {
    try {
      const b = req.body ?? {};
      const categoryId = parsePositiveId(b.categoryId);
      const skillName = typeof b.name === 'string' ? b.name.trim() : '';
      if (!categoryId || !skillName) {
        res.status(400).json({ error: 'Valid category ID and skill name are required.' });
        return;
      }
      const catRows = await db
        .select({ id: skillCategories.id })
        .from(skillCategories)
        .where(eq(skillCategories.id, categoryId))
        .limit(1);
      if (!catRows[0]) {
        res.status(404).json({ error: 'Target skill category not found.' });
        return;
      }
      const existing = await db
        .select({ id: skills.id })
        .from(skills)
        .where(eq(skills.categoryId, categoryId));

      const [created] = await db
        .insert(skills)
        .values({
          categoryId,
          name: skillName,
          iconUrl: String(b.iconUrl || '').trim(),
          proficiency: String(b.proficiency || '').trim(),
          isEnabled: b.isEnabled !== false,
          displayOrder: existing.length + 1,
        })
        .returning();
      res.status(201).json(created);
    } catch (error) {
      console.error('POST /admin/skills error:', error);
      res.status(500).json({ error: 'Failed to create skill.' });
    }
  });

  router.put('/skills/:id', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid skill ID.' });
        return;
      }
      const b = req.body ?? {};
      let nextCategoryId: number | undefined;
      if (b.categoryId !== undefined) {
        const parsedCat = parsePositiveId(b.categoryId);
        if (!parsedCat) {
          res.status(400).json({ error: 'Invalid target category ID.' });
          return;
        }
        const catRows = await db
          .select({ id: skillCategories.id })
          .from(skillCategories)
          .where(eq(skillCategories.id, parsedCat))
          .limit(1);
        if (!catRows[0]) {
          res.status(404).json({ error: 'Target skill category not found.' });
          return;
        }
        nextCategoryId = parsedCat;
      }
      const [updated] = await db
        .update(skills)
        .set({
          ...(nextCategoryId !== undefined ? { categoryId: nextCategoryId } : {}),
          ...(b.name !== undefined ? { name: String(b.name).trim() } : {}),
          ...(b.iconUrl !== undefined ? { iconUrl: String(b.iconUrl).trim() } : {}),
          ...(b.proficiency !== undefined ? { proficiency: String(b.proficiency).trim() } : {}),
          ...(typeof b.isEnabled === 'boolean' ? { isEnabled: b.isEnabled } : {}),
          ...(typeof b.displayOrder === 'number' ? { displayOrder: b.displayOrder } : {}),
          updatedAt: new Date(),
        })
        .where(eq(skills.id, id))
        .returning();
      if (!updated) {
        res.status(404).json({ error: 'Skill not found.' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error('PUT /admin/skills/:id error:', error);
      res.status(500).json({ error: 'Failed to update skill.' });
    }
  });

  router.delete('/skills/:id', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid skill ID.' });
        return;
      }
      const deleted = await db
        .delete(skills)
        .where(eq(skills.id, id))
        .returning({ id: skills.id });
      if (deleted.length === 0) {
        res.status(404).json({ error: 'Skill not found.' });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /admin/skills/:id error:', error);
      res.status(500).json({ error: 'Failed to delete skill.' });
    }
  });

  router.post('/skills/reorder', async (req, res) => {
    try {
      const ids = parsePositiveIdList(req.body?.ids);
      if (ids.length === 0) {
        res.status(400).json({ error: 'Valid skill IDs are required.' });
        return;
      }
      await db.transaction(async (tx) => {
        for (let i = 0; i < ids.length; i++) {
          await tx
            .update(skills)
            .set({ displayOrder: i + 1, updatedAt: new Date() })
            .where(eq(skills.id, ids[i]));
        }
      });
      res.json({ ok: true });
    } catch (error) {
      console.error('POST /admin/skills/reorder error:', error);
      res.status(500).json({ error: 'Failed to reorder skills.' });
    }
  });

  // ---------------- SERVICES ----------------
  router.get('/services', async (_req, res) => {
    try {
      await ensureDatabaseSeeded();
      const rows = await db
        .select()
        .from(services)
        .orderBy(asc(services.displayOrder), asc(services.id));
      res.json(rows);
    } catch (error) {
      console.error('GET /admin/services error:', error);
      res.status(500).json({ error: 'Failed to load services.' });
    }
  });

  router.post('/services', async (req, res) => {
    try {
      const b = req.body ?? {};
      if (!b.title || !b.description) {
        res.status(400).json({ error: 'Service title and description are required.' });
        return;
      }
      const existing = await db.select({ id: services.id }).from(services);
      const nextOrder = existing.length + 1;
      const [created] = await db
        .insert(services)
        .values({
          numberLabel:
            typeof b.numberLabel === 'string' && b.numberLabel.trim()
              ? b.numberLabel.trim()
              : String(nextOrder).padStart(2, '0'),
          title: String(b.title).trim(),
          description: String(b.description).trim(),
          iconName: String(b.iconName || 'barChart'),
          technologies: Array.isArray(b.technologies) ? b.technologies.map(String) : [],
          displayOrder: typeof b.displayOrder === 'number' ? b.displayOrder : nextOrder,
          isPublished: b.isPublished !== false,
        })
        .returning();
      res.status(201).json(created);
    } catch (error) {
      console.error('POST /admin/services error:', error);
      res.status(500).json({ error: 'Failed to create service.' });
    }
  });

  router.put('/services/:id', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid service ID.' });
        return;
      }
      const b = req.body ?? {};
      const [updated] = await db
        .update(services)
        .set({
          ...(b.numberLabel !== undefined ? { numberLabel: String(b.numberLabel) } : {}),
          ...(b.title !== undefined ? { title: String(b.title).trim() } : {}),
          ...(b.description !== undefined ? { description: String(b.description).trim() } : {}),
          ...(b.iconName !== undefined ? { iconName: String(b.iconName) } : {}),
          ...(Array.isArray(b.technologies) ? { technologies: b.technologies.map(String) } : {}),
          ...(typeof b.displayOrder === 'number' ? { displayOrder: b.displayOrder } : {}),
          ...(typeof b.isPublished === 'boolean' ? { isPublished: b.isPublished } : {}),
          updatedAt: new Date(),
        })
        .where(eq(services.id, id))
        .returning();
      if (!updated) {
        res.status(404).json({ error: 'Service not found.' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error('PUT /admin/services/:id error:', error);
      res.status(500).json({ error: 'Failed to update service.' });
    }
  });

  router.delete('/services/:id', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid service ID.' });
        return;
      }
      const deleted = await db
        .delete(services)
        .where(eq(services.id, id))
        .returning({ id: services.id });
      if (deleted.length === 0) {
        res.status(404).json({ error: 'Service not found.' });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /admin/services/:id error:', error);
      res.status(500).json({ error: 'Failed to delete service.' });
    }
  });

  router.post('/services/reorder', async (req, res) => {
    try {
      const ids = parsePositiveIdList(req.body?.ids);
      if (ids.length === 0) {
        res.status(400).json({ error: 'Valid service IDs are required.' });
        return;
      }
      await db.transaction(async (tx) => {
        for (let i = 0; i < ids.length; i++) {
          await tx
            .update(services)
            .set({
              displayOrder: i + 1,
              numberLabel: String(i + 1).padStart(2, '0'),
              updatedAt: new Date(),
            })
            .where(eq(services.id, ids[i]));
        }
      });
      res.json({ ok: true });
    } catch (error) {
      console.error('POST /admin/services/reorder error:', error);
      res.status(500).json({ error: 'Failed to reorder services.' });
    }
  });

  // ---------------- EDUCATION ----------------
  router.get('/education', async (_req, res) => {
    try {
      await ensureDatabaseSeeded();
      const rows = await db
        .select()
        .from(education)
        .orderBy(asc(education.displayOrder), asc(education.id));
      res.json(rows);
    } catch (error) {
      console.error('GET /admin/education error:', error);
      res.status(500).json({ error: 'Failed to load education.' });
    }
  });

  router.post('/education', async (req, res) => {
    try {
      const b = req.body ?? {};
      if (!b.qualification || !b.institution) {
        res.status(400).json({ error: 'Qualification and institution are required.' });
        return;
      }
      const existing = await db.select({ id: education.id }).from(education);
      const periodLabel =
        typeof b.periodLabel === 'string' && b.periodLabel.trim()
          ? b.periodLabel.trim()
          : [b.startDate, b.completionDate].filter(Boolean).join(' – ') || 'Completed';

      const [created] = await db
        .insert(education)
        .values({
          qualification: String(b.qualification).trim(),
          institution: String(b.institution).trim(),
          university: String(b.university || '').trim(),
          performance: String(b.performance || '').trim(),
          startDate: String(b.startDate || '').trim(),
          completionDate: String(b.completionDate || '').trim(),
          periodLabel,
          displayOrder: existing.length + 1,
          isPublished: b.isPublished !== false,
        })
        .returning();
      res.status(201).json(created);
    } catch (error) {
      console.error('POST /admin/education error:', error);
      res.status(500).json({ error: 'Failed to create education entry.' });
    }
  });

  router.put('/education/:id', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid education ID.' });
        return;
      }
      const b = req.body ?? {};
      const periodLabel =
        typeof b.periodLabel === 'string'
          ? b.periodLabel.trim()
          : [b.startDate, b.completionDate].filter(Boolean).join(' – ');

      const [updated] = await db
        .update(education)
        .set({
          ...(b.qualification !== undefined ? { qualification: String(b.qualification).trim() } : {}),
          ...(b.institution !== undefined ? { institution: String(b.institution).trim() } : {}),
          ...(b.university !== undefined ? { university: String(b.university).trim() } : {}),
          ...(b.performance !== undefined ? { performance: String(b.performance).trim() } : {}),
          ...(b.startDate !== undefined ? { startDate: String(b.startDate).trim() } : {}),
          ...(b.completionDate !== undefined ? { completionDate: String(b.completionDate).trim() } : {}),
          ...(periodLabel ? { periodLabel } : {}),
          ...(typeof b.displayOrder === 'number' ? { displayOrder: b.displayOrder } : {}),
          ...(typeof b.isPublished === 'boolean' ? { isPublished: b.isPublished } : {}),
          updatedAt: new Date(),
        })
        .where(eq(education.id, id))
        .returning();
      if (!updated) {
        res.status(404).json({ error: 'Education entry not found.' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error('PUT /admin/education/:id error:', error);
      res.status(500).json({ error: 'Failed to update education entry.' });
    }
  });

  router.delete('/education/:id', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid education ID.' });
        return;
      }
      const deleted = await db
        .delete(education)
        .where(eq(education.id, id))
        .returning({ id: education.id });
      if (deleted.length === 0) {
        res.status(404).json({ error: 'Education entry not found.' });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /admin/education/:id error:', error);
      res.status(500).json({ error: 'Failed to delete education entry.' });
    }
  });

  router.post('/education/reorder', async (req, res) => {
    try {
      const ids = parsePositiveIdList(req.body?.ids);
      if (ids.length === 0) {
        res.status(400).json({ error: 'Valid education IDs are required.' });
        return;
      }
      await db.transaction(async (tx) => {
        for (let i = 0; i < ids.length; i++) {
          await tx
            .update(education)
            .set({ displayOrder: i + 1, updatedAt: new Date() })
            .where(eq(education.id, ids[i]));
        }
      });
      res.json({ ok: true });
    } catch (error) {
      console.error('POST /admin/education/reorder error:', error);
      res.status(500).json({ error: 'Failed to reorder education entries.' });
    }
  });

  // ---------------- CERTIFICATIONS ----------------
  router.get('/certifications', async (_req, res) => {
    try {
      await ensureDatabaseSeeded();
      const rows = await db
        .select()
        .from(certifications)
        .orderBy(asc(certifications.displayOrder), asc(certifications.id));
      res.json(rows);
    } catch (error) {
      console.error('GET /admin/certifications error:', error);
      res.status(500).json({ error: 'Failed to load certifications.' });
    }
  });

  router.post('/certifications', async (req, res) => {
    try {
      const b = req.body ?? {};
      if (!b.title || !b.issuer) {
        res.status(400).json({ error: 'Certification title and issuer are required.' });
        return;
      }
      const existing = await db.select({ id: certifications.id }).from(certifications);
      const nextOrder = existing.length + 1;
      const [created] = await db
        .insert(certifications)
        .values({
          indexLabel:
            typeof b.indexLabel === 'string' && b.indexLabel.trim()
              ? b.indexLabel.trim()
              : String(nextOrder).padStart(2, '0'),
          title: String(b.title).trim(),
          issuer: String(b.issuer).trim(),
          issueDate: String(b.issueDate || '').trim(),
          credentialId: String(b.credentialId || '').trim(),
          verificationUrl: String(b.verificationUrl || '').trim(),
          certificatePdfAssetId:
            typeof b.certificatePdfAssetId === 'number' ? b.certificatePdfAssetId : null,
          certificatePdfName: String(b.certificatePdfName || '').trim(),
          certificateImageAssetId:
            typeof b.certificateImageAssetId === 'number' ? b.certificateImageAssetId : null,
          certificateImageUrl: String(b.certificateImageUrl || '').trim(),
          displayOrder: existing.length + 1,
          isPublished: b.isPublished !== false,
        })
        .returning();
      res.status(201).json(created);
    } catch (error) {
      console.error('POST /admin/certifications error:', error);
      res.status(500).json({ error: 'Failed to create certification.' });
    }
  });

  router.put('/certifications/:id', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid certification ID.' });
        return;
      }
      const b = req.body ?? {};
      const [updated] = await db
        .update(certifications)
        .set({
          ...(b.indexLabel !== undefined ? { indexLabel: String(b.indexLabel) } : {}),
          ...(b.title !== undefined ? { title: String(b.title).trim() } : {}),
          ...(b.issuer !== undefined ? { issuer: String(b.issuer).trim() } : {}),
          ...(b.issueDate !== undefined ? { issueDate: String(b.issueDate).trim() } : {}),
          ...(b.credentialId !== undefined ? { credentialId: String(b.credentialId).trim() } : {}),
          ...(b.verificationUrl !== undefined
            ? { verificationUrl: String(b.verificationUrl).trim() }
            : {}),
          ...(b.certificatePdfAssetId !== undefined
            ? { certificatePdfAssetId: b.certificatePdfAssetId }
            : {}),
          ...(b.certificatePdfName !== undefined
            ? { certificatePdfName: String(b.certificatePdfName).trim() }
            : {}),
          ...(b.certificateImageAssetId !== undefined
            ? { certificateImageAssetId: b.certificateImageAssetId }
            : {}),
          ...(b.certificateImageUrl !== undefined
            ? { certificateImageUrl: String(b.certificateImageUrl).trim() }
            : {}),
          ...(typeof b.displayOrder === 'number' ? { displayOrder: b.displayOrder } : {}),
          ...(typeof b.isPublished === 'boolean' ? { isPublished: b.isPublished } : {}),
          updatedAt: new Date(),
        })
        .where(eq(certifications.id, id))
        .returning();
      if (!updated) {
        res.status(404).json({ error: 'Certification not found.' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error('PUT /admin/certifications/:id error:', error);
      res.status(500).json({ error: 'Failed to update certification.' });
    }
  });

  router.delete('/certifications/:id', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid certification ID.' });
        return;
      }
      const deleted = await db
        .delete(certifications)
        .where(eq(certifications.id, id))
        .returning({ id: certifications.id });
      if (deleted.length === 0) {
        res.status(404).json({ error: 'Certification not found.' });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /admin/certifications/:id error:', error);
      res.status(500).json({ error: 'Failed to delete certification.' });
    }
  });

  router.post('/certifications/reorder', async (req, res) => {
    try {
      const ids = parsePositiveIdList(req.body?.ids);
      if (ids.length === 0) {
        res.status(400).json({ error: 'Valid certification IDs are required.' });
        return;
      }
      await db.transaction(async (tx) => {
        for (let i = 0; i < ids.length; i++) {
          await tx
            .update(certifications)
            .set({
              displayOrder: i + 1,
              indexLabel: String(i + 1).padStart(2, '0'),
              updatedAt: new Date(),
            })
            .where(eq(certifications.id, ids[i]));
        }
      });
      res.json({ ok: true });
    } catch (error) {
      console.error('POST /admin/certifications/reorder error:', error);
      res.status(500).json({ error: 'Failed to reorder certifications.' });
    }
  });

  // ---------------- CONTACT INFORMATION ----------------
  router.get('/contact', async (_req, res) => {
    try {
      await ensureDatabaseSeeded();
      const rows = await db.select().from(contactInformation).limit(1);
      res.json(rows[0] || null);
    } catch (error) {
      console.error('GET /admin/contact error:', error);
      res.status(500).json({ error: 'Failed to load contact info.' });
    }
  });

  router.put('/contact', async (req, res) => {
    try {
      await ensureDatabaseSeeded();
      const b = req.body ?? {};
      const rows = await db.select().from(contactInformation).limit(1);
      if (!rows[0]) {
        res.status(404).json({ error: 'Contact configuration not found.' });
        return;
      }

      const [updated] = await db
        .update(contactInformation)
        .set({
          ...(b.email !== undefined ? { email: String(b.email).trim() } : {}),
          ...(b.phone !== undefined ? { phone: String(b.phone).trim() } : {}),
          ...(b.whatsappNumber !== undefined
            ? { whatsappNumber: String(b.whatsappNumber).trim() }
            : {}),
          ...(typeof b.whatsappEnabled === 'boolean'
            ? { whatsappEnabled: b.whatsappEnabled }
            : {}),
          ...(b.linkedinUrl !== undefined ? { linkedinUrl: String(b.linkedinUrl).trim() } : {}),
          ...(b.githubUrl !== undefined ? { githubUrl: String(b.githubUrl).trim() } : {}),
          ...(b.location !== undefined ? { location: String(b.location).trim() } : {}),
          ...(b.contactHeading !== undefined
            ? { contactHeading: String(b.contactHeading).trim() }
            : {}),
          ...(b.contactDescription !== undefined
            ? { contactDescription: String(b.contactDescription).trim() }
            : {}),
          ...(typeof b.isPublished === 'boolean' ? { isPublished: b.isPublished } : {}),
          updatedAt: new Date(),
        })
        .where(eq(contactInformation.id, rows[0].id))
        .returning();

      if (typeof b.whatsappEnabled === 'boolean') {
        const settingsRows = await db.select().from(portfolioSettings).limit(1);
        if (settingsRows[0]) {
          await db
            .update(portfolioSettings)
            .set({ whatsappEnabled: b.whatsappEnabled, updatedAt: new Date() })
            .where(eq(portfolioSettings.id, settingsRows[0].id));
        }
      }

      res.json(updated);
    } catch (error) {
      console.error('PUT /admin/contact error:', error);
      res.status(500).json({ error: 'Failed to update contact information.' });
    }
  });

  // ---------------- MEDIA UPLOAD ----------------
  router.post(
    '/media/upload',
    (req, res, next) => {
      uploadMedia.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'Media file exceeds the 6 MB maximum upload limit.' });
          return;
        }
        if (err) {
          res.status(400).json({ error: err.message || 'Media upload error.' });
          return;
        }
        next();
      });
    },
    async (req, res) => {
      try {
        const file = req.file;
        if (!file) {
          res.status(400).json({ error: 'No file uploaded.' });
          return;
        }
        if (!ALLOWED_MEDIA_MIMES.has(file.mimetype)) {
          res
            .status(400)
            .json({ error: 'Unsupported file type. Upload PNG, JPG, WEBP, SVG, or PDF.' });
          return;
        }
        const validationError = validateMediaBuffer(file.buffer, file.mimetype);
        if (validationError) {
          res.status(400).json({ error: validationError });
          return;
        }

        const assetType =
          typeof req.body?.assetType === 'string' ? req.body.assetType.slice(0, 40) : 'general';

        const [inserted] = await db
          .insert(mediaAssets)
          .values({
            fileName: file.originalname,
            mimeType: file.mimetype,
            fileSizeBytes: file.size,
            assetType,
            dataBase64: file.buffer.toString('base64'),
          })
          .returning({
            id: mediaAssets.id,
            fileName: mediaAssets.fileName,
            mimeType: mediaAssets.mimeType,
            fileSizeBytes: mediaAssets.fileSizeBytes,
            assetType: mediaAssets.assetType,
            createdAt: mediaAssets.createdAt,
          });

        res.status(201).json({
          ...inserted,
          url: `/api/media/${inserted.id}`,
        });
      } catch (error) {
        console.error('POST /admin/media/upload error:', error);
        res.status(500).json({ error: 'Failed to upload media file.' });
      }
    }
  );

  // ---------------- RESUME MANAGEMENT ----------------
  router.get('/resumes', async (_req, res) => {
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
          uploadedByEmail: resumeFiles.uploadedByEmail,
          extractedText: resumeFiles.extractedText,
          previewHtml: resumeFiles.previewHtml,
          createdAt: resumeFiles.createdAt,
          updatedAt: resumeFiles.updatedAt,
        })
        .from(resumeFiles)
        .orderBy(desc(resumeFiles.versionNumber), desc(resumeFiles.createdAt));

      const downloadEvents = await db
        .select({ metadata: analyticsEvents.metadata })
        .from(analyticsEvents)
        .where(eq(analyticsEvents.eventName, 'resume_download_success'));

      const countById = new Map<number, number>();
      for (const evt of downloadEvents) {
        const rid = Number((evt.metadata as Record<string, unknown>)?.resumeId);
        if (Number.isFinite(rid)) {
          countById.set(rid, (countById.get(rid) || 0) + 1);
        }
      }

      res.json(
        rows.map((r) => ({
          id: r.id,
          versionNumber: r.versionNumber,
          fileName: r.fileName,
          fileFormat: r.fileFormat,
          mimeType: r.mimeType,
          fileSizeBytes: r.fileSizeBytes,
          sha256Hash: r.sha256Hash,
          isActive: r.isActive,
          uploadedByEmail: r.uploadedByEmail,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          downloadCount: countById.get(r.id) || 0,
          hasTextPreview: Boolean(r.extractedText),
          hasHtmlPreview: Boolean(r.previewHtml),
          extractedTextSnippet: r.extractedText ? r.extractedText.slice(0, 220) : '',
        }))
      );
    } catch (error) {
      console.error('GET /admin/resumes error:', error);
      res.status(500).json({ error: 'Failed to load resume history.' });
    }
  });

  router.post(
    '/resumes/upload',
    (req, res, next) => {
      uploadResume.single('resume')(req, res, (err) => {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'File exceeds the 10 MB maximum upload limit.' });
          return;
        }
        if (err) {
          res.status(400).json({ error: err.message || 'Upload error occurred.' });
          return;
        }
        next();
      });
    },
    async (req: AdminAuthRequest, res) => {
      try {
        const file = req.file;
        if (!file) {
          res.status(400).json({ error: 'Please select or drop a resume file to upload.' });
          return;
        }

        const processed = await processResumeUpload(
          file.buffer,
          file.originalname,
          file.mimetype
        );

        const rawPublishNow = req.body?.publishNow;
        const publishNow = rawPublishNow !== 'false' && rawPublishNow !== false;

        const created = await db.transaction(async (tx) => {
          const maxRows = await tx
            .select({ maxVer: max(resumeFiles.versionNumber) })
            .from(resumeFiles);
          const nextVersion = (maxRows[0]?.maxVer ?? 0) + 1;

          if (publishNow) {
            await tx
              .update(resumeFiles)
              .set({ isActive: false, updatedAt: new Date() })
              .where(eq(resumeFiles.isActive, true));
          }

          const [inserted] = await tx
            .insert(resumeFiles)
            .values({
              versionNumber: nextVersion,
              fileName: processed.fileName,
              fileFormat: processed.fileFormat,
              mimeType: processed.mimeType,
              fileSizeBytes: processed.fileSizeBytes,
              fileDataBase64: file.buffer.toString('base64'),
              extractedText: processed.extractedText,
              previewHtml: processed.previewHtml,
              sha256Hash: processed.sha256Hash,
              isActive: publishNow,
              uploadedByEmail: req.adminUser?.email || '',
            })
            .returning({
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
            });

          return inserted;
        });

        res.status(201).json({
          ...created,
          hasTextPreview: Boolean(processed.extractedText),
          hasHtmlPreview: Boolean(processed.previewHtml),
          extractedTextSnippet: processed.extractedText.slice(0, 220),
          previewType: processed.previewType,
        });
      } catch (error) {
        if (error instanceof ResumeValidationError) {
          res.status(error.statusCode).json({ error: error.message });
          return;
        }
        console.error('POST /admin/resumes/upload error:', error);
        res.status(500).json({ error: 'Failed to process and upload resume.' });
      }
    }
  );

  router.post('/resumes/:id/activate', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid resume ID.' });
        return;
      }
      const target = await db.select().from(resumeFiles).where(eq(resumeFiles.id, id)).limit(1);
      if (!target[0]) {
        res.status(404).json({ error: 'Resume version not found.' });
        return;
      }

      const activated = await db.transaction(async (tx) => {
        await tx
          .update(resumeFiles)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(resumeFiles.isActive, true));

        const [updated] = await tx
          .update(resumeFiles)
          .set({ isActive: true, updatedAt: new Date() })
          .where(eq(resumeFiles.id, id))
          .returning({
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
          });
        return updated;
      });

      res.json(activated);
    } catch (error) {
      console.error('POST /admin/resumes/:id/activate error:', error);
      res.status(500).json({ error: 'Failed to activate resume version.' });
    }
  });

  router.get('/resumes/:id/preview', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid resume ID.' });
        return;
      }
      const rows = await db
        .select({
          id: resumeFiles.id,
          versionNumber: resumeFiles.versionNumber,
          fileName: resumeFiles.fileName,
          fileFormat: resumeFiles.fileFormat,
          mimeType: resumeFiles.mimeType,
          fileSizeBytes: resumeFiles.fileSizeBytes,
          extractedText: resumeFiles.extractedText,
          previewHtml: resumeFiles.previewHtml,
        })
        .from(resumeFiles)
        .where(eq(resumeFiles.id, id))
        .limit(1);

      const file = rows[0];
      if (!file) {
        res.status(404).json({ error: 'Resume version not found.' });
        return;
      }

      const fmt = (file.fileFormat || 'PDF').toUpperCase();
      const previewType: 'pdf' | 'html' | 'text' =
        fmt === 'PDF' ? 'pdf' : fmt === 'TXT' ? 'text' : 'html';

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        ...file,
        fileFormat: fmt,
        previewType,
      });
    } catch (error) {
      console.error('GET /admin/resumes/:id/preview error:', error);
      res.status(500).json({ error: 'Failed to generate resume preview.' });
    }
  });

  router.get('/resumes/:id/file', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid resume ID.' });
        return;
      }
      const rows = await db.select().from(resumeFiles).where(eq(resumeFiles.id, id)).limit(1);
      const file = rows[0];
      if (!file) {
        res.status(404).json({ error: 'Resume file not found.' });
        return;
      }
      const buffer = Buffer.from(file.fileDataBase64, 'base64');
      const inline = req.query.download !== '1' && file.fileFormat === 'PDF';
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader(
        'Content-Disposition',
        `${inline ? 'inline' : 'attachment'}; filename="${file.fileName.replace(/["\\/\r\n]/g, '_')}"`
      );
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).send(buffer);
    } catch (error) {
      console.error('GET /admin/resumes/:id/file error:', error);
      res.status(500).json({ error: 'Failed to read resume file.' });
    }
  });

  router.delete('/resumes/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid resume ID.' });
        return;
      }
      await db.delete(resumeFiles).where(eq(resumeFiles.id, id));
      res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /admin/resumes/:id error:', error);
      res.status(500).json({ error: 'Failed to delete resume version.' });
    }
  });

  // ---------------- SETTINGS & ADMIN USERS ----------------
  router.get('/settings', async (_req, res) => {
    try {
      await ensureDatabaseSeeded();
      const [settingsRows, admins] = await Promise.all([
        db.select().from(portfolioSettings).limit(1),
        db
          .select({
            id: adminUsers.id,
            email: adminUsers.email,
            displayName: adminUsers.displayName,
            role: adminUsers.role,
            isActive: adminUsers.isActive,
            lastLoginAt: adminUsers.lastLoginAt,
          })
          .from(adminUsers)
          .orderBy(asc(adminUsers.id)),
      ]);
      res.json({ settings: settingsRows[0] || null, adminUsers: admins });
    } catch (error) {
      console.error('GET /admin/settings error:', error);
      res.status(500).json({ error: 'Failed to load settings.' });
    }
  });

  router.put('/settings', async (req, res) => {
    try {
      await ensureDatabaseSeeded();
      const b = req.body ?? {};
      const existing = await db.select().from(portfolioSettings).limit(1);
      if (!existing[0]) {
        res.status(404).json({ error: 'Settings not found.' });
        return;
      }

      const updated = await db.transaction(async (tx) => {
        const [saved] = await tx
          .update(portfolioSettings)
          .set({
            ...(b.siteTitle !== undefined ? { siteTitle: String(b.siteTitle).trim() } : {}),
            ...(b.footerCopyright !== undefined
              ? { footerCopyright: String(b.footerCopyright).trim() }
              : {}),
            ...(typeof b.enableAnalytics === 'boolean'
              ? { enableAnalytics: b.enableAnalytics }
              : {}),
            ...(typeof b.requireCookieConsent === 'boolean'
              ? { requireCookieConsent: b.requireCookieConsent }
              : {}),
            ...(typeof b.dataRetentionDays === 'number'
              ? { dataRetentionDays: Math.max(7, Math.min(3650, b.dataRetentionDays)) }
              : {}),
            ...(typeof b.whatsappEnabled === 'boolean'
              ? { whatsappEnabled: b.whatsappEnabled }
              : {}),
            ...(typeof b.maintenanceMode === 'boolean'
              ? { maintenanceMode: b.maintenanceMode }
              : {}),
            ...(Array.isArray(b.sectionOrder) ? { sectionOrder: b.sectionOrder.map(String) } : {}),
            updatedAt: new Date(),
          })
          .where(eq(portfolioSettings.id, existing[0].id))
          .returning();

        if (typeof b.whatsappEnabled === 'boolean') {
          const contactRows = await tx.select().from(contactInformation).limit(1);
          if (contactRows[0]) {
            await tx
              .update(contactInformation)
              .set({ whatsappEnabled: b.whatsappEnabled, updatedAt: new Date() })
              .where(eq(contactInformation.id, contactRows[0].id));
          }
        }
        return saved;
      });

      res.json(updated);
    } catch (error) {
      console.error('PUT /admin/settings error:', error);
      res.status(500).json({ error: 'Failed to update settings.' });
    }
  });

  router.post('/settings/prune-analytics', async (_req, res) => {
    try {
      const settingsRows = await db.select().from(portfolioSettings).limit(1);
      const retentionDays = settingsRows[0]?.dataRetentionDays ?? 180;
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      await db.transaction(async (tx) => {
        await tx.execute(sql`DELETE FROM analytics_events WHERE created_at < ${cutoff}`);
        await tx.execute(sql`DELETE FROM visitor_sessions WHERE last_activity_at < ${cutoff}`);
      });
      res.json({ ok: true, cutoff: cutoff.toISOString(), retentionDays });
    } catch (error) {
      console.error('POST /admin/settings/prune-analytics error:', error);
      res.status(500).json({ error: 'Failed to prune old analytics records.' });
    }
  });

  router.post('/users', async (req, res) => {
    try {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const displayName = String(req.body?.displayName || '').trim() || 'Administrator';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: 'Valid administrator email is required.' });
        return;
      }
      const [created] = await db
        .insert(adminUsers)
        .values({ email, displayName, role: 'admin', isActive: true })
        .onConflictDoUpdate({
          target: adminUsers.email,
          set: { isActive: true, displayName, updatedAt: new Date() },
        })
        .returning({
          id: adminUsers.id,
          email: adminUsers.email,
          displayName: adminUsers.displayName,
          role: adminUsers.role,
          isActive: adminUsers.isActive,
          lastLoginAt: adminUsers.lastLoginAt,
        });
      res.status(201).json(created);
    } catch (error) {
      console.error('POST /admin/users error:', error);
      res.status(500).json({ error: 'Failed to add administrator.' });
    }
  });

  router.patch('/users/:id', async (req: AdminAuthRequest, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid administrator ID.' });
        return;
      }
      if (req.adminUser?.id === id && req.body?.isActive === false) {
        res.status(400).json({ error: 'You cannot deactivate your own active admin session.' });
        return;
      }
      const updated = await db.transaction(async (tx) => {
        const [saved] = await tx
          .update(adminUsers)
          .set({
            ...(typeof req.body?.isActive === 'boolean' ? { isActive: req.body.isActive } : {}),
            updatedAt: new Date(),
          })
          .where(eq(adminUsers.id, id))
          .returning({
            id: adminUsers.id,
            email: adminUsers.email,
            displayName: adminUsers.displayName,
            role: adminUsers.role,
            isActive: adminUsers.isActive,
            lastLoginAt: adminUsers.lastLoginAt,
          });
        if (saved && req.body?.isActive === false) {
          await tx
            .update(adminSessions)
            .set({ revokedAt: new Date() })
            .where(eq(adminSessions.adminUserId, id));
        }
        return saved;
      });
      if (!updated) {
        res.status(404).json({ error: 'Administrator not found.' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error('PATCH /admin/users/:id error:', error);
      res.status(500).json({ error: 'Failed to update administrator.' });
    }
  });

  return router;
}
