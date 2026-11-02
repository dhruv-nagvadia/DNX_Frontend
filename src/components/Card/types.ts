import { ReactNode } from 'react';

export interface CardProps {
  /** Small uppercase line above the title, e.g. "Step 1 of 4". */
  eyebrow?: ReactNode;
  /** Section heading. Omit for a plain surface with no header row. A string
   *  in almost every case — ReactNode is allowed for the rare header that
   *  needs a leading icon beside its title. */
  title?: ReactNode;
  /** Small muted line under the title. */
  subtitle?: string;
  /** Right-aligned header content, usually a button. */
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Remove body padding — for tables and galleries that bleed to the edge. */
  flush?: boolean;
}
