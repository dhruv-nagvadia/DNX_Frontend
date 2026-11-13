import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react';

import styles from './AuthField.module.css';

export interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  /** Renders a show/hide toggle and switches type between password and text. */
  passwordToggle?: boolean;
  /** Static text shown before the input (e.g. "+91"). */
  prefix?: string;
  /** Extra content under the control, above the error (e.g. a strength meter). */
  children?: ReactNode;
}

/** Labelled input with a leading icon, used by all provider auth pages. */
export function AuthField({
  id,
  label,
  icon: Icon,
  error,
  passwordToggle = false,
  prefix,
  children,
  type,
  className,
  ...inputProps
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  const inputType = passwordToggle ? (visible ? 'text' : 'password') : type;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={`${styles.control} ${error ? styles.controlError : ''}`}>
        <Icon size={22} className={styles.leadIcon} aria-hidden="true" />
        {prefix && (
          <span className={styles.prefix} aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type={inputType}
          className={`${styles.input} ${className ?? ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...inputProps}
        />
        {passwordToggle && (
          <button
            type="button"
            className={styles.eyeBtn}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
          >
            {visible ? (
              <Eye size={22} aria-hidden="true" />
            ) : (
              <EyeOff size={22} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {children}
      {error && (
        <span id={errorId} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
