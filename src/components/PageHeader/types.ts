import { ReactNode } from 'react';

export interface PageHeaderProps {
  /** Small uppercase line above the title, for context or breadcrumbs. */
  eyebrow?: ReactNode;
  title: string;
  subtitle?: string;
  /** Right-aligned actions. */
  actions?: ReactNode;
}
