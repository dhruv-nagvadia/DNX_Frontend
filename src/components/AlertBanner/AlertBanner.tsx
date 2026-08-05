import { AlertTriangle, Check } from 'lucide-react';

import { AlertBannerProps } from './types';
import styles from './AlertBanner.module.css';

/** Inline form-level message. Announced to screen readers on appearance. */
export function AlertBanner({ tone = 'error', children, className }: AlertBannerProps) {
  const Glyph = tone === 'error' ? AlertTriangle : Check;

  return (
    <div
      className={`${styles.banner} ${styles[tone]} ${className ?? ''}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Glyph size={18} className={styles.icon} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
