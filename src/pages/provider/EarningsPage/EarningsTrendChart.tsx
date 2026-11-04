import { useMemo } from 'react';

import { SmoothTrendChart } from '@/components/SmoothTrendChart';
import { EarningsTransaction } from '@/redux/api/provider/types';

import { DayRange, parseYmd } from './earningsRange';

export type Granularity = 'daily' | 'weekly' | 'monthly';

interface Bucket {
  start: Date;
  /** Exclusive. */
  end: Date;
  earn: number;
  commission: number;
}

const dayMonth = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const monthOnly = new Intl.DateTimeFormat('en-US', { month: 'short' });
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Empty buckets covering [from, to] (inclusive days) at the chosen granularity. */
function makeBuckets(from: Date, to: Date, g: Granularity): Bucket[] {
  const out: Bucket[] = [];
  const last = addDays(to, 1);
  let start = from;
  // Hard stop so a very long "All time" range at Daily can't blow up the SVG.
  while (start < last && out.length < 2000) {
    let end: Date;
    if (g === 'daily') end = addDays(start, 1);
    else if (g === 'weekly')
      end = addDays(start, 7 - ((start.getDay() + 6) % 7)); // next Monday
    else end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    if (end > last) end = last;
    out.push({ start, end, earn: 0, commission: 0 });
    start = end;
  }
  return out;
}

interface Props {
  transactions: EarningsTransaction[];
  range: DayRange;
  granularity: Granularity;
}

/** "You earn" (area) and commission (dashed) per day / week / month of the selected period. */
export function EarningsTrendChart({ transactions, range, granularity }: Props) {
  const buckets = useMemo(() => {
    const today = startOfDay(new Date());
    const settled = transactions
      .filter((t) => t.settledAt)
      .map((t) => ({ t, at: new Date(t.settledAt as string) }));
    const from = range.from
      ? parseYmd(range.from)
      : settled.length
        ? startOfDay(new Date(Math.min(...settled.map((s) => s.at.getTime()))))
        : addDays(today, -29);
    const to = range.to ? parseYmd(range.to) : today;
    const list = makeBuckets(from, to, granularity);
    for (const { t, at } of settled) {
      // Buckets are ordered and contiguous; a quick scan is plenty for ≤200 sales.
      const b = list.find((x) => at >= x.start && at < x.end);
      if (!b) continue;
      b.earn += t.earningMinor;
      b.commission += t.commissionMinor;
    }
    return list;
  }, [transactions, range.from, range.to, granularity]);

  const n = buckets.length;
  const spansYears = n > 0 && buckets[0].start.getFullYear() !== buckets[n - 1].start.getFullYear();
  const axisLabel = (b: Bucket) =>
    granularity === 'monthly'
      ? spansYears
        ? monthYear.format(b.start)
        : monthOnly.format(b.start)
      : dayMonth.format(b.start);
  const tipLabel = (b: Bucket) => {
    if (granularity === 'daily') return dayMonth.format(b.start);
    if (granularity === 'monthly') return monthYear.format(b.start);
    const endDay = new Date(b.end.getTime() - DAY / 2);
    return endDay.getDate() === b.start.getDate()
      ? dayMonth.format(b.start)
      : `${dayMonth.format(b.start)} – ${dayMonth.format(endDay)}`;
  };

  const points = buckets.map((b) => ({
    label: axisLabel(b),
    tooltipLabel: tipLabel(b),
    value: b.earn,
    secondary: b.commission,
  }));

  const isEmpty = buckets.every((b) => b.earn === 0 && b.commission === 0);
  const totalEarn = buckets.reduce((s, b) => s + b.earn, 0);
  const emptyText = 'No completed sales in this period';
  const unit = granularity === 'daily' ? 'days' : granularity === 'weekly' ? 'weeks' : 'months';

  return (
    <SmoothTrendChart
      points={points}
      seriesLabel="You earn"
      secondaryLabel="Commission"
      showSecondary
      emptyText={emptyText}
      ariaLabel={
        isEmpty ? emptyText : `You earned ${rupees.format(totalEarn / 100)} across ${n} ${unit}`
      }
    />
  );
}
