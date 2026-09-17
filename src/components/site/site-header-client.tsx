'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { ThemeToggle } from './theme-toggle';
import { ArrowRightIcon, CloseIcon, MenuIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

export interface NavItem {
  id: string;
  label: string;
}

export function SiteHeaderClient({ name, items }: { name: string; items: NavItem[] }) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close the menu on navigation, adjusting state during render rather than in
  // an effect (React's documented pattern for resetting state on prop change).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  // Escape and outside-click close the mobile menu; focus returns to the toggle.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  // Scroll-spy with IntersectionObserver: no per-frame scroll handler.
  useEffect(() => {
    if (!isHome) return;
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        setActiveId(items.find((item) => visible.has(item.id))?.id ?? null);
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
    // Sections stream in after first paint; re-run when the path changes only.
  }, [isHome, items]);

  const activeSectionId = isHome ? activeId : null;
  const href = (id: string) => (isHome ? `#${id}` : `/#${id}`);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <header className="site-header-bar sticky top-0 z-50 border-b backdrop-blur-xl">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-content items-center gap-4 px-5 sm:px-8"
      >
        <Link href="/" className="group mr-auto flex items-center gap-2.5 rounded-lg">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-lg border border-border-strong bg-surface-2 font-mono text-[0.7rem] font-medium tracking-tight text-fg transition-colors duration-200 group-hover:border-accent-line group-hover:text-accent"
          >
            {initials}
          </span>
          <span className="text-[0.95rem] font-medium tracking-tight">{name}</span>
        </Link>

        <ul className="hidden items-center lg:flex">
          {items.map((item) => {
            const active = activeSectionId === item.id;
            return (
              <li key={item.id}>
                <Link
                  href={href(item.id)}
                  aria-current={active ? 'location' : undefined}
                  className={cn(
                    'relative block px-3 py-2 text-[0.85rem] transition-colors duration-200',
                    active ? 'text-fg' : 'text-fg-muted hover:text-fg',
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-3 -bottom-px h-px origin-center bg-accent transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                      active ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        <Link href={href('contact')} className="btn btn-primary btn-sm hidden lg:inline-flex">
          Let&apos;s talk
          <ArrowRightIcon width="14" height="14" className="arrow-nudge" />
        </Link>

        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface-2 text-fg-muted transition-colors hover:text-fg lg:hidden"
        >
          {open ? <CloseIcon width="16" height="16" /> : <MenuIcon width="16" height="16" />}
        </button>
      </nav>

      {/* Reading progress, driven by a CSS scroll timeline. */}
      <span
        aria-hidden="true"
        className="scroll-progress pointer-events-none absolute inset-x-0 -bottom-px h-px bg-accent/70"
      />

      {open ? (
        <div
          ref={panelRef}
          id="mobile-menu"
          className="enter absolute inset-x-3 top-full mt-2 rounded-2xl border border-border-strong bg-surface/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl lg:hidden"
          style={{ maxHeight: 'calc(100dvh - 5rem)', overflowY: 'auto' }}
        >
          <ul>
            {items.map((item, index) => (
              <li key={item.id}>
                <Link
                  href={href(item.id)}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-4 rounded-xl px-3 py-2.5 text-[0.95rem] text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                >
                  <span className="font-mono text-[0.7rem] text-fg-subtle">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between border-t border-border px-3 pt-3 pb-1">
            <span className="t-label">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      ) : null}
    </header>
  );
}
