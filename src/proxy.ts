import { NextResponse, type NextRequest } from 'next/server';

/**
 * UX-only redirect: sends visitors with no session cookie straight to the login
 * page instead of rendering an admin shell that will only reject them.
 *
 * This is NOT the security boundary. It sees only that *a* cookie exists, never
 * whether it is valid, because this runs on the edge runtime with no database
 * access. Every admin page (`requireAdminPage`), server action and API route
 * (`requireAdmin`) verifies the session server-side. Forging this cookie earns
 * a redirect into a page that then rejects you.
 *
 * Deliberately does NOT redirect /admin/login -> /admin when a cookie is
 * present: a stale or invalid cookie would then bounce between the two pages
 * forever, locking the user out of the login form. The login page performs that
 * redirect itself, where the session can actually be validated.
 *
 * Next 16 renamed the `middleware` file convention to `proxy`.
 */
const SESSION_COOKIES = ['__Host-portfolio_session', 'portfolio_session'];

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The login page must always be reachable.
  if (pathname === '/admin/login') return NextResponse.next();

  const hasSessionCookie = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (!hasSessionCookie) {
    const loginUrl = new URL('/admin/login', request.url);
    // Preserve where the user was heading so login can send them back.
    if (pathname !== '/admin') loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Admin pages only. The /api/admin/* routes are deliberately excluded so they
  // return a JSON 401 from their own auth check rather than an HTML redirect.
  matcher: ['/admin/:path*'],
};
