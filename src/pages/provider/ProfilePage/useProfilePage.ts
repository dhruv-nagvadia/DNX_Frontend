import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  useChangePasswordMutation,
  useDeleteAccountMutation,
  useUpdateMeMutation,
} from '@/redux/api/auth/authApi';
import { useGetMyBusinessesQuery, useUploadImageMutation } from '@/redux/api/provider/providerApi';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { resetAllApiCaches } from '@/redux/resetApiCaches';
import { clearCurrentUser, setCurrentUser } from '@/redux/slices/userSlice';
import { applyTheme, themeStorage } from '@/utils/theme';
import { tokenStorage } from '@/utils/tokenStorage';
import { apiErrorMessage } from '@/utils/apiError';

export type AccountField = 'fullName' | 'email' | 'phone';
export type AppearanceMode = 'light' | 'dark';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: AccountField, value: string): string | null {
  const v = value.trim();
  if (field === 'fullName') return v.length >= 2 ? null : 'Enter at least 2 characters.';
  if (field === 'email') return EMAIL_RE.test(v) ? null : 'Enter a valid email address.';
  if (!/^[+\d\s()-]+$/.test(v)) return 'Use digits, spaces, +, ( ) or - only.';
  return v.replace(/\D/g, '').length >= 8 ? null : 'Enter at least 8 digits.';
}

/** Light / Dark on top of the shared theme util (light is the default). */
function useAppearance() {
  const [mode, setMode] = useState<AppearanceMode>(() => themeStorage.resolve());

  const choose = useCallback((next: AppearanceMode) => {
    applyTheme(next);
    themeStorage.set(next);
    setMode(next);
  }, []);

  return { appearance: mode, setAppearance: choose };
}

/** Account details, aggregate stats, security actions and preferences. */
export function useProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.user.currentUser);
  const { data: businesses = [], isLoading } = useGetMyBusinessesQuery();
  const [updateMe, { isLoading: saving }] = useUpdateMeMutation();
  const [uploadImage, { isLoading: uploadingPhoto }] = useUploadImageMutation();
  const [changePasswordReq, { isLoading: changingPassword }] = useChangePasswordMutation();
  const [deleteAccountReq, { isLoading: deleting }] = useDeleteAccountMutation();

  const appearance = useAppearance();
  const [editingField, setEditingField] = useState<AccountField | null>(null);
  const [draft, setDraft] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const services = businesses.reduce((sum, b) => sum + b.services.length, 0);
    const products = businesses.reduce((sum, b) => sum + (b.products?.length ?? 0), 0);
    // Weighted by review count, so a 5★ from one review doesn't dominate.
    const totalCount = businesses.reduce((sum, b) => sum + (b.ratingCount > 0 ? b.ratingCount : 0), 0);
    const avgRating = totalCount
      ? businesses.reduce((sum, b) => sum + (b.ratingCount > 0 ? b.ratingAvg * b.ratingCount : 0), 0) /
        totalCount
      : null;
    return { businesses: businesses.length, services, products, avgRating };
  }, [businesses]);

  const startEdit = useCallback(
    (field: AccountField) => {
      setDraft((field === 'phone' ? user?.phone : user?.[field]) ?? '');
      setFieldError(null);
      setEditingField(field);
    },
    [user],
  );
  const cancelEdit = () => {
    setEditingField(null);
    setFieldError(null);
  };
  const onDraft = (value: string) => {
    setDraft(value);
    if (fieldError) setFieldError(null);
  };

  const saveField = async () => {
    if (!editingField) return;
    const invalid = validateField(editingField, draft);
    if (invalid) {
      setFieldError(invalid);
      return;
    }
    setFieldError(null);
    try {
      const updated = await updateMe({ [editingField]: draft.trim() }).unwrap();
      dispatch(setCurrentUser(updated));
      setEditingField(null);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      setFieldError(
        apiErrorMessage(
          err,
          status === 409 && editingField === 'email'
            ? 'That email is already in use.'
            : 'Could not save. Please try again.',
        ),
      );
    }
  };

  /** Uploads a new avatar photo, then saves its URL onto the account. */
  const changePhoto = async (file: File) => {
    setPhotoError(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { url } = await uploadImage(fd).unwrap();
      const updated = await updateMe({ avatarUrl: url }).unwrap();
      dispatch(setCurrentUser(updated));
    } catch {
      setPhotoError('Could not upload that photo. Please try again.');
    }
  };

  /** Same teardown as the sidebar's logout. */
  const logout = useCallback(() => {
    tokenStorage.clear();
    dispatch(clearCurrentUser());
    resetAllApiCaches(dispatch);
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  const changePassword = (currentPassword: string, newPassword: string) =>
    changePasswordReq({ currentPassword, newPassword }).unwrap();

  const deleteAccount = async (password: string) => {
    await deleteAccountReq({ password }).unwrap();
    logout();
  };

  return {
    user,
    businesses,
    isLoading,
    stats,
    editingField,
    draft,
    fieldError,
    saving,
    startEdit,
    cancelEdit,
    onDraft,
    saveField,
    photoError,
    uploadingPhoto,
    changePhoto,
    logout,
    changePassword,
    changingPassword,
    deleteAccount,
    deleting,
    ...appearance,
    navigate,
  };
}
