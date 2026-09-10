import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s — Admin' },
  // The admin area must never appear in search results.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The admin area never serves cached content: every page reads live data so an
 * editor always sees the current state of the database.
 */
export const dynamic = 'force-dynamic';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
