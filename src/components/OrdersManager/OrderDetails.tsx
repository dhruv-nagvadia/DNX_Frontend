import { Check, CircleAlert, CreditCard, IndianRupee, MessageSquareText, Package, Phone, Store, X } from 'lucide-react';

import { Pill } from '@/components/Pill';
import { OrderStatus, ProviderOrder } from '@/redux/api/provider/types';
import { formatAmount, priceLabel } from '@/utils/units';

import { ItemThumb } from './ItemThumb';
import {
  NEXT,
  STATUS,
  canCancel,
  formatPlaced,
  isCancelled,
  lineTotal,
  methodInfo,
  money,
  needsCollect,
  outstandingOf,
  shortId,
} from './orderUtils';
import styles from './OrdersManager.module.css';

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'New' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'READY', label: 'Ready' },
  { status: 'COMPLETED', label: 'Completed' },
];

interface Props {
  order: ProviderOrder;
  showBusiness: boolean;
  busy: boolean;
  onAdvance: (o: ProviderOrder, to: OrderStatus) => void;
  onCollect: (o: ProviderOrder) => void;
  onCancel: (o: ProviderOrder) => void;
}

/** Right-hand "Order Details" panel for the selected order. */
export function OrderDetails({ order: o, showBusiness, busy, onAdvance, onCollect, onCancel }: Props) {
  const st = STATUS[o.status];
  const cancelled = isCancelled(o);
  const current = STEPS.findIndex((s) => s.status === o.status);
  const itemsTotal = o.items.reduce((sum, it) => sum + lineTotal(it), 0);
  const outstanding = outstandingOf(o);
  const collectable = needsCollect(o);
  const advance = NEXT[o.status];
  const cancellable = canCancel(o);
  const refunded =
    (o.refundedMinor ?? 0) > 0 ? (o.refundedMinor ?? 0) : o.paymentStatus === 'REFUNDED' ? o.amountPaidMinor : 0;
  const method = methodInfo(o);
  const initial = o.user.fullName.trim().charAt(0).toUpperCase() || '?';

  return (
    <section className={styles.details} aria-label={`Order ${shortId(o)} details`}>
      <h2 className={styles.detailsTitle}>
        <Package size={20} aria-hidden="true" />
        Order Details
      </h2>

      <div className={styles.detailsHead}>
        <div className={styles.detailsHeadText}>
          <span className={styles.detailsId}>{shortId(o)}</span>
          <span className={styles.muted}>
            {formatPlaced(o.createdAt)} <span aria-hidden="true">•</span> Pickup
          </span>
          {showBusiness && (
            <span className={styles.bizTag}>
              <Store size={12} aria-hidden="true" />
              {o.provider.businessName}
            </span>
          )}
        </div>
        <Pill tone={st.tone}>{st.label}</Pill>
      </div>

      {cancelled ? (
        <div className={styles.cancelNote} role="note">
          <CircleAlert size={16} aria-hidden="true" />
          <div>
            <strong>{o.status === 'NO_SHOW' ? 'No-show' : 'Cancelled'}</strong>
            {o.cancelReason ? <span> — {o.cancelReason}</span> : null}
          </div>
        </div>
      ) : (
        <ol className={styles.stepper} aria-label="Order progress">
          {STEPS.map((s, i) => {
            const state = i < current ? 'done' : i === current ? 'current' : 'todo';
            return (
              <li
                key={s.status}
                className={`${styles.step} ${styles[`step_${state}`]}`}
                aria-current={state === 'current' ? 'step' : undefined}
              >
                <span className={styles.stepDot} aria-hidden="true">
                  {state === 'done' && <Check size={10} strokeWidth={3} />}
                </span>
                <span className={styles.stepLabel}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className={styles.customerCard}>
        <span className={styles.avatar} aria-hidden="true">
          {initial}
        </span>
        <div className={styles.customerText}>
          <span className={styles.strong}>{o.user.fullName}</span>
          {o.user.phone && <span className={styles.muted}>{o.user.phone}</span>}
        </div>
        {o.user.phone && (
          <a
            className={styles.callBtn}
            href={`tel:${o.user.phone}`}
            aria-label={`Call ${o.user.fullName}`}
            title="Call customer"
          >
            <Phone size={18} aria-hidden="true" />
          </a>
        )}
      </div>

      <div>
        <h3 className={styles.itemsHeading}>Items ({o.items.length})</h3>
        <ul className={styles.itemList}>
          {o.items.map((it) => (
            <li key={it.id} className={styles.item}>
              <ItemThumb src={it.product?.imageUrl} size={40} />
              <div className={styles.itemText}>
                <span className={styles.itemName}>{it.name}</span>
                <span className={styles.mutedSm}>
                  {it.measure === 'count' ? it.quantity : formatAmount(it.quantity, it.measure)} ×{' '}
                  {priceLabel(it.priceMinor, it.priceQty, it.measure, o.currency)}
                </span>
              </div>
              <span className={styles.itemTotal}>{money(lineTotal(it), o.currency)}</span>
            </li>
          ))}
        </ul>
      </div>

      <dl className={styles.totals}>
        <div>
          <dt>Item total</dt>
          <dd>{money(itemsTotal, o.currency)}</dd>
        </div>
        {o.amountMinor !== itemsTotal && (
          <>
            {o.amountMinor < itemsTotal && (
              <div>
                <dt>Discount</dt>
                <dd>−{money(itemsTotal - o.amountMinor, o.currency)}</dd>
              </div>
            )}
            <div>
              <dt>Order total</dt>
              <dd>{money(o.amountMinor, o.currency)}</dd>
            </div>
          </>
        )}
        <div>
          <dt>{o.paymentMethod === 'CASH' ? 'Paid' : 'Paid online'}</dt>
          <dd>{money(o.amountPaidMinor, o.currency)}</dd>
        </div>
        {refunded > 0 && (
          <div>
            <dt>Refunded</dt>
            <dd>{money(refunded, o.currency)}</dd>
          </div>
        )}
        {collectable && outstanding > 0 && (
          <div className={styles.dueRow}>
            <dt>Due at pickup</dt>
            <dd>{money(outstanding, o.currency)}</dd>
          </div>
        )}
      </dl>

      {o.note?.trim() && (
        <div className={styles.infoBox}>
          <MessageSquareText size={18} aria-hidden="true" className={styles.infoIcon} />
          <div className={styles.infoText}>
            <span className={styles.infoLabel}>Customer note</span>
            <span className={styles.infoValue}>{o.note}</span>
          </div>
        </div>
      )}

      <div className={styles.infoBox}>
        <CreditCard size={18} aria-hidden="true" className={styles.infoIcon} />
        <div className={styles.infoText}>
          <span className={styles.infoLabel}>Payment</span>
          <span className={styles.infoValue}>{method.text}</span>
        </div>
        <span className={styles.methodChip}>{method.chip}</span>
      </div>

      {(advance || collectable || cancellable) && (
        <div className={styles.actions}>
          {advance && (
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={busy}
              onClick={() => onAdvance(o, advance.to)}
            >
              {o.status === 'PENDING' && <Check size={18} aria-hidden="true" />}
              {advance.label}
            </button>
          )}
          {(collectable || cancellable) && (
            <div className={styles.actionRow}>
              {collectable && (
                <button
                  type="button"
                  className={`${styles.outlineBtn} ${styles.collectBtn}`}
                  disabled={busy}
                  onClick={() => onCollect(o)}
                >
                  <IndianRupee size={16} aria-hidden="true" />
                  Collect {money(outstanding, o.currency)}
                </button>
              )}
              {cancellable && (
                <button
                  type="button"
                  className={`${styles.outlineBtn} ${styles.cancelBtn}`}
                  disabled={busy}
                  onClick={() => onCancel(o)}
                >
                  <X size={16} aria-hidden="true" />
                  Cancel Order
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
