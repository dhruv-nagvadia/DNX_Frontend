import { StorageKeys } from './constants';

export type ThemeMode = 'light' | 'dark';

/**
 * The user's explicit light/dark choice, or `null` if they've never chosen
 * one (in which case the page is light — see theme.css's `:root` defaults
 * and index.html's pre-paint script). The OS dark-mode setting is ignored.
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

  /** The mode actually in effect right now: the saved choice, else light. */
  resolve(): ThemeMode {
    return themeStorage.get() ?? 'light';
  },
};

/** Applies a mode to the page by setting `data-theme` on the root element. */
export function applyTheme(mode: ThemeMode): void {
  document.documentElement.dataset.theme = mode;
}
