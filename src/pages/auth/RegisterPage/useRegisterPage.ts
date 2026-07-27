import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useRegisterMutation } from '@/redux/api/auth/authApi';
import { useAppDispatch } from '@/redux/hooks';
import { setCurrentUser } from '@/redux/slices/userSlice';
import { StorageKeys } from '@/utils/constants';

import { RegisterErrors, RegisterForm } from './types';
import { validateRegister } from './validation';

const EMPTY: RegisterForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

/** All state and handlers for RegisterPage. Registers the account as a PROVIDER. */
export function useRegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [registerProvider, { isLoading }] = useRegisterMutation();

  const [form, setForm] = useState<RegisterForm>(EMPTY);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);

      const validationErrors = validateRegister(form);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;

      try {
        const result = await registerProvider({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          role: 'PROVIDER',
        }).unwrap();

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
        // Next step: add business details.
        navigate('/onboarding');
      } catch (err) {
        const status = (err as { status?: number })?.status;
        setServerError(
          status === 409
            ? 'An account with this email already exists.'
            : 'Something went wrong. Please try again.',
        );
      }
    },
    [form, registerProvider, dispatch, navigate],
  );

  return { form, errors, serverError, isLoading, onChange, onSubmit };
}
