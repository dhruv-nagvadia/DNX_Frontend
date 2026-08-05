import { PasswordStrength } from './types';

/**
 * Cheap, readable strength heuristic — deliberately not a security check.
 * The backend remains the authority on what it will accept.
 */
export function getPasswordStrength(value: string): PasswordStrength {
  if (!value) return { score: 0, label: '' };

  let points = 0;
  if (value.length >= 8) points += 1;
  if (value.length >= 12) points += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) points += 1;
  if (/\d/.test(value)) points += 1;
  if (/[^A-Za-z0-9]/.test(value)) points += 1;

  if (points <= 2) return { score: 1, label: 'Weak' };
  if (points <= 3) return { score: 2, label: 'Fair' };
  return { score: 3, label: 'Strong' };
}
