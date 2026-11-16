import { AppNotification } from '@/redux/api/notification/types';

/**
 * Presentation helpers shared by the bell dropdown and the /notifications
 * page: what kind of event a notification is (drives its icon + filter chip),
 * how its time reads, which day group it falls in, and where clicking it goes.
 */

export type NotificationKind = 'booking' | 'order' | 'review' | 'payment' | 'stock' | 'other';

/**
 * Matched on substrings rather than the exact enum so new backend types
 * (REVIEW_POSTED, PAYOUT_SENT, LOW_STOCK, …) pick up the right icon without a
 * frontend change.
 */
export function kindOf(type: string): NotificationKind {
  const t = type.toUpperCase();
  if (t.includes('STOCK')) return 'stock';
  if (t.includes('BOOKING')) return 'booking';
  if (t.includes('ORDER')) return 'order';
  if (t.includes('REVIEW')) return 'review';
  if (t.includes('PAYMENT') || t.includes('PAYOUT') || t.includes('REFUND')) return 'payment';
  return 'other';
}

export const KIND_LABEL: Record<NotificationKind, string> = {
  booking: 'Bookings',
  order: 'Orders',
  review: 'Reviews',
  payment: 'Payments',
  stock: 'Low stock',
  other: 'Other',
};

/** Stable chip order for the type filters. */
export const KIND_ORDER: NotificationKind[] = ['booking', 'order', 'review', 'payment', 'stock', 'other'];

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

const DAY_MS = 86_400_000;
const clockFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false });
const weekdayFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'short' });
const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });

/**
 * "Just now" / "5m ago" / "3h ago" for today, "Yesterday 10:30" / "Mon 10:30"
 * within the last week, "12 Nov" beyond that.
 */
export function timeLabel(iso: string, now: number = Date.now()): string {
  const d = new Date(iso);
  const min = Math.floor((now - d.getTime()) / 60_000);
  const daysBack = Math.round((startOfDay(new Date(now)) - startOfDay(d)) / DAY_MS);
  if (daysBack <= 0) {
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    return `${Math.floor(min / 60)}h ago`;
  }
  if (daysBack === 1) return `Yesterday ${clockFmt.format(d)}`;
  if (daysBack < 7) return `${weekdayFmt.format(d)} ${clockFmt.format(d)}`;
  return dateFmt.format(d);
}

export type DayGroup = 'Today' | 'Yesterday' | 'Earlier';

export function dayGroupOf(iso: string, now: number = Date.now()): DayGroup {
  const daysBack = Math.round((startOfDay(new Date(now)) - startOfDay(new Date(iso))) / DAY_MS);
  if (daysBack <= 0) return 'Today';
  if (daysBack === 1) return 'Yesterday';
  return 'Earlier';
}

/** Groups an already newest-first list, keeping order and dropping empty groups. */
export function groupByDay(
  items: AppNotification[],
  now: number = Date.now(),
): { label: DayGroup; items: AppNotification[] }[] {
  const groups: { label: DayGroup; items: AppNotification[] }[] = [];
  for (const n of items) {
    const label = dayGroupOf(n.createdAt, now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(n);
    else groups.push({ label, items: [n] });
  }
  return groups;
}

/**
 * Where a notification leads. Orders and bookings live on the all-businesses
 * Bookings & Orders page; the state names the section/entity so that page can
 * pre-select it. Anything else has no target (clicking just marks it read).
 */
export function targetOf(
  n: AppNotification,
): { to: string; state?: Record<string, string> } | null {
  if (n.entityType === 'ORDER') {
    return { to: '/bookings-orders', state: { section: 'orders', ...(n.entityId ? { orderId: n.entityId } : {}) } };
  }
  if (n.entityType === 'BOOKING') {
    return {
      to: '/bookings-orders',
      state: { section: 'bookings', ...(n.entityId ? { bookingId: n.entityId } : {}) },
    };
  }
  const kind = kindOf(n.type);
  if (kind === 'review') return { to: '/reviews' };
  if (kind === 'payment') return { to: '/earnings' };
  if (kind === 'stock') return { to: '/dashboard/low-stock' };
  return null;
}
