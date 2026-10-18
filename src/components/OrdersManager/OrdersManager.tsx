import { useState } from 'react';
import { LifeBuoy, Phone, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { AlertBanner } from '@/components/AlertBanner';
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
import { formatAmount } from '@/utils/units';

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
  const { data: allOrders = [], isLoading } = useGetMyOrdersQuery();
  const [updateStatus, { isLoading: updating }] = useUpdateOrderStatusMutation();
  const [collect, { isLoading: collecting }] = useCollectOrderPaymentMutation();

  const orders = allOrders.filter((o) => o.provider.id === providerId);
  const busy = updating || collecting;

  // Cancel-with-reason modal.
  const [cancelling, setCancelling] = useState<ProviderOrder | null>(null);
  const [reason, setReason] = useState('');

  // No-show-with-note modal.
  const [noShowing, setNoShowing] = useState<ProviderOrder | null>(null);
  const [noShowNote, setNoShowNote] = useState('');
  const [noShowError, setNoShowError] = useState<string | null>(null);

  const setStatus = (o: ProviderOrder, status: OrderStatus) => {
    updateStatus({ orderId: o.id, providerId, status });
  };

  const openNoShow = (o: ProviderOrder) => {
    setNoShowNote('');
    setNoShowError(null);
    setNoShowing(o);
  };

  const confirmNoShow = async () => {
    if (!noShowing) return;
    setNoShowError(null);
    try {
      await updateStatus({
        orderId: noShowing.id,
        providerId,
        status: 'NO_SHOW',
        reason: noShowNote.trim() || undefined,
      }).unwrap();
      setNoShowing(null);
      setNoShowNote('');
    } catch (err) {
      setNoShowError(
        (err as { data?: { message?: string } })?.data?.message ?? 'Could not mark this order a no-show.',
      );
    }
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

  const active = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length;

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
        {o.status === 'READY' && (
          <button
            type="button"
            className={`${styles.btn} ${styles.cancel}`}
            disabled={busy}
            onClick={() => openNoShow(o)}
          >
            No-show
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
      subtitle={`${orders.length} total · ${active} to fulfil`}
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
      <div className={styles.list}>
        {orders.map((o) => {
          const st = STATUS[o.status];
          const pay = payBadge(o);
          return (
            <div className={styles.order} key={o.id}>
              <div className={styles.top}>
                <div className={styles.cust}>
                  <span className={styles.name}>{o.user.fullName}</span>
                  {o.user.phone ? (
                    <a className={styles.phone} href={`tel:${o.user.phone}`}>
                      <Phone size={13} aria-hidden="true" />
                      {o.user.phone}
                    </a>
                  ) : null}
                  <span className={styles.when}>{dateFmt.format(new Date(o.createdAt))}</span>
                </div>
                <div className={styles.badges}>
                  <Badge tone={st.tone}>{st.label}</Badge>
                  <Badge tone={pay.tone}>{pay.label}</Badge>
                </div>
              </div>

              <div className={styles.items}>
                {o.items.map((it) => (
                  <div className={styles.item} key={it.id}>
                    <span className={styles.itemName}>
                      {it.name} · {formatAmount(it.quantity, it.measure)}
                    </span>
                    <span className={styles.itemPrice}>{money(lineTotal(it), o.currency)}</span>
                  </div>
                ))}
              </div>

              <div className={styles.footer}>
                <span className={styles.total}>Total {money(o.amountMinor, o.currency)}</span>
                <div className={styles.actions}>{renderActions(o)}</div>
              </div>

              {(o.status === 'CANCELLED' || o.status === 'NO_SHOW') && o.cancelReason ? (
                <p className={styles.cancelNote}>
                  {o.status === 'NO_SHOW' ? 'No-show note' : 'Cancellation note'}: {o.cancelReason}
                </p>
              ) : null}
            </div>
          );
        })}
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

    {noShowing && (
      <div className={styles.overlay} role="dialog" aria-modal="true">
        <div className={styles.modal}>
          <h3 className={styles.modalTitle}>Mark this order a no-show?</h3>
          <p className={styles.modalSub}>
            {noShowing.user.fullName} · {money(noShowing.amountMinor, noShowing.currency)}
          </p>
          <p className={styles.modalSub}>
            {noShowing.amountPaidMinor > 0
              ? "Already paid — it won't be refunded, and the product goes back into stock."
              : 'No payment was taken — the customer gets a warning instead.'}
          </p>
          <label className={styles.modalLabel} htmlFor="orderNoShowNote">
            Note for the customer <span className={styles.optional}>(optional)</span>
          </label>
          <textarea
            id="orderNoShowNote"
            className={styles.textarea}
            placeholder="e.g. Held for 2 days past pickup, never collected."
            value={noShowNote}
            onChange={(e) => setNoShowNote(e.target.value)}
            maxLength={500}
          />
          {noShowError && <AlertBanner tone="error">{noShowError}</AlertBanner>}
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setNoShowing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={confirmNoShow} loading={updating} loadingText="Saving…">
              Mark no-show
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
