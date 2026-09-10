export type Theme = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'portfolio-theme';

/**
 * Runs before first paint (injected into <head>), so the stored theme is
 * applied during the initial style pass and there is no flash of the wrong
 * colours. Kept as a string because it must execute synchronously, ahead of
 * hydration.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})();`;

/**
 * The theme lives in localStorage and on <html data-theme>, both of which are
 * outside React. `useSyncExternalStore` is the correct way to read that, and it
 * avoids the cascading render an effect-plus-setState would cause.
 */

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToTheme(onChange: () => void): () => void {
  listeners.add(onChange);
  // 'storage' fires for changes made in other tabs, keeping them in sync.
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function getThemeSnapshot(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : 'system';
  } catch {
    // Storage can be unavailable (private mode, blocked cookies).
    return 'system';
  }
}

/**
 * The server cannot know the visitor's preference. Returning 'system' means no
 * toggle option is marked active during SSR; React re-reads the real value
 * immediately after hydration.
 */
export function getThemeServerSnapshot(): Theme {
  return 'system';
}

export function setTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);

  try {
    if (theme === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The preference will not persist, but the page still switches.
  }
  emit();
}
