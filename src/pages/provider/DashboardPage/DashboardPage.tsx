import {
  CalendarClock,
  CalendarDays,
  ChevronRight,
  IndianRupee,
  ListChecks,
  Plus,
  Store,
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { StatTile } from '@/components/StatTile';
import { BookingStatus } from '@/redux/api/provider/types';

import { AttentionItem, useDashboard } from './useDashboard';
import styles from './DashboardPage.module.css';

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
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

const STATUS_TONE: Record<BookingStatus, 'warning' | 'accent' | 'success' | 'neutral'> = {
  PENDING: 'warning',
  CONFIRMED: 'accent',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  NO_SHOW: 'neutral',
};

/** Home dashboard — a command center across all of the provider's businesses. */
export default function DashboardPage() {
  const {
    fullName,
    isLoading,
    hasBusinesses,
    todays,
    upcomingCount,
    attention,
    collectedThisMonth,
    currency,
    goToBusiness,
    addBusiness,
    viewBusinesses,
  } = useDashboard();

  const firstName = fullName.trim().split(/\s+/)[0] || 'there';

  const addButton = (
    <Button onClick={addBusiness} iconLeft={<Plus size={18} aria-hidden="true" />}>
      Add business
    </Button>
  );

  return (
    <AppShell wide>
      <PageHeader
        eyebrow={dateFmt.format(new Date())}
        title={`Welcome back, ${firstName}`}
        subtitle="Here's what's happening across your businesses today."
        actions={hasBusinesses ? addButton : undefined}
      />

      {isLoading ? (
        <div className={styles.stats}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={96} radius="var(--radius-lg)" />
          ))}
        </div>
      ) : !hasBusinesses ? (
        <EmptyState
          icon={<Store size={28} strokeWidth={1.6} aria-hidden="true" />}
          title="Let's set up your first business"
          description="Add a business so customers can discover and book you. Once bookings come in, this dashboard shows your day at a glance."
          action={
            <Button onClick={addBusiness} iconLeft={<Plus size={18} aria-hidden="true" />}>
              Add your first business
            </Button>
          }
        />
      ) : (
        <>
          <div className={styles.stats}>
            <StatTile
              label="Today's bookings"
              value={todays.length}
              icon={<CalendarDays size={18} aria-hidden="true" />}
            />
            <StatTile
              label="Upcoming"
              value={upcomingCount}
              icon={<CalendarClock size={18} aria-hidden="true" />}
              note="confirmed & pending"
            />
            <StatTile
              label="Needs action"
              value={attention.length}
              icon={<ListChecks size={18} aria-hidden="true" />}
              note="to confirm or collect"
            />
            <StatTile
              label="Collected this month"
              value={money(collectedThisMonth, currency)}
              icon={<IndianRupee size={18} aria-hidden="true" />}
            />
          </div>

          <div className={styles.columns}>
            <Card
              title="Needs your attention"
              subtitle="Bookings to confirm or payments to collect."
              action={
                <button type="button" className={styles.viewAll} onClick={viewBusinesses}>
                  All businesses
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              }
            >
              {attention.length === 0 ? (
                <p className={styles.empty}>You're all caught up. Nothing needs action.</p>
              ) : (
                <ul className={styles.list}>
                  {attention.slice(0, 6).map((item) => (
                    <AttentionRow
                      key={item.booking.id}
                      item={item}
                      currency={currency}
                      onOpen={() => goToBusiness(item.booking.provider.id)}
                    />
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Today's schedule" subtitle="Your appointments for today, in order.">
              {todays.length === 0 ? (
                <p className={styles.empty}>No bookings today. Enjoy the breather.</p>
              ) : (
                <ul className={styles.list}>
                  {todays.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        className={styles.row}
                        onClick={() => goToBusiness(b.provider.id)}
                      >
                        <span className={styles.time}>{timeFmt.format(new Date(b.startTime))}</span>
                        <span className={styles.rowMain}>
                          <span className={styles.rowTitle}>{b.user.fullName}</span>
                          <span className={styles.rowSub}>
                            {b.service.name} · {b.provider.businessName}
                          </span>
                        </span>
                        <Badge tone={STATUS_TONE[b.status]}>{b.status.toLowerCase()}</Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}

/** One "needs attention" row: what's wrong + who/where, links to the business. */
function AttentionRow({
  item,
  currency,
  onOpen,
}: {
  item: AttentionItem;
  currency: string;
  onOpen: () => void;
}) {
  const { booking, confirm, collect, due } = item;
  return (
    <li>
      <button type="button" className={styles.row} onClick={onOpen}>
        <span className={styles.badges}>
          {confirm && <Badge tone="warning">Confirm</Badge>}
          {collect && <Badge tone="success">Collect {money(due, currency)}</Badge>}
        </span>
        <span className={styles.rowMain}>
          <span className={styles.rowTitle}>{booking.user.fullName}</span>
          <span className={styles.rowSub}>
            {booking.service.name} · {booking.provider.businessName}
          </span>
        </span>
        <ChevronRight size={16} aria-hidden="true" className={styles.chevron} />
      </button>
    </li>
  );
}
