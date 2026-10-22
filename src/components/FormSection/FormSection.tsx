import { FormSectionProps } from './types';
import styles from './FormSection.module.css';

/**
 * A mini-section inside a card or dialog: its own header (icon, title, short
 * description) on a tinted strip, with the fields below. Use it to group a
 * handful of related fields instead of one long run of inputs.
 */
export function FormSection({ title, description, icon, action, children, className }: FormSectionProps) {
  return (
    <section className={`${styles.section} ${className ?? ''}`}>
      <header className={styles.head}>
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
        <div className={styles.headText}>
          <h3 className={styles.title}>{title}</h3>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {action && <div className={styles.action}>{action}</div>}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
