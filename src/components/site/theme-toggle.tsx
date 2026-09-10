'use client';

import { useSyncExternalStore } from 'react';

import { MonitorIcon, MoonIcon, SunIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import {
  getThemeServerSnapshot,
  getThemeSnapshot,
  setTheme,
  subscribeToTheme,
  type Theme,
} from './theme-store';

export { THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from './theme-store';
export type { Theme };

const OPTIONS: { value: Theme; label: string; Icon: typeof SunIcon }[] = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
];

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface p-0.5"
      role="group"
      aria-label="Colour theme"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-label={`${label} theme`}
            aria-pressed={active}
            title={`${label} theme`}
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150',
              active ? 'bg-surface-2 text-fg' : 'text-fg-subtle hover:text-fg',
            )}
          >
            <Icon width="15" height="15" />
          </button>
        );
      })}
    </div>
  );
}
