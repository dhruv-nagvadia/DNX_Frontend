import { StorageKeys } from './constants';

export type ThemeMode = 'light' | 'dark';

/** Reads the system preference — the fallback for a visitor with no saved choice. */
function prefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

/**
 * The user's explicit light/dark choice, or `null` if they've never chosen
 * one (in which case the page follows the system preference — see
 * theme.css's `prefers-color-scheme` block and index.html's pre-paint script).
 */
export const themeStorage = {
  get(): ThemeMode | null {
    try {
      const saved = localStorage.getItem(StorageKeys.theme);
      return saved === 'light' || saved === 'dark' ? saved : null;
    } catch {
      return null;
    }
  },

  set(mode: ThemeMode): void {
    try {
      localStorage.setItem(StorageKeys.theme, mode);
    } catch {
      // Best-effort; ignore storage errors (private mode, quota, etc.)
    }
  },

  /** The mode actually in effect right now: the saved choice, else the system's. */
  resolve(): ThemeMode {
    return themeStorage.get() ?? (prefersDark() ? 'dark' : 'light');
  },
};

/** Applies a mode to the page by setting `data-theme` on the root element. */
export function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
}
