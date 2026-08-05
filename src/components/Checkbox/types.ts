import { InputHTMLAttributes, ReactNode } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** ReactNode so callers can embed links (e.g. Terms of Service). */
  label: ReactNode;
  name: string;
  error?: string;
}
