import { ReactNode } from 'react';

export interface AppShellProps {
  children: ReactNode;
  /**
   * Optional secondary navigation rail rendered between the sidebar and the
   * content (e.g. a business's sections). When omitted, content spans the
   * whole area.
   */
  rail?: ReactNode;
  /** Widen the content column for dense screens. Defaults to 1120px. */
  wide?: boolean;
}
