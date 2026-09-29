import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
} from '@/redux/api/auth/authApi';

import { EmailErrors, EmailForm, ForgotPasswordStep, ResetErrors, ResetForm } from './types';
import { validateEmail, validateReset } from './validation';

const serverMessage = (err: unknown, fallback: string) =>
  (err as { data?: { message?: string } })?.data?.message ?? fallback;

/** All state and handlers for the two-step forgot-password flow. */
export function useForgotPasswordPage() {
  const navigate = useNavigate();
  const [requestReset, { isLoading: sending }] = useRequestPasswordResetMutation();
  const [resetPassword, { isLoading: resetting }] = useResetPasswordMutation();

  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [emailForm, setEmailForm] = useState<EmailForm>({ email: '' });
  const [emailErrors, setEmailErrors] = useState<EmailErrors>({});
  const [resetForm, setResetForm] = useState<ResetForm>({
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [resetErrors, setResetErrors] = useState<ResetErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const onEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailForm({ email: e.target.value });
    setEmailErrors((prev) => (prev.email ? {} : prev));
  }, []);

  const onResetChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const next = name === 'otp' ? value.replace(/\D/g, '').slice(0, 6) : value;
    setResetForm((prev) => ({ ...prev, [name]: next }));
    setResetErrors((prev) =>
      prev[name as keyof ResetErrors] ? { ...prev, [name]: undefined } : prev,
    );
  }, []);

  const sendCode = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);
      const validationErrors = validateEmail(emailForm);
      setEmailErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;

      try {
        await requestReset({ email: emailForm.email.trim() }).unwrap();
        setNotice('If that email is registered, a 6-digit code is on its way — check your inbox.');
        setStep('reset');
      } catch (err) {
        setServerError(serverMessage(err, 'Could not send the code. Please try again.'));
      }
    },
    [emailForm, requestReset],
  );

  const submitReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);
      const validationErrors = validateReset(resetForm);
      setResetErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;

      try {
        await resetPassword({
          email: emailForm.email.trim(),
          otp: resetForm.otp.trim(),
          newPassword: resetForm.newPassword,
        }).unwrap();
        navigate('/login');
      } catch (err) {
        setServerError(serverMessage(err, 'Could not reset your password. Please try again.'));
      }
    },
    [emailForm, resetForm, resetPassword, navigate],
  );

  const backToEmail = useCallback(() => {
    setServerError(null);
    setNotice(null);
    setStep('email');
  }, []);

  return {
    step,
    emailForm,
    emailErrors,
    resetForm,
    resetErrors,
    serverError,
    notice,
    isLoading: step === 'email' ? sending : resetting,
    onEmailChange,
    onResetChange,
    sendCode,
    submitReset,
    backToEmail,
  };
}
