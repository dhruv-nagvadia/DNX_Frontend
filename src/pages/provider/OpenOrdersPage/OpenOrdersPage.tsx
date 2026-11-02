import { KeyboardEvent } from 'react';
import { Package } from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { OrderStatus, ProviderOrder } from '@/redux/api/provider/types';

import { useOpenOrdersPage } from './useOpenOrdersPage';
import styles from '../DashboardPage/DashboardPage.module.css';

type Tone = 'warning' | 'accent' | 'success' | 'neutral' | 'brand';

const ORDER_TONE: Record<OrderStatus, Tone> = {
  PENDING: 'warning',
  CONFIRMED: 'accent',
  READY: 'brand',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  NO_SHOW: 'neutral',
};

const ORDER_LABEL: Record<OrderStatus, string> = {
  PENDING: 'new',
  CONFIRMED: 'confirmed',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
};

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

function shortOrderId(id: string): string {
  return `#${id.slice(-6).toUpperCase()}`;
}

const orderOutstanding = (o: ProviderOrder) => o.amountMinor - (o.amountPaidMinor ?? 0);

/** The payment line shown on every order row, even when fully settled. */
function paymentLine(order: ProviderOrder, currency: string): string {
  if (order.paymentMethod === 'ONLINE') {
    return order.paymentStatus === 'PAID' ? 'Paid' : 'Online';
  }
  const label = order.paymentMethod === 'CASH' ? 'COD' : 'Partial';
  return `${label}: ${money(orderOutstanding(order), currency)}`;
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

/** One order row: order id, who/where, item count, status and payment. */
function OrderRow({
  order,
  currency,
  onOpen,
}: {
  order: ProviderOrder;
  currency: string;
  onOpen: () => void;
}) {
  const itemCount = order.items.length;
  return (
    <tr className={styles.tr} {...rowActivation(onOpen)}>
      <td className={styles.idCell}>{shortOrderId(order.id)}</td>
      <td>{order.user.fullName}</td>
      <td>
        <span className={styles.businessName}>{order.provider.businessName}</span>
      </td>
      <td>
        {itemCount} item{itemCount === 1 ? '' : 's'}
      </td>
      <td>
        <Badge tone={ORDER_TONE[order.status]}>{ORDER_LABEL[order.status]}</Badge>
      </td>
      <td className={styles.paymentCell}>{paymentLine(order, currency)}</td>
    </tr>
  );
}

/** Full, unsliced "Orders to Fulfil" — every order still working through fulfilment,
 * across every business. */
export default function OpenOrdersPage() {
  const { isLoading, openOrders, currency, goToBusinessOrders } = useOpenOrdersPage();

  return (
    <AppShell>
      <PageHeader title="Orders to Fulfil" subtitle="Every open order across all your businesses." />

      {isLoading ? (
        <Skeleton height={240} radius="var(--radius-xl)" />
      ) : (
        <Card flush>
          {openOrders.length === 0 ? (
            <EmptyState
              icon={<Package size={28} strokeWidth={1.6} aria-hidden="true" />}
              title="No open orders"
              description="You're all caught up."
            />
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Business</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {openOrders.map((o) => (
                  <OrderRow
                    key={o.id}
                    order={o}
                    currency={currency}
                    onOpen={() => goToBusinessOrders(o.provider.id)}
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
