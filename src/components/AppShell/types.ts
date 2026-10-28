import { ReactNode } from 'react';

export interface AppShellProps {
  children: ReactNode;
  /**
   * Optional secondary navigation rail rendered between the sidebar and the
   * content (e.g. a business's sections). When omitted, content spans the
   * whole area.
   */
  rail?: ReactNode;
  /**
   * Shows a sticky top bar with this content — e.g. a business's
   * photo/name/rating plus its notification/profile controls. Omitted
   * (the default) means no top bar at all for this page.
   */
  header?: ReactNode;
}
