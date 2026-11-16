import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, BellOff } from 'lucide-react';

import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllNotificationsReadMutation,
} from '@/redux/api/notification/notificationApi';
import { AppNotification } from '@/redux/api/notification/types';
import { Skeleton } from '@/components/Skeleton';

import { NotificationRow } from './NotificationRow';
import { useOpenNotification } from './useOpenNotification';
import styles from './NotificationBell.module.css';

/** How many of the latest notifications the dropdown shows. */
const PANEL_LIMIT = 6;

// How often the unread badge refreshes while the app is open.
const POLL_MS = 30_000;

/**
 * Top-bar notification bell with an unread badge and a dropdown of recent
 * notifications. The panel is fixed-positioned (measured from the button) so
 * it always opens directly below the bell, regardless of where in the page
 * the bell sits.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ right: number; top: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const { data: unread = 0 } = useGetUnreadCountQuery(undefined, { pollingInterval: POLL_MS });
  const { data: all = [], isLoading } = useGetNotificationsQuery(undefined, { skip: !open });
  const [markAll] = useMarkAllNotificationsReadMutation();
  const openNotification = useOpenNotification();
  const navigate = useNavigate();
  const items = all.slice(0, PANEL_LIMIT);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      // Anchored to the button's right edge (growing leftward), not its left
      // edge — the bell sits near the right side of the top bar, so a
      // left-anchored panel ran off the right side of the screen.
      setPos({ right: Math.max(12, window.innerWidth - r.right), top: r.bottom + 10 });
    }
    setOpen((o) => !o);
  };

  const onItemClick = (n: AppNotification) => {
    setOpen(false);
    openNotification(n);
  };

  const viewAll = () => {
    setOpen(false);
    navigate('/notifications');
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        className={styles.bell}
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell size={18} aria-hidden="true" />
        {unread > 0 && <span className={styles.badge}>{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div
          className={styles.panel}
          role="dialog"
          aria-label="Notifications"
          style={pos ? { right: pos.right, top: pos.top } : undefined}
        >
          <header className={styles.panelHead}>
            <span className={styles.panelTitle}>Notifications</span>
            <button
              type="button"
              className={styles.markAll}
              onClick={() => markAll()}
              disabled={unread === 0}
            >
              Mark all read
            </button>
          </header>

          <div className={styles.list}>
            {isLoading ? (
              <div aria-busy="true" aria-label="Loading">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className={styles.skeletonRow}>
                    <Skeleton width={36} height={36} radius="50%" />
                    <div className={styles.skeletonText}>
                      <Skeleton width="55%" height={13} />
                      <Skeleton width="85%" height={12} />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon} aria-hidden="true">
                  <BellOff size={20} />
                </span>
                <p className={styles.emptyTitle}>No notifications yet</p>
                <p className={styles.emptyText}>New bookings and orders will show up here.</p>
              </div>
            ) : (
              <ul className={styles.items}>
                {items.map((n) => (
                  <li key={n.id}>
                    <NotificationRow notification={n} onOpen={onItemClick} compact />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <footer className={styles.panelFoot}>
            <button type="button" className={styles.viewAll} onClick={viewAll}>
              View all notifications
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}
