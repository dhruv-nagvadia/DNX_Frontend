import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { BellOff, Check, ChevronDown, Inbox } from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { ModernCard } from '@/components/ModernCard';
import { KIND_LABEL, NotificationBell, NotificationRow } from '@/components/NotificationBell';
import { Skeleton } from '@/components/Skeleton';
import { useAppSelector } from '@/redux/hooks';

import { NotificationFilter, useNotificationsPage } from './useNotificationsPage';
import styles from './NotificationsPage.module.css';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'D';
}

/** Full notification history: filter chips, then one card grouped Today / Yesterday / Earlier. */
export default function NotificationsPage() {
  const p = useNotificationsPage();
  const user = useAppSelector((s) => s.user.currentUser);
  const fullName = user?.fullName ?? '';
  const avatarUrl = user?.avatarUrl ?? null;

  const header = (
    <div className={styles.topBar}>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>Notifications</h1>
        <p className={styles.subtitle}>
          {p.isLoading ? ' ' : p.unreadCount > 0 ? `${p.unreadCount} unread` : "You're all caught up"}
        </p>
      </div>
      <div className={styles.topControls}>
        <button
          type="button"
          className={styles.markAllBtn}
          onClick={p.markAll}
          disabled={p.unreadCount === 0 || p.markingAll}
        >
          <Check size={16} aria-hidden="true" />
          Mark all as read
        </button>
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

  const chips: { id: NotificationFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: p.unreadCount > 0 ? `Unread (${p.unreadCount})` : 'Unread' },
    ...p.kinds.map((k) => ({ id: k, label: KIND_LABEL[k] })),
  ];

  const isEmpty = p.groups.length === 0;

  return (
    <AppShell header={header}>
      <div className={styles.page}>
        <div className={styles.chips} role="group" aria-label="Filter notifications">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={p.filter === c.id}
              className={`${styles.chip} ${p.filter === c.id ? styles.chipActive : ''}`}
              onClick={() => p.setFilter(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <ModernCard flush>
          {p.isLoading ? (
            <ul className={styles.list} aria-busy="true" aria-label="Loading">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i} className={styles.skeletonRow}>
                  <Skeleton width={40} height={40} radius="50%" />
                  <div className={styles.skeletonText}>
                    <Skeleton width="40%" height={14} />
                    <Skeleton width="75%" height={12} />
                  </div>
                  <Skeleton width={52} height={12} />
                </li>
              ))}
            </ul>
          ) : isEmpty ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon} aria-hidden="true">
                {p.hasAny ? <Inbox size={28} strokeWidth={1.6} /> : <BellOff size={28} strokeWidth={1.6} />}
              </span>
              <p className={styles.emptyTitle}>
                {!p.hasAny
                  ? 'No notifications yet'
                  : p.filter === 'unread'
                    ? "You're all caught up"
                    : 'Nothing here'}
              </p>
              <p className={styles.emptyText}>
                {!p.hasAny
                  ? 'New bookings, orders and updates will show up here.'
                  : p.filter === 'unread'
                    ? 'You have no unread notifications.'
                    : 'No notifications match this filter.'}
              </p>
            </div>
          ) : (
            <ul className={styles.list}>
              {p.groups.map((g) => (
                <Fragment key={g.label}>
                  <li className={styles.groupLabel}>{g.label}</li>
                  {g.items.map((n) => (
                    <li key={n.id} className={styles.item}>
                      <NotificationRow notification={n} onOpen={p.open} now={p.now} />
                    </li>
                  ))}
                </Fragment>
              ))}
            </ul>
          )}
        </ModernCard>
      </div>
    </AppShell>
  );
}
