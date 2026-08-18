import { useState } from 'react';
import { CalendarX2 } from 'lucide-react';

import { BookingsTable } from '@/components/BookingsTable';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import {
  useCollectBookingPaymentMutation,
  useGetBusinessBookingsQuery,
  useUpdateBookingStatusMutation,
} from '@/redux/api/provider/providerApi';
import { BookingStatus, ProviderBooking } from '@/redux/api/provider/types';

/** Amount still owed on a booking (0 if fully paid). */
const outstanding = (b: ProviderBooking) => b.amountMinor - (b.amountPaidMinor ?? 0);

/** A cash / partial booking whose balance the provider still needs to collect. */
const needsCollection = (b: ProviderBooking) =>
  b.status !== 'CANCELLED' &&
  (b.paymentMethod === 'CASH' || b.paymentMethod === 'PARTIAL') &&
  b.paymentStatus !== 'PAID' &&
  b.paymentStatus !== 'REFUNDED' &&
  outstanding(b) > 0;

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

import { BusinessBookingsProps } from './types';
import styles from './BusinessBookings.module.css';

/** Read-only list of a business's bookings, with status actions. */
export function BusinessBookings({ providerId }: BusinessBookingsProps) {
  const { data: bookings, isLoading } = useGetBusinessBookingsQuery(providerId);
  const [updateStatus, { isLoading: updating }] = useUpdateBookingStatusMutation();
  const [collectPayment, { isLoading: collecting }] = useCollectBookingPaymentMutation();

  // Cancel-with-reason modal.
  const [cancelling, setCancelling] = useState<ProviderBooking | null>(null);
  const [reason, setReason] = useState('');

  // Collect-cash confirmation modal.
  const [settling, setSettling] = useState<ProviderBooking | null>(null);

  const setStatus = (bookingId: string, status: BookingStatus) =>
    updateStatus({ id: providerId, bookingId, status });

  const confirmCancel = async () => {
    if (!cancelling) return;
    try {
      await updateStatus({
        id: providerId,
        bookingId: cancelling.id,
        status: 'CANCELLED',
        reason: reason.trim() || undefined,
      }).unwrap();
      setCancelling(null);
      setReason('');
    } catch {
      // surfaced via mutation state
    }
  };

  const confirmCollect = async () => {
    if (!settling) return;
    try {
      await collectPayment({ id: providerId, bookingId: settling.id }).unwrap();
      setSettling(null);
    } catch {
      // surfaced via mutation state
    }
  };

  const renderActions = (b: ProviderBooking) => {
    const cancelBtn = (
      <button
        type="button"
        className={`${styles.actionBtn} ${styles.cancel}`}
        disabled={updating}
        onClick={() => {
          setReason('');
          setCancelling(b);
        }}
      >
        Cancel
      </button>
    );

    const collectBtn = needsCollection(b) ? (
      <button
        type="button"
        className={`${styles.actionBtn} ${styles.collect}`}
        disabled={collecting}
        onClick={() => setSettling(b)}
      >
        Collect {money(outstanding(b), b.currency)}
      </button>
    ) : null;

    if (b.status === 'PENDING') {
      return (
        <>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.confirm}`}
            disabled={updating}
            onClick={() => setStatus(b.id, 'CONFIRMED')}
          >
            Confirm
          </button>
          {cancelBtn}
          {collectBtn}
        </>
      );
    }
    if (b.status === 'CONFIRMED') {
      return (
        <>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.complete}`}
            disabled={updating}
            onClick={() => setStatus(b.id, 'COMPLETED')}
          >
            Complete
          </button>
          {cancelBtn}
          {collectBtn}
        </>
      );
    }
    // Terminal statuses (e.g. COMPLETED) may still have cash left to collect.
    return collectBtn ?? <span className={styles.noActions}>—</span>;
  };

  if (isLoading) {
    return (
      <Card title="Bookings">
        <div className={styles.list}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={60} radius="var(--radius-md)" />
          ))}
        </div>
      </Card>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <EmptyState
        icon={<CalendarX2 size={28} strokeWidth={1.6} aria-hidden="true" />}
        title="No bookings yet"
        description="When customers book this business from the app, their appointments show up here."
      />
    );
  }

  const now = Date.now();
  const upcoming = bookings.filter(
    (b) => b.status !== 'CANCELLED' && new Date(b.endTime).getTime() >= now,
  );

  return (
    <>
      <Card title="Bookings" subtitle={`${bookings.length} total · ${upcoming.length} upcoming`}>
        <BookingsTable bookings={bookings} variant="both" renderActions={renderActions} />
      </Card>

      {cancelling && (
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Cancel this booking?</h3>
            <p className={styles.modalSub}>
              {cancelling.user.fullName} · {cancelling.service.name}
            </p>
            <label className={styles.modalLabel} htmlFor="cancelReason">
              Reason for the customer <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="cancelReason"
              className={styles.textarea}
              placeholder="e.g. Sorry, we're fully booked at that time."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
            />
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setCancelling(null)} disabled={updating}>
                Keep booking
              </Button>
              <Button onClick={confirmCancel} loading={updating} loadingText="Cancelling…">
                Cancel booking
              </Button>
            </div>
          </div>
        </div>
      )}

      {settling && (
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>
              Collect {money(outstanding(settling), settling.currency)} in cash?
            </h3>
            <p className={styles.modalSub}>
              {settling.user.fullName} · {settling.service.name}
              {settling.paymentMethod === 'PARTIAL' && ' · balance after the online deposit'}
            </p>
            <p className={styles.modalSub}>
              This marks the booking fully paid. Only confirm once you’ve received the cash.
            </p>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setSettling(null)} disabled={collecting}>
                Not yet
              </Button>
              <Button onClick={confirmCollect} loading={collecting} loadingText="Saving…">
                Mark paid
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
