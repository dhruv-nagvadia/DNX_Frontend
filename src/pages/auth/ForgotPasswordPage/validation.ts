import { EmailErrors, EmailForm, ResetErrors, ResetForm } from './types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(form: EmailForm): EmailErrors {
  const errors: EmailErrors = {};
  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address';
  return errors;
}

export function validateReset(form: ResetForm): ResetErrors {
  const errors: ResetErrors = {};
  if (!/^\d{6}$/.test(form.otp)) errors.otp = 'Enter the 6-digit code';

  if (!form.newPassword) errors.newPassword = 'Password is required';
  else if (form.newPassword.length < 8) errors.newPassword = 'Use at least 8 characters';

  if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (form.confirmPassword !== form.newPassword)
    errors.confirmPassword = 'Passwords do not match';

  return errors;
}
