import { ReactNode } from 'react';

export interface SideNavItem {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Optional count shown on the right (e.g. number of services). */
  count?: number;
}

export interface SideNavProps {
  items: SideNavItem[];
  active: string;
  onChange: (id: string) => void;
  /** Optional header block above the items (e.g. back link + title). */
  header?: ReactNode;
}
