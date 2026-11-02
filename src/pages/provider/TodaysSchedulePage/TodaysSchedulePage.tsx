import { KeyboardEvent } from 'react';
import { CalendarDays, ChevronRight } from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';

import { useTodaysSchedulePage } from './useTodaysSchedulePage';
import styles from '../DashboardPage/DashboardPage.module.css';

const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' });

/** Spreads onto a clickable <tr> so it's reachable and activatable by keyboard too. */
function rowActivation(onOpen: () => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick: onOpen,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen();
      }
    },
  };
}

/** Full, unsliced "Today's Schedule" — every one of today's bookings, across every business. */
export default function TodaysSchedulePage() {
  const { isLoading, todays, goToBusiness } = useTodaysSchedulePage();

  return (
    <AppShell>
      <PageHeader title="Today's Schedule" subtitle="Every booking across all your businesses, today." />

      {isLoading ? (
        <Skeleton height={240} radius="var(--radius-xl)" />
      ) : (
        <Card flush>
          {todays.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={28} strokeWidth={1.6} aria-hidden="true" />}
              title="No bookings today"
              description="Today's bookings across every business will show up here."
            />
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Service</th>
                  <th>Customer</th>
                  <th>Business</th>
                  <th aria-hidden="true" />
                </tr>
              </thead>
              <tbody>
                {todays.map((b) => (
                  <tr key={b.id} className={styles.tr} {...rowActivation(() => goToBusiness(b.provider.id))}>
                    <td className={styles.timeCell}>{timeFmt.format(new Date(b.startTime))}</td>
                    <td>{b.service.name}</td>
                    <td>{b.user.fullName}</td>
                    <td>
                      <span className={styles.businessName}>{b.provider.businessName}</span>
                    </td>
                    <td className={styles.chevronCell}>
                      <ChevronRight size={16} aria-hidden="true" className={styles.chevron} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </AppShell>
  );
}
