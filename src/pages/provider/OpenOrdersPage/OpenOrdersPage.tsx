import { Package, ShoppingBag, Store, User } from 'lucide-react';

import { Pill, PillTone } from '@/components/Pill';
import { OrderStatus, ProviderOrder } from '@/redux/api/provider/types';

import { LeadChip, ViewAllPage, ViewAllRow } from '../TodaysSchedulePage/ViewAllLayout';
import { money } from '../TodaysSchedulePage/money';
import styles from '../TodaysSchedulePage/ViewAll.module.css';
import { useOpenOrdersPage } from './useOpenOrdersPage';

const ORDER_STATUS: Record<OrderStatus, { tone: PillTone; label: string }> = {
  PENDING: { tone: 'orange', label: 'New' },
  CONFIRMED: { tone: 'blue', label: 'Confirmed' },
  READY: { tone: 'lavender', label: 'Ready' },
  COMPLETED: { tone: 'green', label: 'Completed' },
  CANCELLED: { tone: 'red', label: 'Cancelled' },
  NO_SHOW: { tone: 'grey', label: 'No-show' },
};

function shortOrderId(id: string): string {
  return `#${id.slice(-6).toUpperCase()}`;
}

const orderOutstanding = (o: ProviderOrder) => o.amountMinor - (o.amountPaidMinor ?? 0);

/** The payment pill shown on every order row, even when fully settled. */
function paymentPill(order: ProviderOrder, currency: string): { tone: PillTone; label: string } {
  if (order.paymentMethod === 'ONLINE') {
    return order.paymentStatus === 'PAID' ? { tone: 'green', label: 'Paid' } : { tone: 'teal', label: 'Online' };
  }
  const label = order.paymentMethod === 'CASH' ? 'COD' : 'Partial';
  return { tone: 'yellow', label: `${label}: ${money(orderOutstanding(order), currency)}` };
}

/** Full, unsliced "Orders to Fulfil" — every order still working through fulfilment,
 * across every business. */
export default function OpenOrdersPage() {
  const { isLoading, openOrders, currency, goToBusinessOrders } = useOpenOrdersPage();
  const count = openOrders.length;

  return (
    <ViewAllPage
      title="Orders to Fulfil"
      subtitle={`${count} open order${count === 1 ? '' : 's'}`}
      isLoading={isLoading}
      isEmpty={count === 0}
      empty={{
        icon: <Package size={28} strokeWidth={1.6} />,
        title: 'No open orders',
        description: "You're all caught up.",
      }}
    >
      {openOrders.map((o) => {
        const itemCount = o.items.length;
        const status = ORDER_STATUS[o.status];
        const pay = paymentPill(o, currency);
        return (
          <ViewAllRow
            key={o.id}
            onOpen={() => goToBusinessOrders(o.provider.id)}
            lead={
              <LeadChip tone="blue">
                <ShoppingBag size={18} aria-hidden="true" />
              </LeadChip>
            }
            title={shortOrderId(o.id)}
            lines={
              <>
                <span className={styles.subItem}>
                  <User size={14} aria-hidden="true" />
                  {o.user.fullName}
                </span>
                <span className={styles.subItem}>
                  <Store size={14} aria-hidden="true" />
                  {o.provider.businessName}
                </span>
                <span className={styles.subItem}>
                  <Package size={14} aria-hidden="true" />
                  {itemCount} item{itemCount === 1 ? '' : 's'}
                </span>
              </>
            }
            meta={
              <>
                <Pill tone={status.tone}>{status.label}</Pill>
                <Pill tone={pay.tone}>{pay.label}</Pill>
              </>
            }
          />
        );
      })}
    </ViewAllPage>
  );
}
