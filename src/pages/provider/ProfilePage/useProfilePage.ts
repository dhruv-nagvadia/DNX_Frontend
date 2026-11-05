import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { StorageKeys } from '@/utils/constants';
import { applyTheme, themeStorage } from '@/utils/theme';
import { tokenStorage } from '@/utils/tokenStorage';

export type AccountField = 'fullName' | 'email' | 'phone';
export type AppearanceMode = 'light' | 'dark' | 'system';

/** The server's `{ success: false, message }` text, if the error carries one. */
export function serverMessage(err: unknown): string | null {
  const data = (err as { data?: unknown })?.data;
  if (data && typeof data === 'object' && 'message' in data) {
    const msg = (data as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: AccountField, value: string): string | null {
  const v = value.trim();
  if (field === 'fullName') return v.length >= 2 ? null : 'Enter at least 2 characters.';
  if (field === 'email') return EMAIL_RE.test(v) ? null : 'Enter a valid email address.';
  if (!/^[+\d\s()-]+$/.test(v)) return 'Use digits, spaces, +, ( ) or - only.';
  return v.replace(/\D/g, '').length >= 8 ? null : 'Enter at least 8 digits.';
}

function prefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

/** Light / Dark / System on top of the shared theme util (System = no saved choice). */
function useAppearance() {
  const [mode, setMode] = useState<AppearanceMode>(() => themeStorage.get() ?? 'system');

  // While on System, follow the OS if it flips mid-session.
  useEffect(() => {
    if (mode !== 'system' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [mode]);

  const choose = useCallback((next: AppearanceMode) => {
    if (next === 'system') {
      try {
        localStorage.removeItem(StorageKeys.theme);
      } catch {
        // Best-effort, like themeStorage.set.
      }
      applyTheme(prefersDark() ? 'dark' : 'light');
    } else {
      applyTheme(next);
      themeStorage.set(next);
    }
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
        serverMessage(err) ??
          (status === 409 && editingField === 'email'
            ? 'That email is already in use.'
            : 'Could not save. Please try again.'),
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
