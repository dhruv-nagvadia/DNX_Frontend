import { FormEvent, ReactNode, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { useDialogFocus } from '@/hooks/useDialogFocus';
import ui from './CouponsManager.module.css';

interface OfferPanelProps {
  open: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  error: string | null;
  submitLabel: string;
  saving: boolean;
  children: ReactNode;
}

/**
 * Create / edit offer form as a right-side modal panel over a dimmed page.
 * Esc or × closes it; focus is trapped inside while open and returned to
 * whatever opened it afterwards. Clicking the backdrop does not close it, so a
 * half-filled form isn't lost by accident.
 */
export function OfferPanel({
  open,
  title,
  subtitle,
  onClose,
  onSubmit,
  error,
  submitLabel,
  saving,
  children,
}: OfferPanelProps) {
  const panelRef = useRef<HTMLFormElement>(null);
  useDialogFocus(panelRef, open, onClose);

  if (!open) return null;

  return createPortal(
    <div className={ui.panelOverlay}>
      <form
        ref={panelRef}
        className={ui.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="offerPanelTitle"
        aria-describedby="offerPanelSubtitle"
        tabIndex={-1}
        onSubmit={onSubmit}
        noValidate
      >
        <header className={ui.panelHead}>
          <div>
            <h2 id="offerPanelTitle" className={ui.panelTitle}>
              {title}
            </h2>
            <p id="offerPanelSubtitle" className={ui.panelSubtitle}>
              {subtitle}
            </p>
          </div>
          <button type="button" className={ui.panelClose} onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={ui.panelBody}>{children}</div>

        <footer className={ui.panelFoot}>
          {error && (
            <div className={ui.panelError}>
              <AlertBanner tone="error">{error}</AlertBanner>
            </div>
          )}
          <div className={ui.panelActions}>
            <button type="button" className={ui.cancelBtn} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className={ui.submitBtn} disabled={saving} aria-busy={saving}>
              {saving && <Loader2 size={16} className={ui.spin} aria-hidden="true" />}
              {saving ? 'Saving…' : submitLabel}
            </button>
          </div>
        </footer>
      </form>
    </div>,
    document.body,
  );
}
