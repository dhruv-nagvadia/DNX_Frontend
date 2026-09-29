import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { clearCurrentUser } from '@/redux/slices/userSlice';
import { resetAllApiCaches } from '@/redux/resetApiCaches';
import { tokenStorage } from '@/utils/tokenStorage';

/** Account + logout for the shell sidebar. */
export function useAppShell() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.user.currentUser);

  const logout = useCallback(() => {
    tokenStorage.clear();
    dispatch(clearCurrentUser());
    // Otherwise the next account to log in on this tab would see this
    // account's cached data (e.g. "my businesses") until a hard refresh.
    resetAllApiCaches(dispatch);
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  return { user, logout };
}
