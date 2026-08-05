import { CardProps } from './types';
import styles from './Card.module.css';

/** The standard content surface for every provider screen. */
export function Card({ eyebrow, title, subtitle, action, children, className, flush }: CardProps) {
  return (
    <section className={`${styles.card} ${className ?? ''}`}>
      {(title || action || eyebrow) && (
        <header className={styles.head}>
          <div className={styles.headText}>
            {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </header>
      )}
      <div className={flush ? styles.bodyFlush : styles.body}>{children}</div>
    </section>
  );
}
