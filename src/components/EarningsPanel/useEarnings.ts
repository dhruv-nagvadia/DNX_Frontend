import { useMemo, useState } from 'react';

import { useGetBusinessBookingsQuery } from '@/redux/api/provider/providerApi';
import { ProviderBooking } from '@/redux/api/provider/types';

import { EarningsPeriod, EarningsPoint, EarningsSeries } from './types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Deterministic 0..1 generator so sample data is stable per business. */
function seeded(seedStr: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Empty labelled buckets (oldest → newest) for a period. */
function emptyBuckets(period: EarningsPeriod, now: Date): EarningsPoint[] {
  if (period === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      return { label: WEEKDAYS[d.getDay()], value: 0 };
    });
  }
  if (period === 'month') {
    return Array.from({ length: 4 }, (_, i) => ({ label: `Wk ${i + 1}`, value: 0 }));
  }
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return { label: MONTHS[d.getMonth()], value: 0 };
  });
}

/** Which bucket a date falls into, or -1 if outside the window. */
function bucketIndex(period: EarningsPeriod, date: Date, now: Date): number {
  const dayMs = 86_400_000;
  if (period === 'week') {
    const diff = Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / dayMs);
    return diff >= 0 && diff <= 6 ? 6 - diff : -1;
  }
  if (period === 'month') {
    const diff = Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / dayMs);
    return diff >= 0 && diff <= 27 ? 3 - Math.floor(diff / 7) : -1;
  }
  const months = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  return months >= 0 && months <= 11 ? 11 - months : -1;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Fills empty buckets with realistic sample earnings (used until real data exists). */
function sampleFill(buckets: EarningsPoint[], seed: string): EarningsPoint[] {
  const rand = seeded(seed);
  const base = 6000 + Math.floor(rand() * 6000);
  return buckets.map((b, i) => ({
    ...b,
    // Gentle upward drift + noise so the chart reads like growth.
    value: Math.round((base + i * 700 + rand() * 4000) / 100) * 100,
  }));
}

function aggregate(
  bookings: ProviderBooking[],
  period: EarningsPeriod,
  now: Date,
): { points: EarningsPoint[]; real: boolean; currency: string } {
  const points = emptyBuckets(period, now);
  let total = 0;
  const currency = bookings[0]?.currency ?? 'INR';

  for (const b of bookings) {
    if (b.status === 'CANCELLED') continue;
    const idx = bucketIndex(period, new Date(b.startTime), now);
    if (idx < 0) continue;
    const major = b.amountMinor / 100;
    points[idx].value += major;
    total += major;
  }

  return { points, real: total > 0, currency };
}

/** Earnings series for one business, with a week/month/year toggle. */
export function useEarnings(providerId: string) {
  const { data: bookings = [], isLoading } = useGetBusinessBookingsQuery(providerId);
  const [period, setPeriod] = useState<EarningsPeriod>('week');

  const series: EarningsSeries = useMemo(() => {
    const now = new Date();
    const { points: real, real: hasReal, currency } = aggregate(bookings, period, now);
    const points = hasReal ? real : sampleFill(emptyBuckets(period, now), `${providerId}-${period}`);

    const total = points.reduce((sum, p) => sum + p.value, 0);
    const last = points[points.length - 1]?.value ?? 0;
    const prev = points[points.length - 2]?.value ?? 0;
    const trendPct = prev > 0 ? Math.round(((last - prev) / prev) * 100) : null;

    return { points, total, trendPct, currency, isSample: !hasReal };
  }, [bookings, period, providerId]);

  return { period, setPeriod, series, isLoading };
}
