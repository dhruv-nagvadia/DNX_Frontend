import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLoginMutation } from '@/redux/api/auth/authApi';
import { useAppDispatch } from '@/redux/hooks';
import { setCurrentUser } from '@/redux/slices/userSlice';
import { StorageKeys } from '@/utils/constants';

import { LoginErrors, LoginForm } from './types';
import { validateLogin } from './validation';

/** All state and handlers for LoginPage. */
export function useLoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);

      const validationErrors = validateLogin(form);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;

      try {
        const result = await login(form).unwrap();
        localStorage.setItem(StorageKeys.accessToken, result.accessToken);
        localStorage.setItem(StorageKeys.refreshToken, result.refreshToken);
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
        setServerError('Invalid email or password.');
      }
    },
    [form, login, dispatch, navigate],
  );

  return { form, errors, serverError, isLoading, onChange, onSubmit };
}
