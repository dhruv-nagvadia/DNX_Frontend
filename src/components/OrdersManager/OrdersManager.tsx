import { Fragment, useState } from 'react';
import { ChevronDown, Clock, ImagePlus, LifeBuoy, Phone, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { BadgeTone } from '@/components/Badge/types';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import {
  useGetMyOrdersQuery,
  useUpdateOrderStatusMutation,
  useCollectOrderPaymentMutation,
} from '@/redux/api/provider/providerApi';
import { OrderStatus, ProviderOrder, ProviderOrderItem } from '@/redux/api/provider/types';
import { formatAmount, priceLabel } from '@/utils/units';

import styles from './OrdersManager.module.css';

function money(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(minor / 100);
  } catch {
    return `₹${Math.round(minor / 100)}`;
  }
}

const lineTotal = (it: ProviderOrderItem) => Math.round((it.quantity / it.priceQty) * it.priceMinor);

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

const STATUS: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  PENDING: { label: 'New', tone: 'warning' },
  CONFIRMED: { label: 'Confirmed', tone: 'accent' },
  READY: { label: 'Ready for pickup', tone: 'brand' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  NO_SHOW: { label: 'No-show', tone: 'error' },
};

function payBadge(o: ProviderOrder): { label: string; tone: BadgeTone } {
  if (o.paymentStatus === 'REFUNDED') {
    return { label: `Refunded ${money(o.amountPaidMinor, o.currency)}`, tone: 'accent' };
  }
  // A cancelled/no-show mixed cart can refund only the static-item portion —
  // paymentStatus stays as-is since it's not a full refund.
  if ((o.refundedMinor ?? 0) > 0) {
    return { label: `Partially refunded ${money(o.refundedMinor ?? 0, o.currency)}`, tone: 'accent' };
  }
  if (o.paymentStatus === 'PAID') {
    return { label: o.paymentMethod === 'CASH' ? 'Paid (cash)' : 'Paid', tone: 'success' };
  }
  // Partial pay: the deposit went through online, the rest is collected at pickup.
  if (o.paymentStatus === 'PARTIAL') {
    return {
      label: `Part-paid · ${money(Math.max(0, o.amountMinor - o.amountPaidMinor), o.currency)} due at pickup`,
      tone: 'accent',
    };
  }
  if (o.paymentMethod === 'CASH') return { label: 'Cash · at pickup', tone: 'warning' };
  return { label: 'Payment pending', tone: 'warning' };
}

/** Store order management: view incoming orders and move them through fulfilment. */
export function OrdersManager({ providerId }: { providerId: string }) {
  const navigate = useNavigate();
  // Refetch whenever this tab is opened, the browser tab regains focus, or
  // every 30s while it's open — new orders come from the customer app, a
  // separate client, so nothing in this app's own cache would otherwise know
  // to invalidate a stale result.
  const { data: allOrders = [], isLoading } = useGetMyOrdersQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    pollingInterval: 30_000,
  });
  const [updateStatus, { isLoading: updating }] = useUpdateOrderStatusMutation();
  const [collect, { isLoading: collecting }] = useCollectOrderPaymentMutation();

  const orders = allOrders.filter((o) => o.provider.id === providerId);
  const busy = updating || collecting;

  // Cancel-with-reason modal.
  const [cancelling, setCancelling] = useState<ProviderOrder | null>(null);
  const [reason, setReason] = useState('');

  // Which order's row is expanded to show its full item breakdown.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggleExpanded = (orderId: string) => {
    setExpandedId((prev) => (prev === orderId ? null : orderId));
  };

  const setStatus = (o: ProviderOrder, status: OrderStatus) => {
    updateStatus({ orderId: o.id, providerId, status });
  };

  const openCancel = (o: ProviderOrder) => {
    setReason('');
    setCancelling(o);
  };

  const confirmCancel = async () => {
    if (!cancelling) return;
    try {
      await updateStatus({
        orderId: cancelling.id,
        providerId,
        status: 'CANCELLED',
        reason: reason.trim() || undefined,
      }).unwrap();
      setCancelling(null);
      setReason('');
    } catch {
      // surfaced via mutation state
    }
  };

  if (isLoading) {
    return (
      <Card title="Orders">
        <div className={styles.list}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={120} radius="var(--radius-md)" />
          ))}
        </div>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag size={28} strokeWidth={1.6} aria-hidden="true" />}
        title="No orders yet"
        description="When customers order your products from the app, their pickup orders show up here."
      />
    );
  }

  const renderActions = (o: ProviderOrder) => {
    const outstanding = o.amountMinor - o.amountPaidMinor;
    const needsCollect = o.status !== 'CANCELLED' && o.paymentStatus !== 'PAID' && outstanding > 0;

    const next: Partial<Record<OrderStatus, { label: string; to: OrderStatus }>> = {
      PENDING: { label: 'Confirm', to: 'CONFIRMED' },
      CONFIRMED: { label: 'Mark ready', to: 'READY' },
      READY: { label: 'Complete', to: 'COMPLETED' },
    };
    const advance = next[o.status];
    const canCancel = o.status !== 'COMPLETED' && o.status !== 'CANCELLED';

    return (
      <>
        {advance && (
          <button
            type="button"
            className={`${styles.btn} ${styles.primary}`}
            disabled={busy}
            onClick={() => setStatus(o, advance.to)}
          >
            {advance.label}
          </button>
        )}
        {needsCollect && (
          <button
            type="button"
            className={`${styles.btn} ${styles.collect}`}
            disabled={busy}
            onClick={() => collect({ orderId: o.id, providerId })}
          >
            Collect {money(outstanding, o.currency)}
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            className={`${styles.btn} ${styles.cancel}`}
            disabled={busy}
            onClick={() => openCancel(o)}
          >
            Cancel
          </button>
        )}
        {!advance && !needsCollect && !canCancel && <span className={styles.noActions}>—</span>}
      </>
    );
  };

  return (
    <>
    <Card
      title="Orders"
      action={
        <Button
          variant="secondary"
          iconLeft={<LifeBuoy size={14} aria-hidden="true" />}
          onClick={() => navigate('/support')}
        >
          Need help?
        </Button>
      }
    >
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th aria-hidden="true" />
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const st = STATUS[o.status];
              const pay = payBadge(o);
              const expanded = expandedId === o.id;
              const itemCount = o.items.length;
              const shownItems = o.items.slice(0, 2);
              const moreCount = itemCount - shownItems.length;
              return (
                <Fragment key={o.id}>
                  <tr
                    className={styles.row}
                    onClick={() => toggleExpanded(o.id)}
                    aria-expanded={expanded}
                  >
                    <td className={styles.expandCell}>
                      <ChevronDown
                        size={16}
                        className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}
                        aria-hidden="true"
                      />
                    </td>
                    <td>
                      <div className={styles.cust}>
                        <span className={styles.name}>{o.user.fullName}</span>
                        {o.user.phone ? (
                          <a
                            className={styles.phone}
                            href={`tel:${o.user.phone}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone size={12} aria-hidden="true" />
                            {o.user.phone}
                          </a>
                        ) : null}
                        <span className={styles.when}>
                          <Clock size={12} aria-hidden="true" />
                          {dateFmt.format(new Date(o.createdAt))}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.itemsSummary}>
                        {shownItems.map((it) => (
                          <span className={styles.itemsSummaryLine} key={it.id}>
                            {it.name}
                          </span>
                        ))}
                        {moreCount > 0 && (
                          <span className={styles.itemsSummaryMore}>+{moreCount} more</span>
                        )}
                      </div>
                    </td>
                    <td className={styles.total}>{money(o.amountMinor, o.currency)}</td>
                    <td>
                      <div className={styles.statusStack}>
                        <Badge tone={st.tone}>{st.label}</Badge>
                        <Badge tone={pay.tone}>{pay.label}</Badge>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                        {renderActions(o)}
                      </div>
                    </td>
                  </tr>

                  {expanded && (
                    <tr className={styles.detailRow}>
                      <td colSpan={6}>
                        <div className={styles.detailPanel}>
                          <ul className={styles.detailItems}>
                            {o.items.map((it) => (
                              <li className={styles.detailItem} key={it.id}>
                                {it.product?.imageUrl ? (
                                  <img
                                    className={styles.detailThumb}
                                    src={it.product.imageUrl}
                                    alt=""
                                  />
                                ) : (
                                  <span className={styles.detailThumbPlaceholder} aria-hidden="true">
                                    <ImagePlus size={16} />
                                  </span>
                                )}
                                <span className={styles.detailItemName}>
                                  {it.name} · {formatAmount(it.quantity, it.measure)}
                                  <span className={styles.detailItemUnitPrice}>
                                    {' '}
                                    · {priceLabel(it.priceMinor, it.priceQty, it.measure, o.currency)}
                                  </span>
                                </span>
                                <span className={styles.detailItemPrice}>
                                  {money(lineTotal(it), o.currency)}
                                </span>
                              </li>
                            ))}
                          </ul>

                          {(o.status === 'CANCELLED' || o.status === 'NO_SHOW') && o.cancelReason ? (
                            <p className={styles.cancelNote}>
                              {o.status === 'NO_SHOW' ? 'No-show note' : 'Cancellation note'}:{' '}
                              {o.cancelReason}
                            </p>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>

    {cancelling && (
      <div className={styles.overlay} role="dialog" aria-modal="true">
        <div className={styles.modal}>
          <h3 className={styles.modalTitle}>Cancel this order?</h3>
          <p className={styles.modalSub}>
            {cancelling.user.fullName} · {money(cancelling.amountMinor, cancelling.currency)}
            {cancelling.paymentStatus === 'PAID' && ' · will be refunded'}
          </p>
          <label className={styles.modalLabel} htmlFor="orderCancelReason">
            Message for the customer <span className={styles.optional}>(optional)</span>
          </label>
          <textarea
            id="orderCancelReason"
            className={styles.textarea}
            placeholder="e.g. Sorry, that item just went out of stock."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
          />
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setCancelling(null)} disabled={busy}>
              Keep order
            </Button>
            <Button onClick={confirmCancel} loading={updating} loadingText="Cancelling…">
              Cancel order
            </Button>
          </div>
        </div>
      </div>
    )}

    </>
  );
}
