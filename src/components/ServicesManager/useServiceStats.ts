import { useMemo } from 'react';

import { useGetBusinessBookingsQuery } from '@/redux/api/provider/providerApi';

export interface ServiceStat {
  /** Non-cancelled bookings (includes NO_SHOW — the slot was still booked). */
  count: number;
  /** Sum of amountMinor over non-cancelled bookings, EXCLUDING no-shows. */
  revenueMinor: number;
  /** Most recent booking time (createdAt, else startTime), epoch ms. */
  lastBookedAt: number | null;
}

/** Bookings only carry the service name, so stats are keyed by a normalised name. */
export const statKey = (name: string) => name.trim().toLowerCase();

/** Per-service booking count / revenue / last-booked, from the business's real bookings. */
export function useServiceStats(providerId: string) {
  const { data: bookings = [], isLoading } = useGetBusinessBookingsQuery(providerId);

  const stats = useMemo(() => {
    const map = new Map<string, ServiceStat>();
    for (const b of bookings) {
      if (b.status === 'CANCELLED' || !b.service?.name) continue;
      const key = statKey(b.service.name);
      const s = map.get(key) ?? { count: 0, revenueMinor: 0, lastBookedAt: null };
      s.count += 1;
      if (b.status !== 'NO_SHOW') s.revenueMinor += b.amountMinor ?? 0;
      const t = Date.parse(b.createdAt ?? b.startTime);
      if (!Number.isNaN(t) && (s.lastBookedAt === null || t > s.lastBookedAt)) {
        s.lastBookedAt = t;
      }
      map.set(key, s);
    }
    return map;
  }, [bookings]);

  return { stats, loading: isLoading };
}

/** "today" / "yesterday" / "N days ago" / "—" by calendar day. */
export function lastBookedText(at: number | null): string {
  if (at === null) return '—';
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(new Date(at))) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}
