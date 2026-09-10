'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { ThemeToggle } from './theme-toggle';
import { CloseIcon, MenuIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

/**
 * Section links. On the homepage these are in-page anchors; from any other
 * route they become `/#section` so navigation still works.
 */
const NAV_ITEMS = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'education', label: 'Education' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'contact', label: 'Contact' },
] as const;

export function SiteHeader({ name }: { name: string }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close the mobile menu when the route changes. Adjusting state during
  // render (React's documented pattern for "reset state when a prop changes")
  // avoids the cascading re-render an effect would cause.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Lock scroll and wire Escape while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  /*
   * Scroll-spy via IntersectionObserver rather than a scroll handler: the
   * browser does the work off the main thread and no listener fires per frame.
   */
  useEffect(() => {
    // Off the homepage there are no sections to track; `activeSectionId` below
    // already resolves to null, so no state update is needed here.
    if (!isHome) return;
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Highest section still on screen wins.
        const firstVisible = NAV_ITEMS.find((item) => visible.has(item.id));
        setActiveId(firstVisible?.id ?? null);
      },
      { rootMargin: '-72px 0px -55% 0px', threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [isHome]);

  const activeSectionId = isHome ? activeId : null;
  const href = (id: string) => (isHome ? `#${id}` : `/#${id}`);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/85 backdrop-blur-sm">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-content items-center gap-4 px-5 sm:px-6">
        <Link
          href="/"
          className="mr-auto rounded-sm text-[0.95rem] font-semibold tracking-tight hover:text-accent"
        >
          {name}
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.id}>
              <Link
                href={href(item.id)}
                aria-current={activeSectionId === item.id ? 'true' : undefined}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150',
                  activeSectionId === item.id
                    ? 'text-accent'
                    : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <ThemeToggle />

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted hover:text-fg lg:hidden"
        >
          {open ? <CloseIcon width="18" height="18" /> : <MenuIcon width="18" height="18" />}
        </button>
      </nav>

      {open ? (
        <div
          id="mobile-menu"
          className="border-t border-border bg-bg lg:hidden"
          // Height-limited and scrollable so the menu works on a 320px-wide,
          // short viewport (e.g. landscape phone).
          style={{ maxHeight: 'calc(100dvh - 4rem)', overflowY: 'auto' }}
        >
          <ul className="mx-auto max-w-content px-3 py-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <Link
                  href={href(item.id)}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-[0.95rem] text-fg-muted hover:bg-surface-2 hover:text-fg"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <button ref={closeButtonRef} className="sr-only" onClick={() => setOpen(false)}>
            Close menu
          </button>
        </div>
      ) : null}
    </header>
  );
}
