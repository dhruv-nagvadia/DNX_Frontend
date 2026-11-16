import { RefObject, useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Open dialogs, innermost last — only the top one reacts to Esc / Tab. */
const stack: object[] = [];

export type InitialFocus = 'panel' | 'firstField' | RefObject<HTMLElement>;

/**
 * Shared modal behaviour: locks page scroll, moves focus into the dialog,
 * traps Tab inside it, closes on Escape, and hands focus back to whatever was
 * focused before it opened. Nested dialogs (a confirm over a form) stack, so
 * Esc only closes the top one.
 */
export function useDialogFocus(
  ref: RefObject<HTMLElement>,
  open: boolean,
  onClose: () => void,
  initialFocus: InitialFocus = 'panel',
) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  const initialRef = useRef(initialFocus);
  initialRef.current = initialFocus;

  useEffect(() => {
    if (!open) return;
    const token = {};
    stack.push(token);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const scrollLock = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = ref.current;
    const initial = initialRef.current;
    if (initial === 'firstField') {
      const field = panel?.querySelector<HTMLElement>('input:not([disabled]), select, textarea');
      (field ?? panel)?.focus();
    } else if (initial === 'panel') {
      panel?.focus();
    } else {
      (initial.current ?? panel)?.focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== token) return;
      if (e.key === 'Escape') {
        // A popover inside the dialog (time picker, combobox) already handled it.
        if (e.defaultPrevented) return;
        closeRef.current();
        return;
      }
      const root = ref.current;
      if (e.key !== 'Tab' || !root) return;
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      );
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === root || !root.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !root.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const i = stack.indexOf(token);
      if (i >= 0) stack.splice(i, 1);
      document.body.style.overflow = scrollLock;
      previouslyFocused?.focus?.();
    };
  }, [open, ref]);
}
