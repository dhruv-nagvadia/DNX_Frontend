import { Check } from 'lucide-react';

import { CheckboxProps } from './types';
import styles from './Checkbox.module.css';

/** Custom-styled checkbox that keeps a real, focusable native input. */
export function Checkbox({ label, name, error, className, id, ...rest }: CheckboxProps) {
  const inputId = id ?? name;
  const messageId = `${inputId}-message`;

  return (
    <div className={`${styles.wrapper} ${className ?? ''}`}>
      <label className={styles.row} htmlFor={inputId}>
        <span className={styles.control}>
          <input
            id={inputId}
            name={name}
            type="checkbox"
            className={styles.input}
            aria-invalid={!!error}
            aria-describedby={error ? messageId : undefined}
            {...rest}
          />
          <span className={`${styles.box} ${error ? styles.boxError : ''}`} aria-hidden="true">
            <Check size={13} strokeWidth={3} className={styles.tick} />
          </span>
        </span>
        <span className={styles.label}>{label}</span>
      </label>

      {error && (
        <span id={messageId} className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
