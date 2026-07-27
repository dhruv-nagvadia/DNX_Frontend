import { AuthUser } from '../api/auth/types';

export interface UserState {
  isLoggedIn: boolean;
  currentUser: AuthUser | null;
  /** False until the app has finished checking any stored token on load. */
  authReady: boolean;
}
