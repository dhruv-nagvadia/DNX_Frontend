import { EmptyStateProps } from './types';
import styles from './EmptyState.module.css';

/** Nothing-here placeholder that always offers the way out. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={`${styles.empty} ${className ?? ''}`}>
      {icon && <span className={styles.iconRing}>{icon}</span>}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
