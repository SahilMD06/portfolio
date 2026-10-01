'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';

import {
  DropletIcon,
  MonitorIcon,
  MoonIcon,
  MotionIcon,
  SlidersIcon,
  SunIcon,
  TypeIcon,
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import {
  getPreference,
  getPreferenceServerSnapshot,
  setPreference,
  subscribeToPreferences,
  type Accent,
  type DisplayFont,
  type Motion,
  type PreferenceKey,
  type Preferences,
  type Theme,
} from './appearance-store';

function usePreference<K extends PreferenceKey>(key: K): Preferences[K] {
  return useSyncExternalStore(
    subscribeToPreferences,
    () => getPreference(key),
    () => getPreferenceServerSnapshot(key),
  );
}

const THEMES: { value: Theme; label: string; Icon: typeof SunIcon }[] = [
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
];

/* Swatch colours are the dark-theme tone of each palette in globals.css. */
const ACCENTS: { value: Accent; label: string; swatch: string }[] = [
  { value: 'mint', label: 'Mint', swatch: '#5fd9b4' },
  { value: 'iris', label: 'Iris', swatch: '#a794ff' },
  { value: 'azure', label: 'Azure', swatch: '#5fb6f9' },
  { value: 'amber', label: 'Amber', swatch: '#f3c169' },
  { value: 'rose', label: 'Rose', swatch: '#ff8fa6' },
];

const FONTS: { value: DisplayFont; label: string; className: string }[] = [
  { value: 'grotesk', label: 'Grotesk', className: 'font-display-grotesk' },
  { value: 'editorial', label: 'Editorial', className: 'font-display-editorial' },
  { value: 'neutral', label: 'Neutral', className: 'font-sans' },
];

const rowClass = 'flex items-center justify-between gap-4 px-3 py-2.5';
const optionClass =
  'inline-flex h-7 items-center justify-center rounded-full px-2.5 text-[0.78rem] transition-colors duration-150';

/**
 * Appearance controls: theme, accent colour, motion and display font.
 *
 * Everything is applied instantly to <html> and remembered in localStorage, so
 * a visitor can dial the site to their taste and find it that way next time.
 */
export function AppearancePanel({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const theme = usePreference('theme');
  const accent = usePreference('accent');
  const motion = usePreference('motion');
  const font = usePreference('font');

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
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

  const motionOn = motion === 'on';
  const setMotion = (value: Motion) => setPreference('motion', value);

  return (
    <div className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Appearance settings"
        title="Appearance"
        className={cn(
          'grid h-9 w-9 place-items-center rounded-full border border-border bg-surface-2/60 transition-colors duration-150',
          open ? 'border-accent-line text-accent' : 'text-fg-muted hover:text-fg',
        )}
      >
        <SlidersIcon width="15" height="15" />
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          className="enter absolute top-full right-0 z-50 mt-2 w-[17.5rem] rounded-2xl border border-border-strong bg-surface/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          <p className="t-label px-3 pt-2 pb-1">Appearance</p>

          <div className={rowClass}>
            <span className="flex items-center gap-2 text-[0.85rem] text-fg-muted">
              <SunIcon width="14" height="14" />
              Theme
            </span>
            <div className="flex items-center gap-0.5 rounded-full border border-border bg-surface-2/60 p-0.5">
              {THEMES.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPreference('theme', value)}
                  aria-label={`${label} theme`}
                  aria-pressed={theme === value}
                  title={label}
                  className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-150',
                    theme === value ? 'bg-surface-3 text-fg' : 'text-fg-subtle hover:text-fg',
                  )}
                >
                  <Icon width="14" height="14" />
                </button>
              ))}
            </div>
          </div>

          <div className={rowClass}>
            <span className="flex items-center gap-2 text-[0.85rem] text-fg-muted">
              <DropletIcon width="14" height="14" />
              Accent
            </span>
            <div className="flex items-center gap-1.5">
              {ACCENTS.map(({ value, label, swatch }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPreference('accent', value)}
                  aria-label={`${label} accent`}
                  aria-pressed={accent === value}
                  title={label}
                  className={cn(
                    'h-6 w-6 rounded-full border transition-transform duration-150 hover:scale-110',
                    accent === value ? 'border-fg' : 'border-border',
                  )}
                  style={{ background: swatch }}
                />
              ))}
            </div>
          </div>

          <div className={rowClass}>
            <span className="flex items-center gap-2 text-[0.85rem] text-fg-muted">
              <MotionIcon width="14" height="14" />
              Animations
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={motionOn}
              onClick={() => setMotion(motionOn ? 'off' : 'on')}
              className={cn(
                'relative h-6 w-11 rounded-full border transition-colors duration-200',
                motionOn ? 'border-accent-line bg-accent-subtle' : 'border-border bg-surface-2',
              )}
            >
              <span className="sr-only">{motionOn ? 'Turn animations off' : 'Turn animations on'}</span>
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-1/2 block h-4 w-4 -translate-y-1/2 rounded-full transition-[left,background-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  motionOn ? 'left-6 bg-accent' : 'left-1 bg-fg-subtle',
                )}
              />
            </button>
          </div>

          <div className={cn(rowClass, 'flex-wrap')}>
            <span className="flex items-center gap-2 text-[0.85rem] text-fg-muted">
              <TypeIcon width="14" height="14" />
              Headings
            </span>
            <div className="flex items-center gap-0.5 rounded-full border border-border bg-surface-2/60 p-0.5">
              {FONTS.map(({ value, label, className: fontClass }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPreference('font', value)}
                  aria-pressed={font === value}
                  className={cn(
                    optionClass,
                    fontClass,
                    font === value ? 'bg-surface-3 text-fg' : 'text-fg-subtle hover:text-fg',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
