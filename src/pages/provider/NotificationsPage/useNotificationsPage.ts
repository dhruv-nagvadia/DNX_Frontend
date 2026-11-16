import { useMemo, useState } from 'react';

import {
  KIND_ORDER,
  kindOf,
  NotificationKind,
  groupByDay,
  useOpenNotification,
} from '@/components/NotificationBell';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllNotificationsReadMutation,
} from '@/redux/api/notification/notificationApi';

export type NotificationFilter = 'all' | 'unread' | NotificationKind;

/**
 * Data for the /notifications page. The API returns the latest 50 in one go
 * (no paging), so filtering and day-grouping happen client-side.
 */
export function useNotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [now] = useState(() => Date.now());

  const { data: items = [], isLoading } = useGetNotificationsQuery();
  const { data: unreadCount = 0 } = useGetUnreadCountQuery();
  const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();
  const open = useOpenNotification();

  // Type chips only for kinds that actually appear in the list.
  const kinds = useMemo(() => {
    const present = new Set(items.map((n) => kindOf(n.type)));
    return KIND_ORDER.filter((k) => present.has(k));
  }, [items]);

  const groups = useMemo(() => {
    const visible = items.filter((n) => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !n.isRead;
      return kindOf(n.type) === filter;
    });
    return groupByDay(visible, now);
  }, [items, filter, now]);

  return {
    isLoading,
    hasAny: items.length > 0,
    unreadCount,
    kinds,
    filter,
    setFilter,
    groups,
    now,
    open,
    markAll: () => markAll(),
    markingAll,
  };
}
