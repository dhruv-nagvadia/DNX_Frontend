import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLoginAdminMutation } from '@/redux/api/admin/adminApi';
import { useAppDispatch } from '@/redux/hooks';
import { resetAllApiCaches } from '@/redux/resetApiCaches';
import { setCurrentUser } from '@/redux/slices/userSlice';
import { tokenStorage } from '@/utils/tokenStorage';

import { AdminLoginErrors, AdminLoginForm } from './types';
import { validateAdminLogin } from './validation';

/** All state and handlers for AdminLoginPage. */
export function useAdminLoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loginAdmin, { isLoading }] = useLoginAdminMutation();

  const [form, setForm] = useState<AdminLoginForm>({ email: '', password: '' });
  const [errors, setErrors] = useState<AdminLoginErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) =>
      prev[name as keyof AdminLoginErrors] ? { ...prev, [name]: undefined } : prev,
    );
  }, []);

  const onBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const name = e.target.name as keyof AdminLoginErrors;
      const fieldErrors = validateAdminLogin(form);
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
    },
    [form],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);

      const validationErrors = validateAdminLogin(form);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;

      try {
        const result = await loginAdmin(form).unwrap();
        // Admin sessions always persist like a "remembered" provider session —
        // there's no public login form offering a choice here.
        tokenStorage.save(
          { accessToken: result.accessToken, refreshToken: result.refreshToken },
          true,
        );
        resetAllApiCaches(dispatch);
        dispatch(
          setCurrentUser({
            id: result.id,
            email: result.email,
            fullName: result.fullName,
            role: result.role,
          }),
        );
        navigate('/admin/dashboard');
      } catch {
        setServerError('That email and password don’t match. Please try again.');
      }
    },
    [form, loginAdmin, dispatch, navigate],
  );

  return {
    form,
    errors,
    serverError,
    isLoading,
    onChange,
    onBlur,
    onSubmit,
  };
}
