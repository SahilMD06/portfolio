'use client';

import { useEffect, useState } from 'react';

import { ArrowUpIcon } from '@/components/ui/icons';
import { getPreference, subscribeToPreferences } from './appearance-store';

/** Re-runs `start` whenever the visitor's motion preference changes. */
function useMotionPreference(start: (allowed: boolean) => void | (() => void)) {
  useEffect(() => {
    let stop: void | (() => void);
    const run = () => {
      if (typeof stop === 'function') stop();
      stop = start(getPreference('motion') === 'on');
    };
    run();
    const unsubscribe = subscribeToPreferences(run);
    return () => {
      unsubscribe();
      if (typeof stop === 'function') stop();
    };
    // `start` is defined inline by each caller and never changes identity in a
    // way that should restart the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Marks [data-reveal] elements with [data-revealed] as they scroll into view;
 * the transition itself lives in globals.css.
 *
 * One IntersectionObserver for the whole page. A MutationObserver picks up
 * sections that stream in later through Suspense, batched to one scan per frame.
 * Elements are unobserved once revealed, so there is no ongoing work.
 */
export function RevealObserver() {
  useMotionPreference((allowed) => {
    const revealAll = () =>
      document
        .querySelectorAll('[data-reveal]:not([data-revealed])')
        .forEach((el) => el.setAttribute('data-revealed', ''));

    if (!allowed) {
      // Still watch for streamed-in sections, but show them straight away.
      revealAll();
      const mo = new MutationObserver(revealAll);
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
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
  });

  return null;
}

/**
 * Drives the signature cursor spotlight.
 *
 * A single passive pointermove listener, throttled to one update per animation
 * frame. It only does work while the pointer is inside a [data-spotlight-group]:
 * it reads the rects of that group's [data-spotlight] elements, then writes the
 * cursor position into --spot-x / --spot-y. Reads happen before writes, so
 * there is no layout thrashing. Skipped entirely on touch devices and when the
 * visitor has turned motion off, where the effect has no meaning.
 */
export function SpotlightController() {
  useMotionPreference((allowed) => {
    if (!allowed) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

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
  });

  return null;
}

/**
 * Counts [data-count] numbers up when they first scroll into view.
 *
 * The final value is what the server rendered, so the figure is correct with
 * scripts disabled, with motion turned off, and to a screen reader — the count
 * only replaces the text for the ~1s it is running.
 */
export function CountUpNumbers() {
  useMotionPreference((allowed) => {
    const nodes = document.querySelectorAll<HTMLElement>('[data-count]');
    if (nodes.length === 0 || !allowed) return;

    const frames = new Map<HTMLElement, number>();

    const run = (el: HTMLElement) => {
      const final = el.dataset.count ?? el.textContent ?? '';
      const target = Number.parseFloat(final);
      if (!Number.isFinite(target)) return;
      const decimals = (final.split('.')[1] ?? '').length;
      const duration = 1100;
      const start = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - t) ** 3;
        el.textContent = (target * eased).toFixed(decimals);
        if (t < 1) frames.set(el, requestAnimationFrame(step));
        else {
          el.textContent = final;
          frames.delete(el);
        }
      };
      frames.set(el, requestAnimationFrame(step));
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.unobserve(entry.target);
          run(entry.target as HTMLElement);
        }
      },
      { threshold: 0.4 },
    );
    nodes.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      frames.forEach((frame, el) => {
        cancelAnimationFrame(frame);
        el.textContent = el.dataset.count ?? el.textContent;
      });
    };
  });

  return null;
}

/** A button that fades in once the page has been scrolled a screen or so. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setVisible(window.scrollY > window.innerHeight * 0.9);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: getPreference('motion') === 'on' ? 'smooth' : 'auto',
        })
      }
      data-visible={visible ? '' : undefined}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      aria-label="Back to top"
      title="Back to top"
      className="to-top grid h-11 w-11 place-items-center rounded-full border border-border-strong bg-surface/90 text-fg-muted backdrop-blur-xl hover:text-accent"
    >
      <ArrowUpIcon width="16" height="16" />
    </button>
  );
}
