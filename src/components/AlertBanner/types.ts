import { ReactNode } from 'react';

export interface AlertBannerProps {
  tone?: 'error' | 'success';
  children: ReactNode;
  className?: string;
}
