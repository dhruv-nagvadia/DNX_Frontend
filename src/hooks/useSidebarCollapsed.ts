import { useCallback, useState } from 'react';
import { StorageKeys } from '@/utils/constants';

function readStored(): boolean {
  try {
    return localStorage.getItem(StorageKeys.sidebarCollapsed) === 'true';
  } catch {
    return false;
  }
}

/** Whether the app shell's sidebar is shrunk to its icon-only rail, persisted across reloads. */
export function useSidebarCollapsed(): { collapsed: boolean; toggleCollapsed: () => void } {
  const [collapsed, setCollapsed] = useState(readStored);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(StorageKeys.sidebarCollapsed, String(next));
      } catch {
        // Best-effort; ignore storage errors (private mode, quota, etc.)
      }
      return next;
    });
  }, []);

  return { collapsed, toggleCollapsed };
}
