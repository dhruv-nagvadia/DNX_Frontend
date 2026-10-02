import { AdminLoginErrors, AdminLoginForm } from './types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns a map of field errors; empty object means valid. */
export function validateAdminLogin(form: AdminLoginForm): AdminLoginErrors {
  const errors: AdminLoginErrors = {};
  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(form.email)) errors.email = 'Enter a valid email';

  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 8) errors.password = 'Minimum 8 characters';

  return errors;
}
