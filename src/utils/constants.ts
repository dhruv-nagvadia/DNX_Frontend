/** Keys used with localStorage. Centralized so they never drift. */
export const StorageKeys = {
  accessToken: 'dnx.accessToken',
  refreshToken: 'dnx.refreshToken',
} as const;

export const AppConfig = {
  defaultPageLimit: 20,
} as const;
