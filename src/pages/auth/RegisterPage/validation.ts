import { RegisterErrors, RegisterForm } from './types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s()]{8,15}$/;

/** Returns a map of field errors; empty object means valid. */
export function validateRegister(form: RegisterForm): RegisterErrors {
  const errors: RegisterErrors = {};

  if (!form.fullName.trim()) errors.fullName = 'Full name is required';
  else if (form.fullName.trim().length < 2) errors.fullName = 'Enter your full name';

  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(form.email)) errors.email = 'Enter a valid email';

  if (!form.phone.trim()) errors.phone = 'Phone number is required';
  else if (!PHONE_RE.test(form.phone)) errors.phone = 'Enter a valid phone number';

  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 8) errors.password = 'Minimum 8 characters';

  if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match';

  return errors;
}
