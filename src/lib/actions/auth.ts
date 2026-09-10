'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { createSession, destroySession } from '@/lib/auth/session';
import { verifyPassword } from '@/lib/auth/password';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/validation/schemas';

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
