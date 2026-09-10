import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/admin/login-form';
import { getCurrentUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Admin sign in',
  // Never let the admin login surface in search results.
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // Validated here rather than in the proxy: the proxy can only see that a
  // cookie exists, so redirecting there would trap anyone holding a stale
  // cookie in a loop between this page and /admin.
  const user = await getCurrentUser();
  if (user && user.role === 'admin') redirect('/admin');

  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold">Admin sign in</h1>
        <p className="mt-1.5 text-sm text-fg-muted">Manage the content of your portfolio.</p>

        <div className="mt-7 rounded-card border border-border bg-surface p-5 sm:p-6">
          <LoginForm />
        </div>

        <Link href="/" className="mt-6 inline-block text-sm text-fg-subtle hover:text-fg">
          ← Back to portfolio
        </Link>
      </div>
    </main>
  );
}
