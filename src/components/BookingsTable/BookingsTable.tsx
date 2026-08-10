import { ReactNode } from 'react';
import { Phone } from 'lucide-react';

import { Badge } from '@/components/Badge';
import { BadgeTone } from '@/components/Badge/types';
import { BookingStatus, ProviderBooking } from '@/redux/api/provider/types';

import styles from './BookingsTable.module.css';

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' });

function money(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(minor / 100);
  } catch {
    return `${Math.round(minor / 100)}`;
  }
}

const STATUS: Record<BookingStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'Pending', tone: 'warning' },
  CONFIRMED: { label: 'Confirmed', tone: 'accent' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  NO_SHOW: { label: 'No-show', tone: 'neutral' },
};

/** Payment state derived from booking status (no payments backend yet). */
function payment(status: BookingStatus): { label: string; tone: BadgeTone } {
  return status === 'COMPLETED'
    ? { label: 'Paid', tone: 'success' }
    : { label: 'Pending', tone: 'warning' };
}

interface BookingsTableProps {
  bookings: ProviderBooking[];
  /** Trailing badge column: booking status, or derived payment state. */
  variant?: 'status' | 'payment';
  /** Optional actions column (e.g. confirm/complete/cancel buttons). */
  renderActions?: (booking: ProviderBooking) => ReactNode;
}

/** Shared table used by the Bookings tab and the Overview appointments panel. */
export function BookingsTable({ bookings, variant = 'status', renderActions }: BookingsTableProps) {
  const trailingLabel = variant === 'payment' ? 'Payment' : 'Status';
  const rowClass = `${styles.row} ${renderActions ? styles.withActions : ''}`;

  return (
    <div className={styles.table}>
      <div className={`${rowClass} ${styles.head}`} aria-hidden="true">
        <span>When</span>
        <span>Customer</span>
        <span>Contact</span>
        <span>Service</span>
        <span className={styles.right}>Amount</span>
        <span className={styles.right}>{trailingLabel}</span>
        {renderActions && <span className={styles.right}>Actions</span>}
      </div>

      {bookings.map((b) => {
        const start = new Date(b.startTime);
        const badge = variant === 'payment' ? payment(b.status) : STATUS[b.status];
        return (
          <div className={rowClass} key={b.id}>
            <span className={styles.when} data-label="When">
              <span className={styles.day}>{dateFmt.format(start)}</span>
              <span className={styles.time}>{timeFmt.format(start)}</span>
            </span>
            <span className={styles.customer} data-label="Customer">
              {b.user.fullName}
            </span>
            <span className={styles.contact} data-label="Contact">
              {b.user.phone ? (
                <a className={styles.phone} href={`tel:${b.user.phone}`}>
                  <Phone size={13} aria-hidden="true" />
                  {b.user.phone}
                </a>
              ) : (
                <span className={styles.muted}>—</span>
              )}
            </span>
            <span className={styles.service} data-label="Service">
              {b.service.name}
            </span>
            <span className={`${styles.amount} ${styles.right}`} data-label="Amount">
              {money(b.amountMinor, b.currency)}
            </span>
            <span className={`${styles.trailing} ${styles.right}`} data-label={trailingLabel}>
              <Badge tone={badge.tone}>{badge.label}</Badge>
            </span>
            {renderActions && (
              <span className={`${styles.actions} ${styles.right}`} data-label="Actions">
                {renderActions(b)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
