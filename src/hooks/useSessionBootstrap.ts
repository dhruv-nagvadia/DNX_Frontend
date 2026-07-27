import { useEffect } from 'react';

import { useLazyGetMeQuery } from '@/redux/api/auth/authApi';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setAuthReady, setCurrentUser } from '@/redux/slices/userSlice';
import { StorageKeys } from '@/utils/constants';

/**
 * On app load, restores the session from a stored token so a page refresh
 * doesn't log the user out. Returns whether the check has finished.
 */
export function useSessionBootstrap(): boolean {
  const dispatch = useAppDispatch();
  const authReady = useAppSelector((s) => s.user.authReady);
  const [getMe] = useLazyGetMeQuery();

  useEffect(() => {
    const token = localStorage.getItem(StorageKeys.accessToken);
    if (!token) {
      dispatch(setAuthReady());
      return;
    }
    getMe()
      .unwrap()
      .then((user) => dispatch(setCurrentUser(user)))
      .catch(() => {
        localStorage.removeItem(StorageKeys.accessToken);
        localStorage.removeItem(StorageKeys.refreshToken);
      })
      .finally(() => dispatch(setAuthReady()));
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return authReady;
}
