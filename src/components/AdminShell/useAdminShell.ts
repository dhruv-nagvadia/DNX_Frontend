import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { clearCurrentUser } from '@/redux/slices/userSlice';
import { resetAllApiCaches } from '@/redux/resetApiCaches';
import { tokenStorage } from '@/utils/tokenStorage';

/** Account + logout for the admin shell sidebar. */
export function useAdminShell() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.user.currentUser);

  const logout = useCallback(() => {
    tokenStorage.clear();
    dispatch(clearCurrentUser());
    resetAllApiCaches(dispatch);
    navigate('/admin/login', { replace: true });
  }, [dispatch, navigate]);

  return { user, logout };
}
