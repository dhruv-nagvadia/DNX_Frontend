import { BadgeProps } from './types';
import styles from './Badge.module.css';

/** Small status/category chip. */
export function Badge({ tone = 'neutral', icon, children, className }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[tone]} ${className ?? ''}`}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
}
