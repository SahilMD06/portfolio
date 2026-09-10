import Link from 'next/link';

import { Card } from '@/components/ui';
import { requireAdminPage } from '@/lib/auth/guard';
import { getDashboardStats } from '@/lib/services/content';
import { formatDateTime } from '@/lib/utils';

const CARDS = [
  { key: 'projects', label: 'Projects', href: '/admin/projects' },
  { key: 'experiences', label: 'Experience', href: '/admin/experience' },
  { key: 'skills', label: 'Skills', href: '/admin/skills' },
  { key: 'certifications', label: 'Certifications', href: '/admin/certifications' },
  { key: 'education', label: 'Education', href: '/admin/education' },
  { key: 'achievements', label: 'Achievements', href: '/admin/achievements' },
] as const;

export default async function DashboardPage() {
  await requireAdminPage();
  const stats = await getDashboardStats();

  return (
    <>
      <header className="mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Everything on your public portfolio is managed from here.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CARDS.map((card) => (
          <Link key={card.key} href={card.href} className="group">
            <Card className="p-4 group-hover:border-border-strong">
              <p className="text-2xl font-semibold tabular-nums">{stats[card.key]}</p>
              <p className="mt-0.5 text-sm text-fg-muted group-hover:text-fg">{card.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-xs font-semibold tracking-[0.1em] text-fg-subtle uppercase">
            Last content update
          </p>
          <p className="mt-2 text-sm">{formatDateTime(stats.lastUpdated)}</p>
        </Card>

        <Link href="/admin/messages" className="group">
          <Card className="p-4 group-hover:border-border-strong">
            <p className="text-xs font-semibold tracking-[0.1em] text-fg-subtle uppercase">
              Unread messages
            </p>
            <p className="mt-2 text-sm">
              {stats.unreadMessages === 0
                ? 'No new messages'
                : `${stats.unreadMessages} unread message${stats.unreadMessages === 1 ? '' : 's'}`}
            </p>
          </Card>
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold">Getting started</h2>
        <ol className="mt-3 space-y-2 text-sm text-fg-muted">
          <li>
            1. Update your{' '}
            <Link href="/admin/profile" className="text-accent hover:underline">
              profile
            </Link>{' '}
            — name, headline, bio and contact email.
          </li>
          <li>
            2. Upload your{' '}
            <Link href="/admin/resume" className="text-accent hover:underline">
              resume
            </Link>{' '}
            so the download button appears.
          </li>
          <li>
            3. Replace the sample{' '}
            <Link href="/admin/projects" className="text-accent hover:underline">
              projects
            </Link>{' '}
            and{' '}
            <Link href="/admin/experience" className="text-accent hover:underline">
              experience
            </Link>{' '}
            entries with your own.
          </li>
          <li>
            4. Point your{' '}
            <Link href="/admin/social-links" className="text-accent hover:underline">
              social links
            </Link>{' '}
            at your real GitHub and LinkedIn profiles.
          </li>
        </ol>
      </section>
    </>
  );
}
