import { FormEvent, ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import ui from './CouponsManager.module.css';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const scrollLock = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      );
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panelRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = scrollLock;
      previouslyFocused?.focus?.();
    };
  }, [open]);

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
            <X size={22} aria-hidden="true" />
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
              {saving && <Loader2 size={18} className={ui.spin} aria-hidden="true" />}
              {saving ? 'Saving…' : submitLabel}
            </button>
          </div>
        </footer>
      </form>
    </div>,
    document.body,
  );
}
