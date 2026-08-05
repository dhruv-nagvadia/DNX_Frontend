import { ReactNode } from 'react';

export interface AppShellProps {
  children: ReactNode;
  /** Extra content in the top bar, left of the account menu. */
  topbarExtra?: ReactNode;
  /** Signed-in user's name, shown in the account chip. */
  userName?: string;
  onLogout?: () => void;
  /** Widen the content column for dense screens. Defaults to 1120px. */
  wide?: boolean;
}
