import { useEffect, useRef, useState } from 'react';
import { Bell, CalendarClock, CheckCheck, Package, XCircle } from 'lucide-react';

import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/redux/api/notification/notificationApi';
import { AppNotification, NotificationType } from '@/redux/api/notification/types';
import styles from './NotificationBell.module.css';

// How often the unread badge refreshes while the app is open.
const POLL_MS = 30_000;

function iconFor(type: NotificationType) {
  if (type === 'ORDER_CANCELLED' || type === 'BOOKING_CANCELLED') {
    return <XCircle size={16} aria-hidden="true" />;
  }
  if (type === 'BOOKING_PLACED' || type === 'BOOKING_STATUS') {
    return <CalendarClock size={16} aria-hidden="true" />;
  }
  return <Package size={16} aria-hidden="true" />;
}

/** Short relative time ("Just now", "5m ago", "3h ago", "2d ago"). */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Sidebar notification bell with an unread badge and a dropdown of recent
 * notifications. The panel is fixed-positioned (measured from the button) so it
 * escapes the sidebar's `overflow: hidden`.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const { data: unread = 0 } = useGetUnreadCountQuery(undefined, { pollingInterval: POLL_MS });
  const { data: items = [], isFetching } = useGetNotificationsQuery(undefined, { skip: !open });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll] = useMarkAllNotificationsReadMutation();

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
      setPos({ left: r.left, bottom: window.innerHeight - r.top + 10 });
    }
    setOpen((o) => !o);
  };

  const onItemClick = (n: AppNotification) => {
    if (!n.isRead) markRead(n.id);
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
        <Bell size={16} aria-hidden="true" />
        {unread > 0 && <span className={styles.badge}>{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div
          className={styles.panel}
          role="dialog"
          aria-label="Notifications"
          style={pos ? { left: pos.left, bottom: pos.bottom } : undefined}
        >
          <header className={styles.panelHead}>
            <span className={styles.panelTitle}>Notifications</span>
            {unread > 0 && (
              <button type="button" className={styles.markAll} onClick={() => markAll()}>
                <CheckCheck size={13} aria-hidden="true" />
                Mark all read
              </button>
            )}
          </header>

          <div className={styles.list}>
            {isFetching && items.length === 0 ? (
              <p className={styles.empty}>Loading…</p>
            ) : items.length === 0 ? (
              <p className={styles.empty}>You&rsquo;re all caught up.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`${styles.item} ${n.isRead ? '' : styles.unread}`}
                  onClick={() => onItemClick(n)}
                >
                  <span
                    className={`${styles.itemIcon} ${
                      n.type.endsWith('CANCELLED') ? styles.itemIconDanger : ''
                    }`}
                  >
                    {iconFor(n.type)}
                  </span>
                  <span className={styles.itemBody}>
                    <span className={styles.itemTitle}>{n.title}</span>
                    <span className={styles.itemText}>{n.body}</span>
                    <span className={styles.itemTime}>{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.isRead && <span className={styles.dot} aria-hidden="true" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
