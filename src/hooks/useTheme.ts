import { useCallback, useState } from 'react';
import { ThemeMode, applyTheme, themeStorage } from '@/utils/theme';

/**
 * The light/dark mode toggle. index.html's inline script already applies the
 * right mode before first paint (no flash) — this hook just keeps React's
 * view of it in sync so the toggle button can show the right icon, and
 * re-applies + persists whenever the user flips it.
 */
export function useTheme(): { theme: ThemeMode; toggleTheme: () => void } {
  const [theme, setTheme] = useState<ThemeMode>(() => themeStorage.resolve());

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      themeStorage.set(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
