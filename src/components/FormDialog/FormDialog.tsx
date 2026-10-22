import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { Tabs } from '@/components/Tabs';
import { FormDialogProps } from './types';
import styles from './FormDialog.module.css';

/**
 * A form in a dialog: header with title, an optional tab bar for forms with
 * many fields, a body for the active tab, and a footer with Cancel / Save that
 * is always in reach. Esc or the × closes it; clicking outside does not, so a
 * half-filled form isn't lost by accident.
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
  children,
}: FormDialogProps) {
  const panelRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const scrollLock = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = scrollLock;
      previouslyFocused?.focus?.();
    };
    // onClose is intentionally not a dependency: it's recreated on every parent
    // render and re-running this would steal focus back to the panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay}>
      <form
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onSubmit={onSubmit}
        noValidate
      >
        <header className={styles.head}>
          <div className={styles.headText}>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
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
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} loadingText={submittingLabel}>
              {submitLabel}
            </Button>
          </div>
        </footer>
      </form>
    </div>,
    document.body,
  );
}
