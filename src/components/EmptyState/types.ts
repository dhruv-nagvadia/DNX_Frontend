import { ReactNode } from 'react';

export interface EmptyStateProps {
  /** Icon element, rendered inside a soft brand-tinted circle. */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** The single action that resolves the empty state. */
  action?: ReactNode;
  className?: string;
}
