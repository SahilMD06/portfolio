'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq, ne } from 'drizzle-orm';

import {
  SESSION_COOKIE,
  createSession,
  destroySession,
  hashSessionToken,
  requireAdmin,
} from '@/lib/auth/session';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { getDb } from '@/lib/db';
import { sessions, users } from '@/lib/db/schema';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { changePasswordSchema, loginSchema } from '@/lib/validation/schemas';
import type { ActionResult } from './types';

export interface LoginState {
  error?: string;
}

/** A wrong email and a wrong password must be indistinguishable. */
const GENERIC_FAILURE = 'Incorrect email or password.';

/**
 * Cost of one scrypt verification, burned when the email does not exist, so an
 * attacker cannot use response timing to enumerate valid admin accounts.
 */
const DUMMY_HASH =
  'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: GENERIC_FAILURE };

  const headerList = await headers();
  // Throttle by IP: 8 attempts per 15 minutes.
  const limit = rateLimit(clientKey(headerList, 'login'), 8, 15 * 60 * 1000);
  if (!limit.allowed) {
    return {
      error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
    };
  }

  const db = await getDb();
  const rows = await db
    .select({ id: users.id, passwordHash: users.passwordHash, role: users.role })
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .limit(1);

  const user = rows[0];
  if (!user) {
    await verifyPassword(parsed.data.password, DUMMY_HASH);
    return { error: GENERIC_FAILURE };
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid || user.role !== 'admin') return { error: GENERIC_FAILURE };

  await createSession(user.id);
  // redirect() throws internally, so it must sit outside any try/catch.
  redirect('/admin');
}

export async function logout(): Promise<never> {
  await destroySession();
  redirect('/admin/login');
}

/**
 * Changes the signed-in admin's password.
 *
 * Requires the current password, so a hijacked session cannot be turned into
 * permanent account takeover. On success every *other* session is revoked, so
 * anyone already holding a stolen cookie is logged out while the person making
 * the change stays signed in.
 */
export async function changePassword(
  _previous: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  let user;
  try {
    user = await requireAdmin();
  } catch {
    return { ok: false, message: 'You are not signed in.' };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: 'Please correct the highlighted fields.', fieldErrors };
  }

  // Throttle so the current-password field cannot be brute forced.
  const headerList = await headers();
  const limit = rateLimit(clientKey(headerList, `pwchange:${user.id}`), 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return {
      ok: false,
      message: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
    };
  }

  try {
    const db = await getDb();
    const rows = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const current = rows[0];
    if (!current || !(await verifyPassword(parsed.data.currentPassword, current.passwordHash))) {
      return {
        ok: false,
        message: 'That is not your current password.',
        fieldErrors: { currentPassword: 'Incorrect password.' },
      };
    }

    await db
      .update(users)
      .set({ passwordHash: await hashPassword(parsed.data.newPassword), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Revoke every other session; keep the one making the change.
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    const currentHash = token ? hashSessionToken(token) : null;
    await db
      .delete(sessions)
      .where(
        currentHash
          ? and(eq(sessions.userId, user.id), ne(sessions.tokenHash, currentHash))
          : eq(sessions.userId, user.id),
      );

    return { ok: true, message: 'Password changed. Other sessions have been signed out.' };
  } catch (error) {
    console.error('Failed to change password:', error);
    return { ok: false, message: 'Could not change your password. Please try again.' };
  }
}
