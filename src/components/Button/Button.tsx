import { ButtonProps } from './types';
import styles from './Button.module.css';

/** Themed button. Logic-free; styles come from Button.module.css. */
export function Button({
  variant = 'primary',
  loading = false,
  loadingText,
  fullWidth = false,
  iconLeft,
  iconRight,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        styles.button,
        styles[variant],
        fullWidth ? styles.fullWidth : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          {loadingText ?? 'Please wait...'}
        </>
      ) : (
        <>
          {iconLeft && <span className={styles.icon}>{iconLeft}</span>}
          {children}
          {iconRight && <span className={`${styles.icon} ${styles.iconRight}`}>{iconRight}</span>}
        </>
      )}
    </button>
  );
}
