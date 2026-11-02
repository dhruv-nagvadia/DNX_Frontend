import { KeyboardEvent } from 'react';
import { CircleAlert } from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';

import { AttentionItem, useAttentionPage } from './useAttentionPage';
import styles from '../DashboardPage/DashboardPage.module.css';

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
    <tr className={styles.tr} {...rowActivation(onOpen)}>
      <td>
        <span className={styles.rowTitle}>{booking.service.name}</span>
        <span className={styles.rowSub}>Booking #{booking.id.slice(-6).toUpperCase()}</span>
      </td>
      <td>{booking.user.fullName}</td>
      <td>
        <span className={styles.businessName}>{booking.provider.businessName}</span>
      </td>
      <td className={styles.actionCell}>
        <div className={styles.actionStack}>
          {confirm && <Badge tone="warning">Confirm Request</Badge>}
          {collect && <Badge tone="success">Collect {money(due, currency)}</Badge>}
        </div>
      </td>
    </tr>
  );
}

/** Full, unsliced "Needs Your Attention" — every booking needing a confirm or a payment
 * collection, across every business. */
export default function AttentionPage() {
  const { isLoading, attention, currency, goToBusiness } = useAttentionPage();

  return (
    <AppShell>
      <PageHeader
        title="Needs Your Attention"
        subtitle="Bookings across all your businesses that need a confirm or a payment collected."
      />

      {isLoading ? (
        <Skeleton height={240} radius="var(--radius-xl)" />
      ) : (
        <Card flush>
          {attention.length === 0 ? (
            <EmptyState
              icon={<CircleAlert size={28} strokeWidth={1.6} aria-hidden="true" />}
              title="You're all caught up"
              description="Nothing needs action right now."
            />
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Service / Booking</th>
                  <th>Customer</th>
                  <th>Business</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {attention.map((item) => (
                  <AttentionRow
                    key={item.booking.id}
                    item={item}
                    currency={currency}
                    onOpen={() => goToBusiness(item.booking.provider.id)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </AppShell>
  );
}
