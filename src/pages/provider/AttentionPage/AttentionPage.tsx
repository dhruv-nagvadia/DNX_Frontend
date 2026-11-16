import { CalendarClock, Clock, CircleAlert, Coins, Store, User } from 'lucide-react';

import { Pill } from '@/components/Pill';

import { LeadChip, ViewAllPage, ViewAllRow } from '../TodaysSchedulePage/ViewAllLayout';
import { money } from '../TodaysSchedulePage/money';
import styles from '../TodaysSchedulePage/ViewAll.module.css';
import { useAttentionPage } from './useAttentionPage';

const whenFmt = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

/** Full, unsliced "Needs Your Attention" — every booking needing a confirm or a payment
 * collection, across every business. */
export default function AttentionPage() {
  const { isLoading, attention, currency, goToBusiness } = useAttentionPage();
  const count = attention.length;

  return (
    <ViewAllPage
      title="Needs Your Attention"
      subtitle={`${count} booking${count === 1 ? '' : 's'} need${count === 1 ? 's' : ''} action`}
      isLoading={isLoading}
      isEmpty={count === 0}
      empty={{
        icon: <CircleAlert size={28} strokeWidth={1.6} />,
        title: "You're all caught up",
        description: 'Nothing needs action right now.',
      }}
    >
      {attention.map(({ booking, confirm, collect, due }) => (
        <ViewAllRow
          key={booking.id}
          onOpen={() => goToBusiness(booking.provider.id)}
          lead={
            confirm ? (
              <LeadChip tone="peach" round>
                <CalendarClock size={18} aria-hidden="true" />
              </LeadChip>
            ) : (
              <LeadChip tone="mint" round>
                <Coins size={18} aria-hidden="true" />
              </LeadChip>
            )
          }
          title={booking.service.name}
          lines={
            <>
              <span className={styles.subItem}>
                <User size={14} aria-hidden="true" />
                {booking.user.fullName}
              </span>
              <span className={styles.subItem}>
                <Store size={14} aria-hidden="true" />
                {booking.provider.businessName}
              </span>
              <span className={styles.subItem}>
                <Clock size={14} aria-hidden="true" />
                {whenFmt.format(new Date(booking.startTime))}
              </span>
            </>
          }
          meta={
            <>
              {confirm && <Pill tone="orange">Confirm request</Pill>}
              {collect && <Pill tone="green">Collect {money(due, currency)}</Pill>}
            </>
          }
        />
      ))}
    </ViewAllPage>
  );
}
