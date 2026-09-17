export type Theme = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'portfolio-theme';

/**
 * Runs before first paint (injected into <head>).
 *
 * - Applies the stored theme so there is no flash of the wrong colours. Dark is
 *   the default when nothing has been chosen.
 * - Adds `js` to <html>. Scroll-reveal styles only hide content under `.js`, so
 *   if scripts fail to run, everything is simply visible.
 */
export const THEME_INIT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('js');try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');d.setAttribute('data-theme',t==='light'||t==='system'?t:'dark')}catch(e){d.setAttribute('data-theme','dark')}})();`;

/**
 * The theme lives in localStorage and on <html data-theme>, both outside React,
 * so it is read with useSyncExternalStore rather than effect-plus-setState.
 */
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToTheme(onChange: () => void): () => void {
  listeners.add(onChange);
  // Keeps other tabs in sync.
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function getThemeSnapshot(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'system' ? stored : 'dark';
  } catch {
    return 'dark';
  }
}

/** Matches the pre-paint default, so SSR and first client render agree. */
export function getThemeServerSnapshot(): Theme {
  return 'dark';
}

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Preference will not persist, but the page still switches.
  }
  emit();
}
