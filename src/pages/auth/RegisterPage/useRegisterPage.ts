import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useRegisterMutation } from '@/redux/api/auth/authApi';
import { useAppDispatch } from '@/redux/hooks';
import { setCurrentUser } from '@/redux/slices/userSlice';
import { tokenStorage } from '@/utils/tokenStorage';

import { RegisterErrors, RegisterForm } from './types';
import { validateRegister } from './validation';

const EMPTY: RegisterForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
};

/** All state and handlers for RegisterPage. Registers the account as a PROVIDER. */
export function useRegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [registerProvider, { isLoading }] = useRegisterMutation();

  const [form, setForm] = useState<RegisterForm>(EMPTY);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  // True when the email is already taken, so the UI can offer sign-in instead.
  const [accountExists, setAccountExists] = useState(false);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    // The phone field is digits-only and capped at 10, so it can't drift out of shape.
    const next =
      type === 'checkbox'
        ? checked
        : name === 'phone'
          ? value.replace(/\D/g, '').slice(0, 10)
          : value;

    setForm((prev) => ({ ...prev, [name]: next }));
    setErrors((prev) =>
      prev[name as keyof RegisterErrors] ? { ...prev, [name]: undefined } : prev,
    );
  }, []);

  /** Validates just the field being left, so errors surface before submit. */
  const onBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const name = e.target.name as keyof RegisterErrors;
      const fieldErrors = validateRegister(form);
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
    },
    [form],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);
      setAccountExists(false);

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

        // A fresh signup is an intentional session — keep them signed in.
        tokenStorage.save(
          { accessToken: result.accessToken, refreshToken: result.refreshToken },
          true,
        );
        dispatch(
          setCurrentUser({
            id: result.id,
            email: result.email,
            fullName: result.fullName,
            role: result.role,
          }),
        );
        // Next step: create their first business.
        navigate('/businesses/new');
      } catch (err) {
        const status = (err as { status?: number })?.status;

        if (status === 409) {
          // One person can be both a customer and a business owner, so an
          // existing email means "sign in" — never "use another address".
          setAccountExists(true);
          setServerError(
            'You already have a DNX account with this email. Sign in and you can list your business from there.',
          );
          return;
        }
        setServerError('Something went wrong while creating your account. Please try again.');
      }
    },
    [form, registerProvider, dispatch, navigate],
  );

  return { form, errors, serverError, accountExists, isLoading, onChange, onBlur, onSubmit };
}
