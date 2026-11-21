import { Router } from 'express';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { enquiries, enquiryNotes, enquiryStatusHistory } from '../../db/schema.ts';
import type { AdminAuthRequest } from '../auth.ts';

const VALID_STATUSES = new Set([
  'new',
  'unread',
  'read',
  'in_progress',
  'replied',
  'important',
  'archived',
]);

function parsePositiveId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function createAdminEnquiriesRouter(): Router {
  const router = Router();

  router.get('/enquiries', async (req, res) => {
    try {
      const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : '';
      const categoryFilter =
        typeof req.query.category === 'string' ? req.query.category.trim() : '';
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

      const conditions = [];
      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'important') {
          conditions.push(or(eq(enquiries.isImportant, true), eq(enquiries.status, 'important')));
        } else {
          conditions.push(eq(enquiries.status, statusFilter));
        }
      }
      if (categoryFilter && categoryFilter !== 'all') {
        conditions.push(eq(enquiries.category, categoryFilter));
      }
      if (search) {
        const pattern = `%${search}%`;
        conditions.push(
          or(
            ilike(enquiries.fullName, pattern),
            ilike(enquiries.email, pattern),
            ilike(enquiries.subject, pattern),
            ilike(enquiries.enquiryCode, pattern)
          )
        );
      }

      const rows = await db
        .select()
        .from(enquiries)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(enquiries.createdAt));

      res.json(rows);
    } catch (error) {
      console.error('GET /admin/enquiries error:', error);
      res.status(500).json({ error: 'Failed to load enquiries.' });
    }
  });

  router.get('/enquiries/:id', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid enquiry ID.' });
        return;
      }
      const rows = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
      if (!rows[0]) {
        res.status(404).json({ error: 'Enquiry not found.' });
        return;
      }
      const [notes, history] = await Promise.all([
        db
          .select()
          .from(enquiryNotes)
          .where(eq(enquiryNotes.enquiryId, id))
          .orderBy(desc(enquiryNotes.createdAt)),
        db
          .select()
          .from(enquiryStatusHistory)
          .where(eq(enquiryStatusHistory.enquiryId, id))
          .orderBy(desc(enquiryStatusHistory.createdAt)),
      ]);
      res.json({ ...rows[0], notes, statusHistory: history });
    } catch (error) {
      console.error('GET /admin/enquiries/:id error:', error);
      res.status(500).json({ error: 'Failed to load enquiry details.' });
    }
  });

  router.patch('/enquiries/:id', async (req: AdminAuthRequest, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid enquiry ID.' });
        return;
      }
      const b = req.body ?? {};
      const existingRows = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
      const existing = existingRows[0];
      if (!existing) {
        res.status(404).json({ error: 'Enquiry not found.' });
        return;
      }

      const nextStatus =
        typeof b.status === 'string' && VALID_STATUSES.has(b.status)
          ? b.status
          : existing.status;
      const nextImportant =
        typeof b.isImportant === 'boolean' ? b.isImportant : existing.isImportant;

      const updated = await db.transaction(async (tx) => {
        const [saved] = await tx
          .update(enquiries)
          .set({
            status: nextStatus,
            isImportant: nextImportant,
            updatedAt: new Date(),
          })
          .where(eq(enquiries.id, id))
          .returning();

        if (nextStatus !== existing.status) {
          await tx.insert(enquiryStatusHistory).values({
            enquiryId: id,
            previousStatus: existing.status,
            newStatus: nextStatus,
            changedByEmail: req.adminUser?.email || 'admin',
          });
        }
        return saved;
      });

      res.json(updated);
    } catch (error) {
      console.error('PATCH /admin/enquiries/:id error:', error);
      res.status(500).json({ error: 'Failed to update enquiry.' });
    }
  });

  router.post('/enquiries/:id/notes', async (req: AdminAuthRequest, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid enquiry ID.' });
        return;
      }
      const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
      if (!note) {
        res.status(400).json({ error: 'Internal note text cannot be empty.' });
        return;
      }

      const existing = await db
        .select({ id: enquiries.id })
        .from(enquiries)
        .where(eq(enquiries.id, id))
        .limit(1);
      if (!existing[0]) {
        res.status(404).json({ error: 'Enquiry not found.' });
        return;
      }

      const [created] = await db
        .insert(enquiryNotes)
        .values({
          enquiryId: id,
          authorEmail: req.adminUser?.email || 'admin',
          note,
        })
        .returning();

      res.status(201).json(created);
    } catch (error) {
      console.error('POST /admin/enquiries/:id/notes error:', error);
      res.status(500).json({ error: 'Failed to add internal note.' });
    }
  });

  router.delete('/enquiries/:id', async (req, res) => {
    try {
      const id = parsePositiveId(req.params.id);
      if (!id) {
        res.status(400).json({ error: 'Invalid enquiry ID.' });
        return;
      }
      const deleted = await db
        .delete(enquiries)
        .where(eq(enquiries.id, id))
        .returning({ id: enquiries.id });
      if (deleted.length === 0) {
        res.status(404).json({ error: 'Enquiry not found.' });
        return;
      }
      res.json({ ok: true });
    } catch (error) {
      console.error('DELETE /admin/enquiries/:id error:', error);
      res.status(500).json({ error: 'Failed to delete enquiry.' });
    }
  });

  router.get('/enquiry-history', async (_req, res) => {
    try {
      const rows = await db
        .select({
          id: enquiryStatusHistory.id,
          enquiryId: enquiryStatusHistory.enquiryId,
          previousStatus: enquiryStatusHistory.previousStatus,
          newStatus: enquiryStatusHistory.newStatus,
          changedByEmail: enquiryStatusHistory.changedByEmail,
          createdAt: enquiryStatusHistory.createdAt,
          enquiryCode: enquiries.enquiryCode,
          fullName: enquiries.fullName,
          subject: enquiries.subject,
        })
        .from(enquiryStatusHistory)
        .innerJoin(enquiries, eq(enquiryStatusHistory.enquiryId, enquiries.id))
        .orderBy(desc(enquiryStatusHistory.createdAt))
        .limit(150);

      res.json(rows);
    } catch (error) {
      console.error('GET /admin/enquiry-history error:', error);
      res.status(500).json({ error: 'Failed to load enquiry status history.' });
    }
  });

  return router;
}
