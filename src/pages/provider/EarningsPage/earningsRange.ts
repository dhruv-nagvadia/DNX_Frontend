/**
 * Date-range presets for the Earnings page only (the shared `@/utils/dateRange`
 * stays as-is for the other screens). Every range is inclusive YYYY-MM-DD days
 * in the browser's local calendar; `from`/`to` undefined means "all time".
 */
export type EarningsPreset =
  'today' | 'week' | 'month' | 'lastMonth' | 'year' | '7d' | '30d' | 'all';

export const EARNINGS_PRESETS: { id: EarningsPreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'lastMonth', label: 'Last month' },
  { id: 'year', label: 'This year' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'all', label: 'All time' },
];

export interface DayRange {
  from?: string;
  to?: string;
}

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "2026-11-05" → local midnight of that day. */
export function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Monday of the week containing `d`. */
function startOfWeek(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (r.getDay() + 6) % 7;
  return addDays(r, -offset);
}

function span(from: Date, to: Date): DayRange {
  return { from: ymd(from), to: ymd(to) };
}

export function rangeForPreset(preset: EarningsPreset, now = new Date()): DayRange {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case 'today':
      return span(today, today);
    case 'week':
      return span(startOfWeek(today), today);
    case 'month':
      return span(new Date(today.getFullYear(), today.getMonth(), 1), today);
    case 'lastMonth': {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return span(first, new Date(today.getFullYear(), today.getMonth(), 0));
    }
    case 'year':
      return span(new Date(today.getFullYear(), 0, 1), today);
    case '7d':
      return span(addDays(today, -6), today);
    case '30d':
      return span(addDays(today, -29), today);
    default:
      return {};
  }
}

/**
 * The period the "You earn" change is compared against: the same stretch one
 * period back (this month so far → the same days of last month, this week so
 * far → the same days of last week, …). Null for "All time" (nothing before it).
 */
export function previousRange(
  preset: EarningsPreset,
  now = new Date(),
): { range: DayRange; label: string } | null {
  const cur = rangeForPreset(preset, now);
  if (!cur.from || !cur.to) return null;
  const from = parseYmd(cur.from);
  const to = parseYmd(cur.to);

  /** Same days-of-month, `months` back (clamped to that month's length). */
  const monthsBack = (d: Date, months: number) => {
    const y = d.getFullYear();
    const m = d.getMonth() - months;
    const target = new Date(y, m, 1);
    const day = Math.min(d.getDate(), lastDayOfMonth(target.getFullYear(), target.getMonth()));
    return new Date(target.getFullYear(), target.getMonth(), day);
  };

  switch (preset) {
    case 'today':
      return { range: span(addDays(from, -1), addDays(to, -1)), label: 'vs yesterday' };
    case 'week':
      return { range: span(addDays(from, -7), addDays(to, -7)), label: 'vs last week' };
    case 'month':
      return { range: span(monthsBack(from, 1), monthsBack(to, 1)), label: 'vs last month' };
    case 'lastMonth': {
      const first = new Date(from.getFullYear(), from.getMonth() - 1, 1);
      return {
        range: span(first, new Date(from.getFullYear(), from.getMonth(), 0)),
        label: 'vs the month before',
      };
    }
    case 'year':
      return { range: span(monthsBack(from, 12), monthsBack(to, 12)), label: 'vs last year' };
    case '7d':
      return { range: span(addDays(from, -7), addDays(to, -7)), label: 'vs previous 7 days' };
    case '30d':
      return { range: span(addDays(from, -30), addDays(to, -30)), label: 'vs previous 30 days' };
    default:
      return null;
  }
}
