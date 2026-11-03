import { KeyboardEvent, ReactNode, useMemo, useState } from 'react';
import { Bell, ChevronDown, ChevronLeft, ChevronRight, Package, Search, ShoppingBag, Store, Wallet } from 'lucide-react';

import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { Skeleton } from '@/components/Skeleton';
import {
  useGetMyOrdersQuery,
  useUpdateOrderStatusMutation,
  useCollectOrderPaymentMutation,
} from '@/redux/api/provider/providerApi';
import { OrderStatus, ProviderOrder } from '@/redux/api/provider/types';

import { ItemThumb } from './ItemThumb';
import { OrderDetails } from './OrderDetails';
import {
  PaymentFilter,
  STATUS,
  StatusTab,
  TABS,
  formatWhen,
  isCancelled,
  matchesTab,
  money,
  outstandingOf,
  payBadge,
  shortId,
} from './orderUtils';
import styles from './OrdersManager.module.css';

const PAGE_SIZE = 5;

type TileTone = 'lavender' | 'blue' | 'mint' | 'peach';

function SummaryTile({ tone, icon, label, value }: { tone: TileTone; icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className={`${styles.tile} ${styles[`tile_${tone}`]}`}>
      <span className={styles.tileIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={styles.tileText}>
        <span className={styles.tileLabel}>{label}</span>
        <span className={styles.tileValue}>{value}</span>
      </div>
    </div>
  );
}

/** Page numbers with ellipses once there are more than 7 pages. */
function pageList(page: number, count: number): (number | 'gap')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const out: (number | 'gap')[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(count - 1, page + 1);
  if (from > 2) out.push('gap');
  for (let p = from; p <= to; p++) out.push(p);
  if (to < count - 1) out.push('gap');
  out.push(count);
  return out;
}

/** Store order management: view incoming orders and move them through fulfilment.
 * Omit `providerId` to show every order across every business (the global
 * Bookings & Orders page) — business names are shown on rows and in details. */
export function OrdersManager({ providerId }: { providerId?: string }) {
  const showBusiness = !providerId;
  // Refetch whenever this tab is opened, the browser tab regains focus, or
  // every 30s while it's open — new orders come from the customer app, a
  // separate client, so nothing in this app's own cache would otherwise know
  // to invalidate a stale result.
  const { data: allOrders, isLoading } = useGetMyOrdersQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    pollingInterval: 30_000,
  });
  const [updateStatus, { isLoading: updating }] = useUpdateOrderStatusMutation();
  const [collect, { isLoading: collecting }] = useCollectOrderPaymentMutation();
  const busy = updating || collecting;

  const orders = useMemo(() => {
    const list = allOrders ?? [];
    return providerId ? list.filter((o) => o.provider.id === providerId) : list;
  }, [allOrders, providerId]);

  // ── Filters / paging / selection ────────────────────────────────────
  const [tab, setTab] = useState<StatusTab>('ALL');
  const [payFilter, setPayFilter] = useState<PaymentFilter>('ALL');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Cancel-with-reason modal.
  const [cancelling, setCancelling] = useState<ProviderOrder | null>(null);
  const [reason, setReason] = useState('');

  const stats = useMemo(() => {
    const tabCounts = Object.fromEntries(
      TABS.map((t) => [t.key, orders.filter((o) => matchesTab(o, t.key)).length]),
    ) as Record<StatusTab, number>;
    const cashToCollect = orders
      .filter(
        (o) =>
          !isCancelled(o) &&
          o.paymentStatus !== 'PAID' &&
          o.paymentStatus !== 'REFUNDED' &&
          (o.paymentMethod === 'CASH' || o.paymentMethod === 'PARTIAL'),
      )
      .reduce((sum, o) => sum + outstandingOf(o), 0);
    return { tabCounts, cashToCollect };
  }, [orders]);
  const currency = orders[0]?.currency ?? 'INR';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    return orders.filter((o) => {
      if (!matchesTab(o, tab)) return false;
      if (payFilter !== 'ALL' && o.paymentMethod !== payFilter) return false;
      if (!q) return true;
      return (
        shortId(o).toLowerCase().includes(q.replace(/^#/, '')) ||
        o.id.toLowerCase().includes(q) ||
        o.user.fullName.toLowerCase().includes(q) ||
        (qDigits.length > 0 && (o.user.phone ?? '').replace(/\D/g, '').includes(qDigits)) ||
        (showBusiness && o.provider.businessName.toLowerCase().includes(q))
      );
    });
  }, [orders, tab, payFilter, query, showBusiness]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);
  // Keep the clicked order selected; otherwise fall back to the page's first row.
  const selected = pageRows.find((o) => o.id === selectedId) ?? pageRows[0] ?? null;

  const changeTab = (t: StatusTab) => {
    setTab(t);
    setPage(1);
  };
  const changePay = (p: PaymentFilter) => {
    setPayFilter(p);
    setPage(1);
  };
  const changeQuery = (q: string) => {
    setQuery(q);
    setPage(1);
  };

  // ── Actions ─────────────────────────────────────────────────────────
  const setStatus = (o: ProviderOrder, status: OrderStatus) => {
    updateStatus({ orderId: o.id, providerId: o.provider.id, status });
  };
  const collectPayment = (o: ProviderOrder) => {
    // Same safeguard as the mobile app — recording cash is easy to tap by mistake.
    const due = money(outstandingOf(o), o.currency);
    if (!window.confirm(`Mark ${shortId(o)} as paid? This records ${due} collected from ${o.user.fullName}.`)) {
      return;
    }
    collect({ orderId: o.id, providerId: o.provider.id });
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
        providerId: cancelling.provider.id,
        status: 'CANCELLED',
        reason: reason.trim() || undefined,
      }).unwrap();
      setCancelling(null);
      setReason('');
    } catch {
      // surfaced via mutation state
    }
  };

  const onRowKey = (e: KeyboardEvent<HTMLTableRowElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedId(id);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.tiles}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={84} radius="var(--m-radius-box)" />
          ))}
        </div>
        <Skeleton height={360} radius="var(--m-radius-card)" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={styles.emptyCard}>
        <span className={styles.emptyIcon} aria-hidden="true">
          <ShoppingBag size={28} />
        </span>
        <h3 className={styles.emptyTitle}>No orders yet</h3>
        <p className={styles.emptyText}>
          When customers order your products from the app, their pickup orders show up here.
        </p>
      </div>
    );
  }

  const { tabCounts, cashToCollect } = stats;

  return (
    <div className={styles.root}>
      <div className={styles.tiles}>
        <SummaryTile tone="lavender" icon={<Bell size={26} />} label="New Orders" value={tabCounts.PENDING} />
        <SummaryTile tone="blue" icon={<Package size={26} />} label="Preparing" value={tabCounts.CONFIRMED} />
        <SummaryTile tone="mint" icon={<ShoppingBag size={26} />} label="Ready for Pickup" value={tabCounts.READY} />
        <SummaryTile tone="peach" icon={<Wallet size={26} />} label="Cash to Collect" value={money(cashToCollect, currency)} />
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="Filter by status">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${styles.tab} ${active ? styles.tabActive : ''}`}
                onClick={() => changeTab(t.key)}
              >
                {t.label}
                <span className={styles.tabCount}>{tabCounts[t.key]}</span>
              </button>
            );
          })}
        </div>
        <div className={styles.toolbarRight}>
          <label className={styles.search}>
            <Search size={18} aria-hidden="true" />
            <span className={styles.srOnly}>Search orders</span>
            <input
              type="search"
              placeholder="Search by order ID or customer..."
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
            />
          </label>
          <label className={styles.filterWrap}>
            <span className={styles.srOnly}>Filter by payment method</span>
            <select
              className={styles.filter}
              value={payFilter}
              onChange={(e) => changePay(e.target.value as PaymentFilter)}
            >
              <option value="ALL">Payment</option>
              <option value="ONLINE">Online</option>
              <option value="CASH">Cash</option>
              <option value="PARTIAL">Partial</option>
            </select>
            <ChevronDown size={16} className={styles.filterChevron} aria-hidden="true" />
          </label>
        </div>
      </div>

      <div className={styles.columns}>
        <section className={styles.tableCard} aria-label="Orders">
          {filtered.length === 0 ? (
            <div className={styles.noMatch}>No orders match.</div>
          ) : (
            <>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th aria-label="Open" />
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((o) => {
                      const st = STATUS[o.status];
                      const pay = payBadge(o);
                      const isSel = selected?.id === o.id;
                      const n = o.items.length;
                      return (
                        <tr
                          key={o.id}
                          tabIndex={0}
                          aria-selected={isSel}
                          aria-label={`Order ${shortId(o)}, ${o.user.fullName}`}
                          className={`${styles.row} ${isSel ? styles.rowSelected : ''}`}
                          onClick={() => setSelectedId(o.id)}
                          onKeyDown={(e) => onRowKey(e, o.id)}
                        >
                          <td>
                            <div className={styles.cellStack}>
                              <span className={styles.strong}>{shortId(o)}</span>
                              <span className={styles.mutedSm}>{formatWhen(o.createdAt)}</span>
                            </div>
                          </td>
                          <td>
                            <div className={styles.cellStack}>
                              <span className={styles.strong}>{o.user.fullName}</span>
                              {o.user.phone && <span className={styles.mutedSm}>{o.user.phone}</span>}
                              {showBusiness && (
                                <span className={styles.bizTag}>
                                  <Store size={12} aria-hidden="true" />
                                  {o.provider.businessName}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className={styles.itemsCell}>
                              <span className={styles.thumbStack}>
                                {o.items.slice(0, 3).map((it) => (
                                  <ItemThumb key={it.id} src={it.product?.imageUrl} size={34} className={styles.stackThumb} />
                                ))}
                              </span>
                              <span className={styles.mutedSm}>
                                {n} {n === 1 ? 'item' : 'items'}
                              </span>
                            </div>
                          </td>
                          <td className={styles.amount}>{money(o.amountMinor, o.currency)}</td>
                          <td>
                            <Pill tone={pay.tone}>{pay.label}</Pill>
                          </td>
                          <td>
                            <Pill tone={st.tone}>{st.label}</Pill>
                          </td>
                          <td className={styles.chevCell}>
                            <ChevronRight size={18} aria-hidden="true" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.pager}>
                <span className={styles.pagerInfo}>
                  Showing {start + 1}–{start + pageRows.length} of {filtered.length}{' '}
                  {filtered.length === 1 ? 'order' : 'orders'}
                </span>
                {pageCount > 1 && (
                  <nav className={styles.pagerNav} aria-label="Pagination">
                    <button
                      type="button"
                      className={styles.pageBtn}
                      onClick={() => setPage(safePage - 1)}
                      disabled={safePage === 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} aria-hidden="true" />
                    </button>
                    {pageList(safePage, pageCount).map((p, i) =>
                      p === 'gap' ? (
                        <span key={`gap${i}`} className={styles.pageGap}>
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          className={`${styles.pageBtn} ${p === safePage ? styles.pageActive : ''}`}
                          onClick={() => setPage(p)}
                          aria-current={p === safePage ? 'page' : undefined}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      className={styles.pageBtn}
                      onClick={() => setPage(safePage + 1)}
                      disabled={safePage === pageCount}
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </div>
            </>
          )}
        </section>

        {selected && (
          <OrderDetails
            order={selected}
            showBusiness={showBusiness}
            busy={busy}
            onAdvance={setStatus}
            onCollect={collectPayment}
            onCancel={openCancel}
          />
        )}
      </div>

      {cancelling && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="orderCancelTitle">
          <div className={styles.modal}>
            <h3 className={styles.modalTitle} id="orderCancelTitle">
              Cancel this order?
            </h3>
            <p className={styles.modalSub}>
              {shortId(cancelling)} · {cancelling.user.fullName} ·{' '}
              {money(cancelling.amountMinor, cancelling.currency)}
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
    </div>
  );
}
