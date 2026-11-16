import { KeyboardEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { ModernCard } from '@/components/ModernCard';
import { NotificationBell } from '@/components/NotificationBell';
import { Skeleton } from '@/components/Skeleton';
import { useAppSelector } from '@/redux/hooks';

import styles from './ViewAll.module.css';

/**
 * Shared shell for the Dashboard's four "View all" pages (Today's Schedule,
 * Needs Your Attention, Orders to Fulfil, Low Stock): back link + title +
 * live count, bell and avatar chip, and one ModernCard list of clickable rows.
 */

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'D';
}

export function ViewAllPage({
  title,
  subtitle,
  isLoading,
  isEmpty,
  empty,
  children,
}: {
  title: string;
  subtitle: ReactNode;
  isLoading: boolean;
  isEmpty: boolean;
  empty: { icon: ReactNode; title: string; description: string };
  children: ReactNode;
}) {
  const user = useAppSelector((s) => s.user.currentUser);
  const fullName = user?.fullName ?? '';
  const avatarUrl = user?.avatarUrl ?? null;

  const header = (
    <div className={styles.topBar}>
      <div className={styles.titleBlock}>
        <Link to="/dashboard" className={styles.backLink}>
          <ArrowLeft size={14} aria-hidden="true" />
          Dashboard
        </Link>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{isLoading ? ' ' : subtitle}</p>
      </div>
      <div className={styles.topControls}>
        <div className={styles.bellWrap}>
          <NotificationBell />
        </div>
        <Link className={styles.profileChip} to="/profile">
          {avatarUrl ? (
            <img className={styles.profileAvatarImg} src={avatarUrl} alt="" aria-hidden="true" />
          ) : (
            <span className={styles.profileAvatar} aria-hidden="true">
              {initialsOf(fullName || 'DNX')}
            </span>
          )}
          <span className={styles.profileName}>{fullName || 'Your account'}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );

  return (
    <AppShell header={header}>
      <div className={styles.page}>
        <ModernCard flush>
          {isLoading ? (
            <ul className={styles.list} aria-busy="true" aria-label="Loading">
              {Array.from({ length: 5 }, (_, i) => (
                <li key={i} className={styles.skeletonRow}>
                  <Skeleton width={40} height={40} radius="12px" />
                  <div className={styles.skeletonText}>
                    <Skeleton width="45%" height={14} />
                    <Skeleton width="30%" height={12} />
                  </div>
                  <Skeleton width={84} height={24} radius="999px" />
                </li>
              ))}
            </ul>
          ) : isEmpty ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon} aria-hidden="true">
                {empty.icon}
              </span>
              <p className={styles.emptyTitle}>{empty.title}</p>
              <p className={styles.emptyText}>{empty.description}</p>
            </div>
          ) : (
            <ul className={styles.list}>{children}</ul>
          )}
        </ModernCard>
      </div>
    </AppShell>
  );
}

/** One clickable list row: leading chip, title + sub lines, right-side meta (pills/actions), chevron. */
export function ViewAllRow({
  lead,
  title,
  lines,
  meta,
  onOpen,
  ariaLabel,
}: {
  lead: ReactNode;
  title: ReactNode;
  lines?: ReactNode;
  meta?: ReactNode;
  onOpen: () => void;
  ariaLabel?: string;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Only the row itself — not a nested action button — should open it.
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  };
  return (
    <li className={styles.item}>
      <div
        className={styles.row}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={onOpen}
        onKeyDown={onKeyDown}
      >
        <span className={styles.lead}>{lead}</span>
        <div className={styles.main}>
          <span className={styles.rowTitle}>{title}</span>
          {lines && <span className={styles.rowSub}>{lines}</span>}
        </div>
        {meta && <div className={styles.meta}>{meta}</div>}
        <ChevronRight size={18} aria-hidden="true" className={styles.chevron} />
      </div>
    </li>
  );
}

/** Thin labelled divider inside the list (e.g. the "Now" line in Today's Schedule). */
export function ViewAllDivider({ label }: { label: string }) {
  return (
    <li className={styles.divider} aria-label={label}>
      <span className={styles.dividerLabel}>{label}</span>
    </li>
  );
}

/** Round/rounded pastel icon chip for a row's lead slot. */
export function LeadChip({
  tone,
  round,
  children,
}: {
  tone: 'blue' | 'peach' | 'mint' | 'pink' | 'lavender';
  round?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`${styles.chip} ${styles[`chip_${tone}`]} ${round ? styles.chipRound : ''}`}>{children}</span>
  );
}
