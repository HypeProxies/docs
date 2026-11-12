import { THEME_KEY } from './theme-key';

/**
 * Theme: light by default, the system setting while the visitor has not chosen, and their choice
 * (kept in localStorage) once they use the toggle. Base.astro applies a stored choice before first
 * paint. Every change, including a system change, fires a `themechange` event on document.
 */
export type Theme = 'light' | 'dark';

const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

export function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === 'light' || chosen === 'dark') return chosen;
  return systemDark.matches ? 'dark' : 'light';
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked: the choice lasts until the next page.
  }
  document.dispatchEvent(new CustomEvent('themechange'));
}

systemDark.addEventListener('change', () => document.dispatchEvent(new CustomEvent('themechange')));
