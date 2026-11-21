import { Router, type Request, type Response } from 'express';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { adminSessions, adminUsers } from '../../db/schema.ts';
import {
  ADMIN_SESSION_COOKIE,
  SESSION_TTL_MS,
  extractSessionToken,
  requireAdmin,
  resolveAdminSession,
  type AdminAuthRequest,
} from '../auth.ts';
import {
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from '../password.ts';
import { createRateLimiter } from '../rateLimit.ts';
import { ensureDatabaseSeeded } from '../seed.ts';

function setSessionCookie(req: Request, res: Response, rawToken: string, maxAgeMs: number): void {
  const isHttps =
    req.secure || req.headers['x-forwarded-proto'] === 'https';
  const maxAgeSeconds = Math.max(0, Math.floor(maxAgeMs / 1000));
  const flags = [
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(rawToken)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${maxAgeSeconds}`,
    isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax',
  ];
  res.setHeader('Set-Cookie', flags.join('; '));
}

function clearSessionCookie(req: Request, res: Response): void {
  const isHttps =
    req.secure || req.headers['x-forwarded-proto'] === 'https';
  const flags = [
    `${ADMIN_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'Max-Age=0',
    isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax',
  ];
  res.setHeader('Set-Cookie', flags.join('; '));
}

export function createAdminAuthRouter(): Router {
  const router = Router();
  const loginLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 20,
    label: 'admin-login',
  });

  // Check active session (returns 401 when unauthenticated)
  router.get('/session', async (req, res) => {
    try {
      const resolved = await resolveAdminSession(req);
      if (!resolved) {
        res.status(401).json({ authenticated: false, error: 'No active administrator session.' });
        return;
      }
      res.json({
        authenticated: true,
        expiresAt: resolved.expiresAt.toISOString(),
        user: resolved.user,
      });
    } catch (error) {
      console.error('GET /admin/auth/session error:', error);
      res.status(401).json({ authenticated: false, error: 'Session verification failed.' });
    }
  });

  // Username + Password Login
  router.post('/login', loginLimiter, async (req, res) => {
    try {
      const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required.' });
        return;
      }

      await ensureDatabaseSeeded();

      // Case-insensitive username lookup
      const matched = await db
        .select()
        .from(adminUsers)
        .where(sql`lower(${adminUsers.username}) = lower(${username})`)
        .limit(1);

      const admin = matched[0];

      if (!admin || !admin.isActive) {
        res.status(401).json({ error: 'Invalid username or password.' });
        return;
      }

      if (!admin.passwordHash) {
        res.status(503).json({
          error:
            'Administrator password is not configured on the server yet. Set ADMIN_INITIAL_PASSWORD in server environment secrets and restart.',
        });
        return;
      }

      // Case-sensitive password verification
      const validPassword = verifyPassword(password, admin.passwordHash);
      if (!validPassword) {
        res.status(401).json({ error: 'Invalid username or password.' });
        return;
      }

      const { rawToken, tokenHash } = generateSessionToken();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

      await db.insert(adminSessions).values({
        tokenHash,
        adminUserId: admin.id,
        userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
        expiresAt,
        lastUsedAt: now,
      });

      await db
        .update(adminUsers)
        .set({ lastLoginAt: now, updatedAt: now })
        .where(eq(adminUsers.id, admin.id));

      setSessionCookie(req, res, rawToken, SESSION_TTL_MS);

      res.json({
        token: rawToken,
        expiresAt: expiresAt.toISOString(),
        user: {
          id: admin.id,
          username: admin.username || 'Abhinavp',
          email: admin.email,
          displayName: admin.displayName || 'Abhinav P',
          role: admin.role,
        },
      });
    } catch (error) {
      console.error('POST /admin/auth/login error:', error);
      res.status(500).json({ error: 'Authentication service failed. Please try again.' });
    }
  });

  // Logout & Session Revocation
  router.post('/logout', async (req, res) => {
    try {
      const rawToken = extractSessionToken(req);
      if (rawToken) {
        const tokenHash = hashSessionToken(rawToken);
        await db
          .update(adminSessions)
          .set({ revokedAt: new Date() })
          .where(eq(adminSessions.tokenHash, tokenHash));
      }
      clearSessionCookie(req, res);
      res.json({ ok: true });
    } catch (error) {
      console.error('POST /admin/auth/logout error:', error);
      clearSessionCookie(req, res);
      res.json({ ok: true });
    }
  });

  // Change Password (Authenticated Admin Only)
  router.post('/change-password', requireAdmin, async (req: AdminAuthRequest, res) => {
    try {
      const currentPassword =
        typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
      const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

      if (!currentPassword || newPassword.length < 8) {
        res.status(400).json({
          error: 'Current password and a new password of at least 8 characters are required.',
        });
        return;
      }

      const rows = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.id, req.adminUser!.id))
        .limit(1);
      const admin = rows[0];
      if (!admin || !admin.passwordHash || !verifyPassword(currentPassword, admin.passwordHash)) {
        res.status(401).json({ error: 'Current password is incorrect.' });
        return;
      }

      await db
        .update(adminUsers)
        .set({ passwordHash: hashPassword(newPassword), updatedAt: new Date() })
        .where(eq(adminUsers.id, admin.id));

      res.json({ ok: true });
    } catch (error) {
      console.error('POST /admin/auth/change-password error:', error);
      res.status(500).json({ error: 'Failed to update password.' });
    }
  });

  return router;
}
