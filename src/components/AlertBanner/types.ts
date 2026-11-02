import { ReactNode } from 'react';

export interface AlertBannerProps {
  tone?: 'error' | 'success' | 'warning';
  children: ReactNode;
  className?: string;
  /** Shows a dismiss (×) button when provided. */
  onDismiss?: () => void;
}
