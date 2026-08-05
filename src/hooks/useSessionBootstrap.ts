import { useEffect } from 'react';

import { useLazyGetMeQuery } from '@/redux/api/auth/authApi';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setAuthReady, setCurrentUser } from '@/redux/slices/userSlice';
import { tokenStorage } from '@/utils/tokenStorage';

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
      .then((user) => dispatch(setCurrentUser(user)))
      .catch(() => {
        tokenStorage.clear();
      })
      .finally(() => dispatch(setAuthReady()));
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return authReady;
}
