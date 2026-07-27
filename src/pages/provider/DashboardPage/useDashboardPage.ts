import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  useGetMyProviderQuery,
  useUploadProviderImagesMutation,
} from '@/redux/api/provider/providerApi';
import { useAppDispatch } from '@/redux/hooks';
import { clearCurrentUser } from '@/redux/slices/userSlice';
import { StorageKeys } from '@/utils/constants';

/** Loads the provider's own profile and exposes image-upload + logout actions. */
export function useDashboardPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: provider, isLoading, error } = useGetMyProviderQuery();
  const [uploadImages, { isLoading: uploading }] = useUploadProviderImagesMutation();

  // 404 = provider hasn't created a profile yet → send them to onboarding.
  const noProfile = !!error && (error as { status?: number }).status === 404;

  const addImages = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const fd = new FormData();
      Array.from(fileList).forEach((file) => fd.append('images', file));
      try {
        await uploadImages(fd).unwrap();
      } catch {
        // Errors surface via the mutation state; keep the UI resilient.
      }
    },
    [uploadImages],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(StorageKeys.accessToken);
    localStorage.removeItem(StorageKeys.refreshToken);
    dispatch(clearCurrentUser());
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  return { provider, isLoading, noProfile, uploading, addImages, logout };
}
