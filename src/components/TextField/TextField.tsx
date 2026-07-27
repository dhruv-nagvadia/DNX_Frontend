import { TextFieldProps } from './types';
import styles from './TextField.module.css';

/** Labeled input with inline error. Logic-free; used across all forms. */
export function TextField({ label, name, error, className, ...rest }: TextFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        className={`${styles.input} ${error ? styles.inputError : ''} ${className ?? ''}`}
        aria-invalid={!!error}
        {...rest}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
