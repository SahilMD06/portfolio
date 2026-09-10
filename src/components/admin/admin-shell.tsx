'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { ThemeToggle } from '@/components/site/theme-toggle';
import { CloseIcon, ExternalIcon, LogoutIcon, MenuIcon } from '@/components/ui/icons';
import { logout } from '@/lib/actions/auth';
import { cn } from '@/lib/utils';

const NAV_SECTIONS: { heading: string; items: { href: string; label: string }[] }[] = [
  {
    heading: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard' }],
  },
  {
    heading: 'Content',
    items: [
      { href: '/admin/projects', label: 'Projects' },
      { href: '/admin/experience', label: 'Experience' },
      { href: '/admin/skills', label: 'Skills' },
      { href: '/admin/education', label: 'Education' },
      { href: '/admin/certifications', label: 'Certifications' },
      { href: '/admin/achievements', label: 'Achievements' },
    ],
  },
  {
    heading: 'Site',
    items: [
      { href: '/admin/profile', label: 'Profile' },
      { href: '/admin/resume', label: 'Resume' },
      { href: '/admin/social-links', label: 'Social links' },
      { href: '/admin/media', label: 'Media' },
      { href: '/admin/messages', label: 'Messages' },
      { href: '/admin/settings', label: 'Site settings' },
    ],
  },
];

export function AdminShell({
  userName,
  userEmail,
  children,
}: {
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile nav on route change without an effect (see site-header).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-bg px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-nav"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted"
        >
          {open ? <CloseIcon width="18" height="18" /> : <MenuIcon width="18" height="18" />}
        </button>
        <span className="text-sm font-semibold">Portfolio admin</span>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>

      <aside
        id="admin-nav"
        className={cn(
          'border-border bg-surface lg:sticky lg:top-0 lg:block lg:h-dvh lg:border-r',
          open ? 'block border-b' : 'hidden',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="hidden h-14 items-center gap-2 border-b border-border px-5 lg:flex">
            <span className="text-sm font-semibold">Portfolio admin</span>
          </div>

          <nav aria-label="Admin" className="flex-1 overflow-y-auto p-3">
            {NAV_SECTIONS.map((section) => (
              <div key={section.heading} className="mb-4">
                <p className="px-2 pb-1.5 text-[0.68rem] font-semibold tracking-[0.12em] text-fg-subtle uppercase">
                  {section.heading}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    // Exact match for /admin so it is not active on every child route.
                    const active =
                      item.href === '/admin'
                        ? pathname === '/admin'
                        : pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'block rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-150',
                            active
                              ? 'bg-accent-subtle font-medium text-accent'
                              : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                          )}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-border p-3">
            <div className="px-2 pb-2">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-fg-subtle">{userEmail}</p>
            </div>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              <ExternalIcon width="15" height="15" />
              View site
            </Link>

            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
              >
                <LogoutIcon width="15" height="15" />
                Sign out
              </button>
            </form>

            <div className="mt-2 hidden px-1 lg:block">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      <main id="main" className="min-w-0 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
