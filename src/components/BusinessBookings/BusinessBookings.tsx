import { CalendarX2 } from 'lucide-react';

import { BookingsTable } from '@/components/BookingsTable';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { useGetBusinessBookingsQuery } from '@/redux/api/provider/providerApi';

import { BusinessBookingsProps } from './types';
import styles from './BusinessBookings.module.css';

/** Read-only list of a business's bookings for the provider dashboard. */
export function BusinessBookings({ providerId }: BusinessBookingsProps) {
  const { data: bookings, isLoading } = useGetBusinessBookingsQuery(providerId);

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
    <Card title="Bookings" subtitle={`${bookings.length} total · ${upcoming.length} upcoming`}>
      <BookingsTable bookings={bookings} variant="status" />
    </Card>
  );
}
