import { ReactNode } from 'react';

import styles from './Pill.module.css';

export type PillTone = 'orange' | 'green' | 'lavender' | 'blue' | 'grey' | 'red' | 'yellow' | 'teal';

/** Soft rounded status pill from the mockups (Paid / Due / Only 4 left …). */
export function Pill({ tone, children, className }: { tone: PillTone; children: ReactNode; className?: string }) {
  return <span className={`${styles.pill} ${styles[tone]} ${className ?? ''}`}>{children}</span>;
}
