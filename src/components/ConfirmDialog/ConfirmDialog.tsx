import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Info, Loader2, Trash2 } from 'lucide-react';

import { useDialogFocus } from '@/hooks/useDialogFocus';
import { ConfirmDialogProps, ConfirmTone } from './types';
import styles from './ConfirmDialog.module.css';

const ICONS: Record<ConfirmTone, typeof Info> = {
  danger: Trash2,
  warning: AlertTriangle,
  info: Info,
};

/**
 * Themed confirm prompt (the app's replacement for `window.confirm`). Escape
 * and a backdrop click cancel; focus is trapped while open and handed back
 * afterwards. Usually opened through `useConfirm()`, but it can also be
 * rendered directly when the caller owns the open/loading state.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'info',
  icon,
  hideCancel = false,
  loading = false,
  loadingText,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const messageId = useId();

  const cancel = () => {
    if (!loading) onCancel();
  };
  // Destructive prompts start on Cancel so a stray Enter can't delete anything.
  useDialogFocus(panelRef, open, cancel, tone === 'danger' && !hideCancel ? cancelRef : confirmRef);

  if (!open) return null;
  const Icon = ICONS[tone];

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cancel();
      }}
    >
      <div
        ref={panelRef}
        className={styles.card}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? messageId : undefined}
        tabIndex={-1}
      >
        <div className={styles.top}>
          <span className={`${styles.icon} ${styles[tone]}`} aria-hidden="true">
            {icon ?? <Icon size={22} />}
          </span>
          <div className={styles.text}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {message && (
              <div id={messageId} className={styles.message}>
                {message}
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          {!hideCancel && (
            <button
              ref={cancelRef}
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={cancel}
              disabled={loading}
            >
              {cancelText}
            </button>
          )}
          <button
            ref={confirmRef}
            type="button"
            className={`${styles.btn} ${tone === 'danger' ? styles.btnDanger : styles.btnPrimary}`}
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading || undefined}
          >
            {loading && <Loader2 size={16} className={styles.spin} aria-hidden="true" />}
            {loading ? (loadingText ?? 'Please wait…') : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
