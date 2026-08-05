import { ReactNode } from 'react';

export interface StatTileProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  /** Small muted line under the value, e.g. "since launch". */
  note?: string;
}
