import { Fragment, useState } from 'react';
import { CalendarDays, Store, User } from 'lucide-react';

import { Pill, PillTone } from '@/components/Pill';
import { BookingStatus } from '@/redux/api/provider/types';

import { useTodaysSchedulePage } from './useTodaysSchedulePage';
import { ViewAllDivider, ViewAllPage, ViewAllRow } from './ViewAllLayout';
import styles from './ViewAll.module.css';

const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

/** "10:30 am" → { main: "10:30", ampm: "AM" }. */
function timeParts(iso: string): { main: string; ampm: string } {
  const parts = timeFmt.formatToParts(new Date(iso));
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '';
  const ampm = parts.find((p) => p.type === 'dayPeriod')?.value ?? '';
  return { main: `${hour}:${minute}`, ampm: ampm.toUpperCase() };
}

const STATUS: Record<BookingStatus, { tone: PillTone; label: string }> = {
  CONFIRMED: { tone: 'blue', label: 'Confirmed' },
  PENDING: { tone: 'orange', label: 'Pending' },
  IN_PROGRESS: { tone: 'lavender', label: 'In progress' },
  COMPLETED: { tone: 'green', label: 'Completed' },
  CANCELLED: { tone: 'red', label: 'Cancelled' },
  NO_SHOW: { tone: 'grey', label: 'No-show' },
};

/** Full, unsliced "Today's Schedule" — every one of today's bookings, across every business. */
export default function TodaysSchedulePage() {
  const { isLoading, todays, goToBusiness } = useTodaysSchedulePage();
  const [now] = useState(() => Date.now());

  // Index of the first upcoming booking; only show "Now" when there are both past and upcoming.
  const firstUpcoming = todays.findIndex((b) => new Date(b.startTime).getTime() >= now);
  const nowAt = firstUpcoming > 0 ? firstUpcoming : -1;

  const count = todays.length;

  return (
    <ViewAllPage
      title="Today's Schedule"
      subtitle={`${count} booking${count === 1 ? '' : 's'} today`}
      isLoading={isLoading}
      isEmpty={count === 0}
      empty={{
        icon: <CalendarDays size={28} strokeWidth={1.6} />,
        title: 'No bookings today',
        description: "Today's bookings across every business will show up here.",
      }}
    >
      {todays.map((b, i) => {
        const t = timeParts(b.startTime);
        const status = STATUS[b.status];
        return (
          <Fragment key={b.id}>
            {i === nowAt && <ViewAllDivider label="Now" />}
            <ViewAllRow
              onOpen={() => goToBusiness(b.provider.id)}
              lead={
                <span className={styles.timeBlock}>
                  <span className={styles.timeMain}>{t.main}</span>
                  <span className={styles.timeAmPm}>{t.ampm}</span>
                </span>
              }
              title={b.service.name}
              lines={
                <>
                  <span className={styles.subItem}>
                    <User size={14} aria-hidden="true" />
                    {b.user.fullName}
                  </span>
                  <span className={styles.subItem}>
                    <Store size={14} aria-hidden="true" />
                    {b.provider.businessName}
                  </span>
                </>
              }
              meta={<Pill tone={status.tone}>{status.label}</Pill>}
            />
          </Fragment>
        );
      })}
    </ViewAllPage>
  );
}
