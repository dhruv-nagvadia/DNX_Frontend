import { Bell, CalendarDays, PackageMinus, ShoppingBag, Star, Wallet } from 'lucide-react';

import { AppNotification } from '@/redux/api/notification/types';

import { kindOf, NotificationKind, timeLabel } from './notificationMeta';
import styles from './NotificationRow.module.css';

const ICONS: Record<NotificationKind, typeof Bell> = {
  booking: CalendarDays,
  order: ShoppingBag,
  review: Star,
  payment: Wallet,
  stock: PackageMinus,
  other: Bell,
};

/**
 * One notification: pastel round icon by kind, bold title, two-line grey body,
 * time on the right and a blue dot + soft blue tint while unread. `compact` is
 * the bell dropdown's denser variant.
 */
export function NotificationRow({
  notification: n,
  onOpen,
  compact,
  now,
}: {
  notification: AppNotification;
  onOpen: (n: AppNotification) => void;
  compact?: boolean;
  now?: number;
}) {
  const kind = kindOf(n.type);
  const Icon = ICONS[kind];
  return (
    <button
      type="button"
      className={`${styles.row} ${compact ? styles.compact : ''} ${n.isRead ? '' : styles.unread}`}
      onClick={() => onOpen(n)}
      aria-label={`${n.isRead ? '' : 'Unread: '}${n.title}. ${n.body}`}
    >
      <span className={`${styles.icon} ${styles[`icon_${kind}`]}`} aria-hidden="true">
        <Icon size={compact ? 16 : 18} />
      </span>
      <span className={styles.main}>
        <span className={styles.title}>{n.title}</span>
        <span className={styles.body}>{n.body}</span>
      </span>
      <span className={styles.side}>
        <time className={styles.time} dateTime={n.createdAt}>
          {timeLabel(n.createdAt, now)}
        </time>
        {!n.isRead && <span className={styles.dot} aria-hidden="true" />}
      </span>
    </button>
  );
}
