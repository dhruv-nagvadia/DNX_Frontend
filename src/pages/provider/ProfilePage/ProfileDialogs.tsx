import { FormEvent, useState } from 'react';
import { Lock, Trash2 } from 'lucide-react';

import { Checkbox } from '@/components/Checkbox';
import { FormDialog } from '@/components/FormDialog';
import { PasswordField } from '@/components/PasswordField';
import { apiErrorMessage } from '@/utils/apiError';


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
      const msg = apiErrorMessage(err, 'Could not change your password. Please try again.');
      if (/current password/i.test(msg)) setErrors({ current: msg });
      else setServerError(msg);
    }
  };

  return (
    <FormDialog
      open
      size="sm"
      title="Change password"
      subtitle="Use at least 8 characters. You’ll stay signed in on this device."
      icon={<Lock size={20} />}
      onClose={onClose}
      onSubmit={submit}
      error={serverError}
      submitLabel="Update password"
      submitting={submitting}
      submittingLabel="Saving…"
      initialFocus="firstField"
    >
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
    </FormDialog>
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
      const msg = apiErrorMessage(err, 'Could not delete your account. Please try again.');
      if (/password/i.test(msg)) setError(msg);
      else setServerError(msg);
    }
  };

  return (
    <FormDialog
      open
      size="sm"
      tone="danger"
      title="Delete account"
      subtitle="This permanently removes your provider account and your businesses from DNX. You’ll be signed out."
      icon={<Trash2 size={20} />}
      onClose={onClose}
      onSubmit={submit}
      error={serverError}
      submitLabel="Delete account"
      submitting={submitting}
      submittingLabel="Deleting…"
      submitDisabled={!understood || !password}
      initialFocus="firstField"
    >
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
    </FormDialog>
  );
}
