import { ButtonProps } from './types';
import styles from './Button.module.css';

/** Themed button. Logic-free; styles come from Button.module.css. */
export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${className ?? ''}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? 'Please wait...' : children}
    </button>
  );
}
