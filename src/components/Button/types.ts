import { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  /** Label shown while loading. Defaults to "Please wait...". */
  loadingText?: string;
  fullWidth?: boolean;
  /** Icon rendered before the label. */
  iconLeft?: ReactNode;
  /** Icon rendered after the label — nudges right on hover. */
  iconRight?: ReactNode;
}
