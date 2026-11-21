import type { NextFunction, Request, Response } from 'express';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { adminSessions, adminUsers } from '../db/schema.ts';
import { hashSessionToken } from './password.ts';
import { ensureDatabaseSeeded } from './seed.ts';

export const ADMIN_SESSION_COOKIE = 'ap_admin_session';
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AdminSessionUser {
  id: number;
  username: string;
  email: string;
  displayName: string;
  role: string;
}

export interface AdminAuthRequest extends Request {
  adminUser?: AdminSessionUser;
  adminSessionId?: number;
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        out[key] = decodeURIComponent(val);
      } catch {
        out[key] = val;
      }
    }
  }
  return out;
}

export function extractSessionToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice('Bearer '.length).trim();
    if (bearer) return bearer;
  }

  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies[ADMIN_SESSION_COOKIE];
  if (cookieToken && cookieToken.trim()) {
    return cookieToken.trim();
  }

  return null;
}

export async function resolveAdminSession(req: Request): Promise<{
  sessionId: number;
  expiresAt: Date;
  user: AdminSessionUser;
} | null> {
  await ensureDatabaseSeeded();

  const rawToken = extractSessionToken(req);
  if (!rawToken) return null;

  const tokenHash = hashSessionToken(rawToken);
  const now = new Date();

  const rows = await db
    .select({
      sessionId: adminSessions.id,
      expiresAt: adminSessions.expiresAt,
      userId: adminUsers.id,
      username: adminUsers.username,
      email: adminUsers.email,
      displayName: adminUsers.displayName,
      role: adminUsers.role,
      isActive: adminUsers.isActive,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.adminUserId, adminUsers.id))
    .where(
      and(
        eq(adminSessions.tokenHash, tokenHash),
        isNull(adminSessions.revokedAt),
        gt(adminSessions.expiresAt, now)
      )
    )
    .limit(1);

  const match = rows[0];
  if (!match || !match.isActive) return null;

  await db
    .update(adminSessions)
    .set({ lastUsedAt: now })
    .where(eq(adminSessions.id, match.sessionId));

  return {
    sessionId: match.sessionId,
    expiresAt: match.expiresAt,
    user: {
      id: match.userId,
      username: match.username || 'Abhinavp',
      email: match.email,
      displayName: match.displayName || 'Abhinav P',
      role: match.role,
    },
  };
}

export const requireAdmin = async (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const resolved = await resolveAdminSession(req);
    if (!resolved) {
      res.status(401).json({
        error: 'Unauthorized: Valid administrator session required.',
      });
      return;
    }

    req.adminUser = resolved.user;
    req.adminSessionId = resolved.sessionId;
    next();
  } catch (err) {
    console.error('Admin session verification failed:', err);
    res.status(401).json({ error: 'Unauthorized: Invalid or expired administrator session.' });
  }
};
