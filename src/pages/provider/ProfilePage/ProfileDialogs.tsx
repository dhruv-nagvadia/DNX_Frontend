import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Trash2, X } from 'lucide-react';

import { Checkbox } from '@/components/Checkbox';
import { PasswordField } from '@/components/PasswordField';

import { serverMessage } from './useProfilePage';
import styles from './ProfilePage.module.css';

/** Small centred modal: Esc / × closes; clicking outside doesn't (no lost input). */
function Modal({
  title,
  subtitle,
  icon,
  danger,
  onClose,
  onSubmit,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  danger?: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  const panelRef = useRef<HTMLFormElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const scrollLock = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = scrollLock;
      previouslyFocused?.focus?.();
    };
  }, []);

  return createPortal(
    <div className={styles.overlay}>
      <form
        ref={panelRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={onSubmit}
        noValidate
      >
        <header className={styles.modalHead}>
          <span className={`${styles.modalIcon} ${danger ? styles.modalIconDanger : ''}`}>{icon}</span>
          <div className={styles.modalHeadText}>
            <h2 className={styles.modalTitle}>{title}</h2>
            {subtitle && <p className={styles.modalSub}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.modalBody}>{children}</div>
        <footer className={styles.modalFoot}>{footer}</footer>
      </form>
    </div>,
    document.body,
  );
}

export function ChangePasswordDialog({
  onClose,
  onSubmit,
  submitting,
  onDone,
}: {
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
  submitting: boolean;
  onDone: () => void;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!current) errs.current = 'Enter your current password.';
    if (next.length < 8) errs.next = 'Use at least 8 characters.';
    else if (next === current) errs.next = 'Choose a password different from your current one.';
    if (!errs.next && confirm !== next) errs.confirm = 'Passwords don’t match.';
    setErrors(errs);
    setServerError(null);
    if (Object.keys(errs).length) return;
    try {
      await onSubmit(current, next);
      onDone();
    } catch (err) {
      const msg = serverMessage(err) ?? 'Could not change your password. Please try again.';
      if (/current password/i.test(msg)) setErrors({ current: msg });
      else setServerError(msg);
    }
  };

  return (
    <Modal
      title="Change password"
      subtitle="Use at least 8 characters. You’ll stay signed in on this device."
      icon={<Lock size={20} aria-hidden="true" />}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className={styles.btnOutline} onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={submitting}>
            {submitting ? 'Saving…' : 'Update password'}
          </button>
        </>
      }
    >
      {serverError && (
        <p className={styles.modalError} role="alert">
          {serverError}
        </p>
      )}
      <PasswordField
        dense
        label="Current password"
        name="currentPassword"
        autoComplete="current-password"
        value={current}
        error={errors.current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <PasswordField
        dense
        label="New password"
        name="newPassword"
        autoComplete="new-password"
        value={next}
        error={errors.next}
        showStrength
        onChange={(e) => setNext(e.target.value)}
      />
      <PasswordField
        dense
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        value={confirm}
        error={errors.confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
    </Modal>
  );
}

export function DeleteAccountDialog({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
  submitting: boolean;
}) {
  const [password, setPassword] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!password) {
      setError('Enter your password to confirm.');
      return;
    }
    setError(null);
    if (!understood) return;
    try {
      await onSubmit(password);
    } catch (err) {
      const msg = serverMessage(err) ?? 'Could not delete your account. Please try again.';
      if (/password/i.test(msg)) setError(msg);
      else setServerError(msg);
    }
  };

  return (
    <Modal
      danger
      title="Delete account"
      subtitle="This permanently removes your provider account and your businesses from DNX. You’ll be signed out."
      icon={<Trash2 size={20} aria-hidden="true" />}
      onClose={onClose}
      onSubmit={submit}
      footer={
        <>
          <button type="button" className={styles.btnOutline} onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="submit"
            className={styles.btnDanger}
            disabled={submitting || !understood || !password}
          >
            {submitting ? 'Deleting…' : 'Delete account'}
          </button>
        </>
      }
    >
      {serverError && (
        <p className={styles.modalError} role="alert">
          {serverError}
        </p>
      )}
      <PasswordField
        dense
        label="Password"
        name="deletePassword"
        autoComplete="current-password"
        value={password}
        error={error ?? undefined}
        onChange={(e) => {
          setPassword(e.target.value);
          if (error) setError(null);
        }}
      />
      <Checkbox
        name="understand"
        label="I understand this can’t be undone."
        checked={understood}
        onChange={(e) => setUnderstood(e.target.checked)}
      />
    </Modal>
  );
}
