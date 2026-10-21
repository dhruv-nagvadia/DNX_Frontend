import { StorageKeys } from './constants';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * The admin console (/admin/*) and the provider dashboard are separate sites
 * that happen to ship in one app, so each keeps its OWN session. Logging in
 * (or out) as one never touches the other, in the same tab or across tabs —
 * which one a call refers to is decided by the page it's made from.
 */
export type Audience = 'admin' | 'provider';

export function currentAudience(): Audience {
  return window.location.pathname.startsWith('/admin') ? 'admin' : 'provider';
}

function keysFor(audience: Audience) {
  return audience === 'admin'
    ? { access: StorageKeys.adminAccessToken, refresh: StorageKeys.adminRefreshToken }
    : { access: StorageKeys.accessToken, refresh: StorageKeys.refreshToken };
}

/**
 * Where auth tokens live.
 *
 * "Remember me" ticked  → localStorage   (survives closing the browser)
 * "Remember me" cleared → sessionStorage (dies with the tab)
 *
 * Reads check both, so no caller needs to know which one was used.
 * Every method works on the session of the current page's audience.
 */
export const tokenStorage = {
  save({ accessToken, refreshToken }: AuthTokens, remember: boolean): void {
    // Clear first so a session never ends up split across both stores.
    tokenStorage.clear();
    const keys = keysFor(currentAudience());
    const store = remember ? localStorage : sessionStorage;
    store.setItem(keys.access, accessToken);
    store.setItem(keys.refresh, refreshToken);
  },

  getAccessToken(): string | null {
    const { access } = keysFor(currentAudience());
    return localStorage.getItem(access) ?? sessionStorage.getItem(access);
  },

  getRefreshToken(): string | null {
    const { refresh } = keysFor(currentAudience());
    return localStorage.getItem(refresh) ?? sessionStorage.getItem(refresh);
  },

  /** Which store the current session lives in, so a refresh writes back to the same one. */
  isRemembered(): boolean {
    return localStorage.getItem(keysFor(currentAudience()).access) !== null;
  },

  /** Ends the current audience's session only — the other one stays signed in. */
  clear(): void {
    const keys = keysFor(currentAudience());
    for (const store of [localStorage, sessionStorage]) {
      store.removeItem(keys.access);
      store.removeItem(keys.refresh);
    }
  },
};
