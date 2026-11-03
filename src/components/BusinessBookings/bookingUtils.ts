import { PillTone } from '@/components/Pill';
import { BookingStatus, ProviderBooking } from '@/redux/api/provider/types';

export function money(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(minor / 100);
  } catch {
    return `₹${Math.round(minor / 100)}`;
  }
}

/** No sequential booking number exists — show the tail of the id, e.g. "#B7K2Q9". */
export const shortId = (b: ProviderBooking) => `#${b.id.slice(-6).toUpperCase()}`;

/** Amount still owed on a booking (0 if fully paid). */
export const outstandingOf = (b: ProviderBooking) => Math.max(0, b.amountMinor - (b.amountPaidMinor ?? 0));

/** A cash / partial booking whose balance the provider still needs to collect
 * (same rule as before the redesign and as the server's collect endpoint). */
export const needsCollect = (b: ProviderBooking) =>
  b.status !== 'CANCELLED' &&
  (b.paymentMethod === 'CASH' || b.paymentMethod === 'PARTIAL') &&
  b.paymentStatus !== 'PAID' &&
  b.paymentStatus !== 'REFUNDED' &&
  outstandingOf(b) > 0;

export const isCancelled = (b: ProviderBooking) => b.status === 'CANCELLED' || b.status === 'NO_SHOW';

/** NO_SHOW is only accepted by the server once the appointment has started. */
export const startPassed = (b: ProviderBooking) => new Date(b.startTime).getTime() <= Date.now();

/** Service length — the service's own duration, else the booked slot length. */
export function durationMin(b: ProviderBooking): number {
  if (b.service.durationMin) return b.service.durationMin;
  return Math.max(0, Math.round((new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 60000));
}

export const STATUS: Record<BookingStatus, { label: string; tone: PillTone }> = {
  PENDING: { label: 'New request', tone: 'lavender' },
  CONFIRMED: { label: 'Confirmed', tone: 'blue' },
  IN_PROGRESS: { label: 'In progress', tone: 'teal' },
  COMPLETED: { label: 'Completed', tone: 'green' },
  CANCELLED: { label: 'Cancelled', tone: 'grey' },
  NO_SHOW: { label: 'No-show', tone: 'red' },
};

export function payBadge(b: ProviderBooking): { label: string; tone: PillTone } {
  const due = outstandingOf(b);
  if (b.paymentStatus === 'REFUNDED') return { label: 'Refunded', tone: 'lavender' };
  if (b.paymentStatus === 'PAID' || (b.amountMinor > 0 && due === 0)) return { label: 'Paid', tone: 'green' };
  if (needsCollect(b)) {
    if (b.paymentMethod === 'PARTIAL' || (b.amountPaidMinor ?? 0) > 0) {
      return { label: `Part-paid · ${money(due, b.currency)} due`, tone: 'blue' };
    }
    return { label: `Cash · ${money(due, b.currency)} due`, tone: 'grey' };
  }
  if (b.paymentMethod === 'CASH') return { label: 'Cash', tone: 'grey' };
  if (b.paymentMethod === 'PARTIAL') return { label: 'Partial', tone: 'grey' };
  if (b.paymentStatus === 'FAILED') return { label: 'Payment failed', tone: 'red' };
  return isCancelled(b) ? { label: 'Unpaid', tone: 'grey' } : { label: 'Payment pending', tone: 'yellow' };
}

export function methodInfo(b: ProviderBooking): { text: string; chip: string } {
  if (b.paymentMethod === 'CASH') return { text: 'Cash at the salon', chip: 'COD' };
  if (b.paymentMethod === 'PARTIAL') return { text: 'Partial – deposit online', chip: 'Partial' };
  return {
    text: b.paymentStatus === 'PAID' || b.paymentStatus === 'REFUNDED' ? 'Paid online' : 'Online – payment pending',
    chip: 'Online',
  };
}

// ── Dates ──────────────────────────────────────────────────────────────

const dayFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Whole calendar days from today (0 = today, 1 = tomorrow, −1 = yesterday). */
const dayOffset = (d: Date) =>
  Math.round((startOfDay(d).getTime() - startOfDay(new Date()).getTime()) / 86_400_000);

/** "Today" / "Tomorrow" / "Yesterday" / "Nov 15". */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const off = dayOffset(d);
  if (off === 0) return 'Today';
  if (off === 1) return 'Tomorrow';
  if (off === -1) return 'Yesterday';
  return dayFmt.format(d);
}

/** "9:05 AM" — built by hand so the separator is always a plain space. */
function hm(d: Date): { hm: string; period: 'AM' | 'PM' } {
  const h = d.getHours();
  return { hm: `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`, period: h < 12 ? 'AM' : 'PM' };
}
export function time12(iso: string): string {
  const t = hm(new Date(iso));
  return `${t.hm} ${t.period}`;
}

/** "10:00 – 10:45 AM", or "11:30 AM – 12:15 PM" across noon. */
export function timeRange(startIso: string, endIso: string): string {
  const s = hm(new Date(startIso));
  const e = hm(new Date(endIso));
  return s.period === e.period ? `${s.hm} – ${e.hm} ${e.period}` : `${s.hm} ${s.period} – ${e.hm} ${e.period}`;
}

/** "11:32" — 24h clock, as in "started 11:32". */
export function clock(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "2h ago" / "15m ago" / "yesterday" / "on Nov 1". */
export function bookedAgo(iso: string): string {
  const d = new Date(iso);
  const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const off = dayOffset(d);
  if (off === 0 || mins < 12 * 60) return `${Math.floor(mins / 60)}h ago`;
  if (off === -1) return 'yesterday';
  return `on ${dayFmt.format(d)}`;
}

/** "Requested today at 8:12 AM" / "Requested on Oct 29 at 7:20 PM". */
export function formatRequested(iso: string): string {
  const d = new Date(iso);
  const off = dayOffset(d);
  const when = off === 0 ? 'today' : off === -1 ? 'yesterday' : `on ${dayFmt.format(d)}`;
  return `Requested ${when} at ${time12(iso)}`;
}

// ── Filters ────────────────────────────────────────────────────────────

export type StatusTab = 'ALL' | 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export const TABS: { key: StatusTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'New' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export function matchesTab(b: ProviderBooking, tab: StatusTab): boolean {
  if (tab === 'ALL') return true;
  if (tab === 'CANCELLED') return isCancelled(b);
  return b.status === tab;
}

export type DateFilter = 'TODAY' | 'TOMORROW' | 'WEEK' | 'ALL';

export const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'TODAY', label: 'Today' },
  { key: 'TOMORROW', label: 'Tomorrow' },
  { key: 'WEEK', label: 'This week' },
  { key: 'ALL', label: 'All dates' },
];

export const isToday = (b: ProviderBooking) => dayOffset(new Date(b.startTime)) === 0;

export function matchesDate(b: ProviderBooking, f: DateFilter): boolean {
  if (f === 'ALL') return true;
  const start = new Date(b.startTime);
  if (f === 'TODAY') return dayOffset(start) === 0;
  if (f === 'TOMORROW') return dayOffset(start) === 1;
  // This calendar week, Monday → Sunday.
  const today = startOfDay(new Date());
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  return start >= monday && start < addDays(monday, 7);
}
