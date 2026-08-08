import { CalendarClock, ChevronRight } from 'lucide-react';

import { BookingsTable } from '@/components/BookingsTable';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { useGetBusinessBookingsQuery } from '@/redux/api/provider/providerApi';

import styles from './UpcomingAppointments.module.css';

interface UpcomingAppointmentsProps {
  providerId: string;
  /** Opens the full Bookings section. */
  onViewAll: () => void;
}

/** Full-width detailed list of the next appointments for a business. */
export function UpcomingAppointments({ providerId, onViewAll }: UpcomingAppointmentsProps) {
  const { data: bookings = [], isLoading } = useGetBusinessBookingsQuery(providerId);

  const now = Date.now();
  const upcoming = bookings
    .filter((b) => b.status !== 'CANCELLED' && new Date(b.endTime).getTime() >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  return (
    <Card
      title="Upcoming appointments"
      subtitle="Your next bookings with customer and payment details."
      action={
        upcoming.length > 0 ? (
          <button type="button" className={styles.viewAll} onClick={onViewAll}>
            View all
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className={styles.list}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={60} radius="var(--radius-md)" />
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <div className={styles.empty}>
          <CalendarClock size={20} aria-hidden="true" />
          <span>No upcoming appointments yet. New bookings will show up here.</span>
        </div>
      ) : (
        <BookingsTable bookings={upcoming} variant="payment" />
      )}
    </Card>
  );
}
