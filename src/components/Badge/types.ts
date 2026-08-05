import { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'accent';

export interface BadgeProps {
  tone?: BadgeTone;
  /** Leading icon, rendered at the badge's text size. */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}
