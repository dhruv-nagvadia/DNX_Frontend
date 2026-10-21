import { useEffect } from 'react';

import { useLazyGetMeQuery } from '@/redux/api/auth/authApi';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setAuthReady, setCurrentUser } from '@/redux/slices/userSlice';
import { currentAudience, tokenStorage } from '@/utils/tokenStorage';

/**
 * On app load, restores the session from a stored token so a page refresh
 * doesn't log the user out. Returns whether the check has finished.
 */
export function useSessionBootstrap(): boolean {
  const dispatch = useAppDispatch();
  const authReady = useAppSelector((s) => s.user.authReady);
  const [getMe] = useLazyGetMeQuery();

  useEffect(() => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      dispatch(setAuthReady());
      return;
    }
    getMe()
      .unwrap()
      .then((user) => {
        // Each site only accepts its own kind of account. This also clears a
        // leftover admin login that older versions saved under the provider
        // keys (they shared one session before the two were separated).
        const belongsHere =
          currentAudience() === 'admin' ? user.role === 'ADMIN' : user.role !== 'ADMIN';
        if (!belongsHere) {
          tokenStorage.clear();
          return;
        }
        dispatch(setCurrentUser(user));
      })
      .catch(() => {
        tokenStorage.clear();
      })
      .finally(() => dispatch(setAuthReady()));
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return authReady;
}
