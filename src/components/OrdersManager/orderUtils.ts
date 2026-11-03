import { PillTone } from '@/components/Pill';
import { OrderStatus, ProviderOrder, ProviderOrderItem } from '@/redux/api/provider/types';

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

export const lineTotal = (it: ProviderOrderItem) =>
  Math.round((it.quantity / it.priceQty) * it.priceMinor);

/** No sequential order number exists — show the tail of the id, e.g. "#A1B2C3". */
export const shortId = (o: ProviderOrder) => `#${o.id.slice(-6).toUpperCase()}`;

export const outstandingOf = (o: ProviderOrder) => Math.max(0, o.amountMinor - o.amountPaidMinor);

/** Same rule as before the redesign: anything still owed on a live order can be collected. */
export const needsCollect = (o: ProviderOrder) =>
  o.status !== 'CANCELLED' && o.paymentStatus !== 'PAID' && o.amountMinor - o.amountPaidMinor > 0;

export const canCancel = (o: ProviderOrder) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED';

export const NEXT: Partial<Record<OrderStatus, { label: string; to: OrderStatus }>> = {
  PENDING: { label: 'Confirm Order', to: 'CONFIRMED' },
  CONFIRMED: { label: 'Mark Ready', to: 'READY' },
  READY: { label: 'Complete Order', to: 'COMPLETED' },
};

export const isCancelled = (o: ProviderOrder) => o.status === 'CANCELLED' || o.status === 'NO_SHOW';

export const STATUS: Record<OrderStatus, { label: string; tone: PillTone }> = {
  PENDING: { label: 'New', tone: 'lavender' },
  CONFIRMED: { label: 'Confirmed', tone: 'blue' },
  READY: { label: 'Ready for pickup', tone: 'green' },
  COMPLETED: { label: 'Completed', tone: 'grey' },
  CANCELLED: { label: 'Cancelled', tone: 'grey' },
  NO_SHOW: { label: 'No-show', tone: 'grey' },
};

export function payBadge(o: ProviderOrder): { label: string; tone: PillTone } {
  if (o.paymentStatus === 'REFUNDED') {
    return { label: `Refunded ${money(o.amountPaidMinor, o.currency)}`, tone: 'lavender' };
  }
  // A cancelled/no-show mixed cart can refund only the static-item portion —
  // paymentStatus stays as-is since it's not a full refund.
  if ((o.refundedMinor ?? 0) > 0) {
    return { label: `Partially refunded ${money(o.refundedMinor ?? 0, o.currency)}`, tone: 'lavender' };
  }
  if (o.paymentStatus === 'PAID') {
    return { label: o.paymentMethod === 'CASH' ? 'Paid (cash)' : 'Paid', tone: 'green' };
  }
  // Partial pay: the deposit went through online, the rest is collected at pickup.
  if (o.paymentStatus === 'PARTIAL') {
    return { label: `Part-paid · ${money(outstandingOf(o), o.currency)} due`, tone: 'blue' };
  }
  if (o.paymentMethod === 'CASH') {
    return { label: `COD · ${money(outstandingOf(o), o.currency)} due`, tone: 'grey' };
  }
  return { label: 'Payment pending', tone: 'yellow' };
}

export function methodInfo(o: ProviderOrder): { text: string; chip: string } {
  if (o.paymentMethod === 'CASH') return { text: 'Cash on pickup', chip: 'COD' };
  if (o.paymentMethod === 'PARTIAL') return { text: 'Partial – deposit online', chip: 'Partial' };
  return {
    text: o.paymentStatus === 'PAID' || o.paymentStatus === 'REFUNDED' ? 'Paid online' : 'Online – payment pending',
    chip: 'Online',
  };
}

const timeFmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function dayWord(d: Date): string | null {
  const now = new Date();
  if (sameDay(d, now)) return 'Today';
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return 'Yesterday';
  return null;
}

/** "Today, 10:42 AM" / "Oct 29, 07:20 PM". */
export function formatWhen(iso: string): string {
  const d = new Date(iso);
  return `${dayWord(d) ?? dayFmt.format(d)}, ${timeFmt.format(d)}`;
}

/** "Placed today at 10:42 AM" / "Placed on Oct 29 at 07:20 PM". */
export function formatPlaced(iso: string): string {
  const d = new Date(iso);
  const w = dayWord(d);
  return `Placed ${w ? w.toLowerCase() : `on ${dayFmt.format(d)}`} at ${timeFmt.format(d)}`;
}

export type StatusTab = 'ALL' | 'PENDING' | 'CONFIRMED' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentFilter = 'ALL' | 'ONLINE' | 'CASH' | 'PARTIAL';

export const TABS: { key: StatusTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'New' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'READY', label: 'Ready' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export function matchesTab(o: ProviderOrder, tab: StatusTab): boolean {
  if (tab === 'ALL') return true;
  if (tab === 'CANCELLED') return isCancelled(o);
  return o.status === tab;
}
