/** Keys used with localStorage. Centralized so they never drift. */
export const StorageKeys = {
  accessToken: 'dnx.accessToken',
  refreshToken: 'dnx.refreshToken',
  // The admin console is its own "site" inside this app, so it keeps its own
  // session — see utils/tokenStorage.ts.
  adminAccessToken: 'dnx.admin.accessToken',
  adminRefreshToken: 'dnx.admin.refreshToken',
} as const;

export const AppConfig = {
  defaultPageLimit: 20,
} as const;
