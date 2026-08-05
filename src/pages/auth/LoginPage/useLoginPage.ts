import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLoginMutation } from '@/redux/api/auth/authApi';
import { useAppDispatch } from '@/redux/hooks';
import { setCurrentUser } from '@/redux/slices/userSlice';
import { tokenStorage } from '@/utils/tokenStorage';

import { LoginErrors, LoginForm } from './types';
import { validateLogin } from './validation';

/** All state and handlers for LoginPage. */
export function useLoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear a field's error the moment the user starts correcting it.
    setErrors((prev) => (prev[name as keyof LoginErrors] ? { ...prev, [name]: undefined } : prev));
  }, []);

  /** Validates just the field being left, so errors surface early. */
  const onBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const name = e.target.name as keyof LoginErrors;
      const fieldErrors = validateLogin(form);
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
    },
    [form],
  );

  const onRememberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRemember(e.target.checked);
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);

      const validationErrors = validateLogin(form);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;

      try {
        const result = await login(form).unwrap();
        tokenStorage.save(
          { accessToken: result.accessToken, refreshToken: result.refreshToken },
          remember,
        );
        dispatch(
          setCurrentUser({
            id: result.id,
            email: result.email,
            fullName: result.fullName,
            role: result.role,
          }),
        );
        // Providers see all their businesses; customers go to the home page.
        navigate(result.role === 'PROVIDER' ? '/businesses' : '/');
      } catch {
        setServerError('That email and password don’t match. Please try again.');
      }
    },
    [form, remember, login, dispatch, navigate],
  );

  return {
    form,
    errors,
    serverError,
    isLoading,
    remember,
    onChange,
    onBlur,
    onRememberChange,
    onSubmit,
  };
}
