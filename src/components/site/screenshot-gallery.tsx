'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ArrowLeftIcon, ArrowRightIcon, CloseIcon } from '@/components/ui/icons';

export interface GalleryItem {
  id: number;
  url: string;
  alt: string;
  caption: string | null;
  width: number | null;
  height: number | null;
}

/**
 * Screenshots as a grid of even thumbnails rather than a column of full-width
 * images: the page stays short, and any shot opens full size on click.
 *
 * The dialog is keyboard-operable (Escape closes, arrows move, Tab is trapped)
 * and returns focus to the thumbnail it was opened from.
 */
export function ScreenshotGallery({ items }: { items: GalleryItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const close = useCallback(() => {
    setOpenIndex((current) => {
      if (current !== null) triggerRefs.current[current]?.focus();
      return null;
    });
  }, []);

  const step = useCallback(
    (delta: number) => setOpenIndex((current) => (current === null ? null : (current + delta + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (openIndex === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowRight') {
        step(1);
      } else if (event.key === 'ArrowLeft') {
        step(-1);
      } else if (event.key === 'Tab') {
        // Keep focus inside the dialog.
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button');
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [openIndex, close, step]);

  const active = openIndex === null ? null : items[openIndex];

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {items.map((item, index) => (
          <li key={item.id} data-reveal="scale" style={{ '--i': index } as React.CSSProperties}>
            <button
              ref={(node) => {
                triggerRefs.current[index] = node;
              }}
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`Enlarge screenshot ${index + 1} of ${items.length}${item.caption ? `: ${item.caption}` : ''}`}
              className="group surface surface-interactive block w-full overflow-hidden p-0 text-left"
            >
              <span className="relative block aspect-[16/10] overflow-hidden rounded-[calc(var(--radius-card)-1px)] bg-surface-2">
                <Image
                  src={item.url}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 1024px) 23rem, (min-width: 640px) 30vw, 45vw"
                  quality={90}
                  className="media-zoom object-cover object-top"
                  loading="lazy"
                />
              </span>
              {item.caption ? (
                <span className="block px-3 py-2.5 text-xs leading-snug text-fg-subtle transition-colors group-hover:text-fg-muted">
                  {item.caption}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      {active ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={active.caption ?? active.alt}
          tabIndex={-1}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          className="enter-fade fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-bg/92 p-4 backdrop-blur-xl sm:p-8"
        >
          <div className="flex w-full max-w-6xl items-center justify-between gap-4">
            <span className="t-label">
              {openIndex! + 1} / {items.length}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface-2 text-fg-muted transition-colors hover:text-fg"
            >
              <CloseIcon width="16" height="16" />
            </button>
          </div>

          <Image
            src={active.url}
            alt={active.alt}
            width={active.width ?? 1600}
            height={active.height ?? 900}
            sizes="92vw"
            quality={90}
            priority
            className="max-h-[72vh] w-auto max-w-full rounded-card border border-border object-contain"
          />

          <div className="flex w-full max-w-6xl items-center gap-4">
            {items.length > 1 ? (
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous screenshot"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-fg-muted transition-colors hover:text-fg"
              >
                <ArrowLeftIcon width="16" height="16" />
              </button>
            ) : null}
            {active.caption ? (
              <p className="min-w-0 flex-1 text-center text-sm text-fg-muted">{active.caption}</p>
            ) : (
              <span className="flex-1" />
            )}
            {items.length > 1 ? (
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next screenshot"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-fg-muted transition-colors hover:text-fg"
              >
                <ArrowRightIcon width="16" height="16" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
