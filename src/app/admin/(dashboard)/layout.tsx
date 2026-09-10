import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin/admin-shell';
import { ToastProvider } from '@/components/admin/toast';
import { getCurrentUser } from '@/lib/auth/session';

/**
 * Server-side gate for every dashboard page.
 *
 * Middleware only checks that a cookie is present; this verifies the session
 * against the database. Individual server actions re-check as well, so an
 * expired session cannot mutate anything even if a page was already rendered.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') redirect('/admin/login');

  return (
    <ToastProvider>
      <AdminShell userName={user.name} userEmail={user.email}>
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
