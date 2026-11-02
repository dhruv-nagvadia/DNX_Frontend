import { ArrowRight, CalendarClock, CalendarDays } from 'lucide-react';

import { ModernCard, ModernCardLink } from '@/components/ModernCard';
import { Pill, PillTone } from '@/components/Pill';
import { Skeleton } from '@/components/Skeleton';
import { useGetBusinessBookingsQuery } from '@/redux/api/provider/providerApi';
import { ProviderBooking } from '@/redux/api/provider/types';

import styles from './UpcomingAppointments.module.css';

interface UpcomingAppointmentsProps {
  providerId: string;
  /** Opens the full Bookings section. */
  onViewAll: () => void;
}

const LIMIT = 5;
const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });

function money(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
      minor / 100,
    );
  } catch {
    return `₹${Math.round(minor / 100)}`;
  }
}

/** Payment pill — mockup shows Paid (green) / Due (orange). */
function paymentPill(b: ProviderBooking): { label: string; tone: PillTone } {
  switch (b.paymentStatus) {
    case 'PAID':
      return { label: 'Paid', tone: 'green' };
    case 'PARTIAL':
      return { label: 'Part-paid', tone: 'blue' };
    case 'REFUNDED':
      return { label: 'Refunded', tone: 'grey' };
    case 'FAILED':
      return { label: 'Failed', tone: 'red' };
    default:
      return { label: 'Due', tone: 'orange' };
  }
}

/** The next 5 appointments for a business (mockup: "Upcoming Appointments (Next 5)"). */
export function UpcomingAppointments({ providerId, onViewAll }: UpcomingAppointmentsProps) {
  const { data: bookings = [], isLoading } = useGetBusinessBookingsQuery(providerId);

  const now = Date.now();
  const upcoming = bookings
    .filter((b) => b.status !== 'CANCELLED' && new Date(b.endTime).getTime() >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, LIMIT);

  return (
    <ModernCard
      icon={<CalendarDays size={22} aria-hidden="true" />}
      title="Upcoming Appointments"
      suffix={`(Next ${LIMIT})`}
      flush
      action={
        <ModernCardLink onClick={onViewAll} iconRight={<ArrowRight size={15} aria-hidden="true" />}>
          View All Bookings
        </ModernCardLink>
      }
    >
      {isLoading ? (
        <div className={styles.list}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={44} radius="var(--m-radius-box)" />
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <div className={styles.empty}>
          <CalendarClock size={20} aria-hidden="true" />
          <span>No upcoming appointments yet. New bookings will show up here.</span>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Customer</th>
                <th>Service</th>
                <th className={styles.num}>Amount</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((b) => {
                const start = new Date(b.startTime);
                const pay = paymentPill(b);
                return (
                  <tr key={b.id}>
                    <td className={styles.nowrap}>
                      {dateFmt.format(start)}, {timeFmt.format(start)}
                    </td>
                    <td>
                      <span className={styles.customer}>{b.user.fullName}</span>
                      {b.user.phone && <span className={styles.phone}>{b.user.phone}</span>}
                    </td>
                    <td>{b.service.name}</td>
                    <td className={`${styles.num} ${styles.amount}`}>{money(b.amountMinor, b.currency)}</td>
                    <td>
                      <Pill tone={pay.tone}>{pay.label}</Pill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ModernCard>
  );
}
