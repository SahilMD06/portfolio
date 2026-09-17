'use client';

import { useEffect } from 'react';

/**
 * Marks [data-reveal] elements with [data-revealed] as they scroll into view;
 * the transition itself lives in globals.css.
 *
 * One IntersectionObserver for the whole page. A MutationObserver picks up
 * sections that stream in later through Suspense, batched to one scan per frame.
 * Elements are unobserved once revealed, so there is no ongoing work.
 */
export function RevealObserver() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document
        .querySelectorAll('[data-reveal]:not([data-revealed])')
        .forEach((el) => el.setAttribute('data-revealed', ''));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-revealed', '');
          io.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.06 },
    );

    const scan = () =>
      document
        .querySelectorAll('[data-reveal]:not([data-revealed])')
        .forEach((el) => io.observe(el));
    scan();

    let frame = 0;
    const mo = new MutationObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        scan();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}

/**
 * Drives the signature cursor spotlight.
 *
 * A single passive pointermove listener, throttled to one update per animation
 * frame. It only does work while the pointer is inside a [data-spotlight-group]:
 * it reads the rects of that group's [data-spotlight] elements, then writes the
 * cursor position into --spot-x / --spot-y. Reads happen before writes, so
 * there is no layout thrashing. Skipped entirely on touch devices and for
 * reduced motion, where the effect has no meaning.
 */
export function SpotlightController() {
  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finePointer.matches || reduced.matches) return;

    let frame = 0;
    let last: PointerEvent | null = null;

    const update = () => {
      frame = 0;
      const event = last;
      if (!event || !(event.target instanceof Element)) return;
      const group = event.target.closest<HTMLElement>('[data-spotlight-group]');
      if (!group) return;

      const targets = [
        ...(group.hasAttribute('data-spotlight') ? [group] : []),
        ...group.querySelectorAll<HTMLElement>('[data-spotlight]'),
      ];
      const rects = targets.map((el) => el.getBoundingClientRect());
      targets.forEach((el, i) => {
        const rect = rects[i]!;
        el.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
        el.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
      });
    };

    const onMove = (event: PointerEvent) => {
      last = event;
      if (!frame) frame = requestAnimationFrame(update);
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
