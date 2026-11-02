import { AlertTriangle, Check, X } from 'lucide-react';

import { AlertBannerProps } from './types';
import styles from './AlertBanner.module.css';

/** Inline form-level message. Announced to screen readers on appearance. */
export function AlertBanner({ tone = 'error', children, className, onDismiss }: AlertBannerProps) {
  const Glyph = tone === 'success' ? Check : AlertTriangle;

  return (
    <div
      className={`${styles.banner} ${styles[tone]} ${className ?? ''}`}
      role={tone === 'success' ? 'status' : 'alert'}
    >
      <Glyph size={18} className={styles.icon} aria-hidden="true" />
      <span className={styles.text}>{children}</span>
      {onDismiss && (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
