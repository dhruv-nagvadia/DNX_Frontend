import { useState } from 'react';

import { Eye, EyeOff } from 'lucide-react';

import { TextField } from '@/components/TextField';

import { getPasswordStrength } from './strength';
import { PasswordFieldProps } from './types';
import styles from './PasswordField.module.css';

/** Password input with a show/hide toggle and an optional strength meter. */
export function PasswordField({ showStrength = false, value, ...rest }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const strength = getPasswordStrength(String(value ?? ''));

  return (
    <div className={styles.wrapper}>
      <TextField
        {...rest}
        value={value}
        type={visible ? 'text' : 'password'}
        trailing={
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            tabIndex={0}
          >
            {visible ? (
              <EyeOff size={18} aria-hidden="true" />
            ) : (
              <Eye size={18} aria-hidden="true" />
            )}
          </button>
        }
      />

      {showStrength && (
        <div className={styles.strength}>
          <div className={styles.track} aria-hidden="true">
            {[1, 2, 3].map((segment) => (
              <span
                key={segment}
                className={`${styles.segment} ${
                  strength.score >= segment ? styles[`level${strength.score}`] : ''
                }`}
              />
            ))}
          </div>
          <span className={styles.strengthLabel} aria-live="polite">
            {strength.label}
          </span>
        </div>
      )}
    </div>
  );
}
