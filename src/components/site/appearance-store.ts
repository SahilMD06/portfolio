/**
 * Visitor-chosen appearance: colour theme, accent colour, motion and display
 * font. All four live on <html> as data attributes and in localStorage — both
 * outside React — so they are read with useSyncExternalStore rather than
 * effect-plus-setState, and applied before first paint by the init script.
 */

export type Theme = 'light' | 'dark' | 'system';
export type Accent = 'mint' | 'iris' | 'azure' | 'amber' | 'rose';
export type Motion = 'on' | 'off';
export type DisplayFont = 'grotesk' | 'editorial' | 'neutral';

export type Preferences = {
  theme: Theme;
  accent: Accent;
  motion: Motion;
  font: DisplayFont;
};

export type PreferenceKey = keyof Preferences;

export const STORAGE_KEY: Record<PreferenceKey, string> = {
  theme: 'portfolio-theme',
  accent: 'portfolio-accent',
  motion: 'portfolio-motion',
  font: 'portfolio-font',
};

const ATTRIBUTE: Record<PreferenceKey, string> = {
  theme: 'data-theme',
  accent: 'data-accent',
  motion: 'data-motion',
  font: 'data-font',
};

/** The values used when nothing has been chosen (motion is decided by the OS). */
const FALLBACK: Preferences = { theme: 'dark', accent: 'mint', motion: 'on', font: 'grotesk' };

const ALLOWED: { [K in PreferenceKey]: readonly Preferences[K][] } = {
  theme: ['dark', 'light', 'system'],
  accent: ['mint', 'iris', 'azure', 'amber', 'rose'],
  motion: ['on', 'off'],
  font: ['grotesk', 'editorial', 'neutral'],
};

/**
 * Runs before first paint (injected into <head>).
 *
 * - Applies the stored preferences so there is no flash of the wrong colours,
 *   and no animation for someone who has turned motion off.
 * - Motion defaults to whatever the operating system asks for.
 * - Adds `js` to <html>. Scroll-reveal styles only hide content under `.js`, so
 *   if scripts fail to run, everything is simply visible.
 */
export const APPEARANCE_INIT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('js');function g(k,a,f){try{var v=localStorage.getItem(k);return a.indexOf(v)<0?f:v}catch(e){return f}}
d.setAttribute('data-theme',g('${STORAGE_KEY.theme}',['dark','light','system'],'dark'));
d.setAttribute('data-accent',g('${STORAGE_KEY.accent}',['mint','iris','azure','amber','rose'],'mint'));
d.setAttribute('data-font',g('${STORAGE_KEY.font}',['grotesk','editorial','neutral'],'grotesk'));
var m='on';try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)m='off'}catch(e){}
d.setAttribute('data-motion',g('${STORAGE_KEY.motion}',['on','off'],m));})();`;

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToPreferences(onChange: () => void): () => void {
  listeners.add(onChange);
  // Keeps other tabs in sync.
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * Reads from <html>, which the init script has already filled in. Falling back
 * to localStorage covers the case where the attribute was never written.
 */
export function getPreference<K extends PreferenceKey>(key: K): Preferences[K] {
  const allowed = ALLOWED[key] as readonly string[];
  const attribute = document.documentElement.getAttribute(ATTRIBUTE[key]);
  if (attribute && allowed.includes(attribute)) return attribute as Preferences[K];
  try {
    const stored = localStorage.getItem(STORAGE_KEY[key]);
    if (stored && allowed.includes(stored)) return stored as Preferences[K];
  } catch {
    // Storage unavailable (private mode); the fallback still renders.
  }
  return FALLBACK[key];
}

/** Matches the pre-paint default, so SSR and the first client render agree. */
export function getPreferenceServerSnapshot<K extends PreferenceKey>(key: K): Preferences[K] {
  return FALLBACK[key];
}

export function setPreference<K extends PreferenceKey>(key: K, value: Preferences[K]): void {
  document.documentElement.setAttribute(ATTRIBUTE[key], value);
  try {
    localStorage.setItem(STORAGE_KEY[key], value);
  } catch {
    // Preference will not persist, but the page still switches.
  }
  emit();
}

/** True when animation should run: the visitor has not asked for less motion. */
export function motionAllowed(): boolean {
  return getPreference('motion') === 'on';
}

/* Names kept for the theme-only toggle used in the admin dashboard. */
export const THEME_STORAGE_KEY = STORAGE_KEY.theme;

export function getThemeSnapshot(): Theme {
  return getPreference('theme');
}

export function getThemeServerSnapshot(): Theme {
  return FALLBACK.theme;
}

export function setTheme(theme: Theme): void {
  setPreference('theme', theme);
}

export const subscribeToTheme = subscribeToPreferences;
