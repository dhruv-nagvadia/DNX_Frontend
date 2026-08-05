import { TextFieldProps } from './types';
import styles from './TextField.module.css';

/** Labeled input with inline error and optional prefix/trailing slots. Logic-free. */
export function TextField({
  label,
  name,
  error,
  hint,
  prefix,
  trailing,
  dense = false,
  className,
  id,
  ...rest
}: TextFieldProps) {
  const inputId = id ?? name;
  const messageId = `${inputId}-message`;

  return (
    <div className={`${styles.field} ${dense ? styles.dense : ''}`}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>

      <div className={`${styles.shell} ${error ? styles.shellError : ''}`}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <input
          id={inputId}
          name={name}
          className={`${styles.input} ${className ?? ''}`}
          aria-invalid={!!error}
          aria-describedby={error || hint ? messageId : undefined}
          {...rest}
        />
        {trailing && <span className={styles.trailing}>{trailing}</span>}
      </div>

      {/* One slot for both messages — an error replaces the hint rather than stacking. */}
      {(error || hint) && (
        <span id={messageId} className={error ? styles.error : styles.hint}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
