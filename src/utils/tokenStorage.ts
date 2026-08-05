import { StorageKeys } from './constants';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Where auth tokens live.
 *
 * "Remember me" ticked  → localStorage   (survives closing the browser)
 * "Remember me" cleared → sessionStorage (dies with the tab)
 *
 * Reads check both, so no caller needs to know which one was used.
 */
export const tokenStorage = {
  save({ accessToken, refreshToken }: AuthTokens, remember: boolean): void {
    // Clear first so a session never ends up split across both stores.
    tokenStorage.clear();
    const store = remember ? localStorage : sessionStorage;
    store.setItem(StorageKeys.accessToken, accessToken);
    store.setItem(StorageKeys.refreshToken, refreshToken);
  },

  getAccessToken(): string | null {
    return (
      localStorage.getItem(StorageKeys.accessToken) ??
      sessionStorage.getItem(StorageKeys.accessToken)
    );
  },

  getRefreshToken(): string | null {
    return (
      localStorage.getItem(StorageKeys.refreshToken) ??
      sessionStorage.getItem(StorageKeys.refreshToken)
    );
  },

  clear(): void {
    for (const store of [localStorage, sessionStorage]) {
      store.removeItem(StorageKeys.accessToken);
      store.removeItem(StorageKeys.refreshToken);
    }
  },
};
