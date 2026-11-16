import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Tabs } from '@/components/Tabs';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import { FormDialogProps } from './types';
import styles from './FormDialog.module.css';

/**
 * The app's standard dialog: a header with title (and optional subtitle /
 * icon), an optional tab bar for forms with many fields, a body, and a footer
 * with Cancel / Submit that is always in reach. Esc or the × closes it;
 * clicking outside does not, so a half-filled form isn't lost by accident.
 * Focus is trapped inside while open and returned afterwards.
 */
export function FormDialog({
  open,
  title,
  subtitle,
  onClose,
  onSubmit,
  tabs,
  activeTab,
  onTabChange,
  error,
  submitLabel,
  submitting,
  submittingLabel = 'Saving…',
  submitDisabled,
  cancelLabel = 'Cancel',
  tone = 'primary',
  icon,
  size = 'lg',
  initialFocus = 'panel',
  children,
}: FormDialogProps) {
  const panelRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const subtitleId = useId();

  useDialogFocus(panelRef, open, onClose, initialFocus);

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay}>
      <form
        ref={panelRef}
        className={`${styles.panel} ${styles[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
        onSubmit={onSubmit}
        noValidate
      >
        <header className={styles.head}>
          {icon && (
            <span
              className={`${styles.headIcon} ${tone === 'danger' ? styles.headIconDanger : ''}`}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <div className={styles.headText}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {subtitle && (
              <p id={subtitleId} className={styles.subtitle}>
                {subtitle}
              </p>
            )}
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        {tabs && activeTab && onTabChange && (
          <div className={styles.tabs}>
            <Tabs tabs={tabs} active={activeTab} onChange={onTabChange} />
          </div>
        )}

        <div className={styles.body}>{children}</div>

        <footer className={styles.foot}>
          {error && (
            <div className={styles.error}>
              <AlertBanner tone="error">{error}</AlertBanner>
            </div>
          )}
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={onClose}
              disabled={submitting}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${tone === 'danger' ? styles.btnDanger : styles.btnPrimary}`}
              disabled={submitting || submitDisabled}
              aria-busy={submitting || undefined}
            >
              {submitting && <Loader2 size={16} className={styles.spin} aria-hidden="true" />}
              {submitting ? submittingLabel : submitLabel}
            </button>
          </div>
        </footer>
      </form>
    </div>,
    document.body,
  );
}
