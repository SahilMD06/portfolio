import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { cache } from 'react';
import { and, eq, gt, lt } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import { sessions, users, type User } from '@/lib/db/schema';
import { env } from '@/lib/env';

/**
 * Opaque, database-backed sessions.
 *
 * The cookie carries a 256-bit random token; only its SHA-256 hash is stored.
 * A stolen database therefore yields no usable session cookies, and logging out
 * revokes access immediately (unlike a self-contained JWT).
 */

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
/** __Host- forbids Domain and requires Secure+Path=/, blocking subdomain injection. */
export const SESSION_COOKIE = env.isProd ? '__Host-portfolio_session' : 'portfolio_session';

function hashToken(token: string): string {
  return createHash('sha256').update(`${token}${env.sessionSecret}`).digest('hex');
}

export type SessionUser = Pick<User, 'id' | 'email' | 'name' | 'role'>;

/**
 * Resolves the current admin user, or null. Wrapped in React `cache` so many
 * components in one render share a single database round trip.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return rows[0] ?? null;
});

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const headerList = await headers();

  const db = await getDb();
  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
    userAgent: headerList.get('user-agent')?.slice(0, 500) ?? null,
  });

  // Opportunistic cleanup of expired rows; cheap thanks to the expires_at index.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Thrown by requireAdmin; mapped to 401 by the API error handler. */
export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

/**
 * The security boundary. Every admin server action and every /api/admin/*
 * handler must call this. Middleware is only a UX redirect.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') throw new UnauthorizedError();
  return user;
}
