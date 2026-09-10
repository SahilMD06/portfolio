import 'server-only';

import { redirect } from 'next/navigation';

import { getCurrentUser, type SessionUser } from './session';

/**
 * Page-level auth gate. **Every admin page must await this as its first
 * statement, before reading any data.**
 *
 * A guard in the layout alone is not sufficient: Next renders a layout and its
 * page concurrently, so a page that starts fetching immediately can stream its
 * data into the HTML before the layout's redirect resolves. The browser would
 * still navigate away, but the response body would already contain admin
 * content. Redirecting from inside the page itself means nothing is ever
 * rendered or fetched for an unauthenticated request.
 *
 * The layout keeps its own check as defence in depth, and every server action
 * and API route re-checks independently.
 */
export async function requireAdminPage(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') redirect('/admin/login');
  return user;
}
