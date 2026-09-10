import 'server-only';

import { headers } from 'next/headers';

/**
 * CSRF defence for state-changing requests.
 *
 * The session cookie is SameSite=Lax, which already blocks cross-site POSTs
 * from forms and fetch. This adds a second, explicit check: the request's
 * Origin must match the Host it claims to be talking to. Next verifies this for
 * Server Actions automatically; the /api/admin/* route handlers do not get that
 * for free, so they call this.
 */
export async function assertSameOrigin(): Promise<void> {
  const headerList = await headers();
  const origin = headerList.get('origin');

  // Same-origin GET/HEAD and server-to-server calls may omit Origin entirely;
  // callers only invoke this for mutations, where browsers always send it.
  if (!origin) return;

  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  if (!host) throw new CsrfError();

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new CsrfError();
  }

  if (originHost !== host) throw new CsrfError();
}

export class CsrfError extends Error {
  constructor() {
    super('Cross-origin request rejected.');
    this.name = 'CsrfError';
  }
}
