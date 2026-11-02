import { ReactNode } from 'react';

import styles from './ModernCard.module.css';

export type ModernCardIconTone = 'brand' | 'error' | 'warning' | 'gold' | 'ink';

interface ModernCardProps {
  icon?: ReactNode;
  iconTone?: ModernCardIconTone;
  title?: ReactNode;
  /** Small grey text after the title, e.g. "(All Time)". */
  suffix?: ReactNode;
  /** Right side of the header — usually a <ModernCardLink>. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** No body padding (tables that run edge to edge). */
  flush?: boolean;
}

/**
 * Rounded white card from the mockups ("DNX Marketplace Provider Dashboard.png",
 * "Salon Provider Portal Dashboard.png"): coloured icon + bold title, optional
 * grey suffix, and a blue "View All →" style action. Only for the redesigned
 * Dashboard / Business Detail pages — every other page keeps the squared `Card`.
 */
export function ModernCard({
  icon,
  iconTone = 'brand',
  title,
  suffix,
  action,
  children,
  className,
  flush,
}: ModernCardProps) {
  return (
    <section className={`${styles.card} ${className ?? ''}`}>
      {(title || action) && (
        <header className={styles.head}>
          <h2 className={styles.title}>
            {icon && <span className={`${styles.icon} ${styles[`icon_${iconTone}`]}`}>{icon}</span>}
            <span>{title}</span>
            {suffix && <span className={styles.suffix}>{suffix}</span>}
          </h2>
          {action && <div className={styles.action}>{action}</div>}
        </header>
      )}
      <div className={flush ? styles.bodyFlush : styles.body}>{children}</div>
    </section>
  );
}

/** Blue text link/button for a card header ("View All →", "✎ Edit"). */
export function ModernCardLink({
  children,
  onClick,
  iconLeft,
  iconRight,
}: {
  children: ReactNode;
  onClick: () => void;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}) {
  return (
    <button type="button" className={styles.link} onClick={onClick}>
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
