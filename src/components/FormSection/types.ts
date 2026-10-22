import { ReactNode } from 'react';

export interface FormSectionProps {
  title: string;
  description?: string;
  /** A small icon shown in a tinted chip beside the title. */
  icon?: ReactNode;
  /** Something to place at the right of the header (a badge, a link…). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}
