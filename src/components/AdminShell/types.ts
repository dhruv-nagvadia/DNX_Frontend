import { ReactNode } from 'react';

export interface AdminShellProps {
  children: ReactNode;
  /** Widen the content column for dense screens. Defaults to 1120px. */
  wide?: boolean;
}
