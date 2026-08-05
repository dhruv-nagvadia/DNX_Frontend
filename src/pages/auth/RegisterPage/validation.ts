import { RegisterErrors, RegisterForm } from './types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Indian mobile numbers: 10 digits starting 6-9. The +91 prefix is implicit. */
const PHONE_RE = /^[6-9]\d{9}$/;

/** Returns a map of field errors; empty object means valid. */
export function validateRegister(form: RegisterForm): RegisterErrors {
  const errors: RegisterErrors = {};

  if (!form.fullName.trim()) errors.fullName = 'Full name is required';
  else if (form.fullName.trim().length < 2) errors.fullName = 'Enter your full name';

  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address';

  if (!form.phone.trim()) errors.phone = 'Phone number is required';
  else if (!PHONE_RE.test(form.phone.trim())) errors.phone = 'Enter a valid 10-digit mobile number';

  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 8) errors.password = 'Use at least 8 characters';

  if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (form.confirmPassword !== form.password)
    errors.confirmPassword = 'Passwords do not match';

  if (!form.acceptTerms) errors.acceptTerms = 'Please accept the terms to continue';

  return errors;
}
