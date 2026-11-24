import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  Coins,
  CreditCard,
  HandCoins,
  Info,
  Landmark,
  ListFilter,
  PiggyBank,
  ReceiptText,
  Search,
  Wallet,
  X,
} from 'lucide-react';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { MoneyTile, Segmented } from '@/components/FinanceOverview/financeUi';
import { ModernCard } from '@/components/ModernCard';
import { Pill, PillTone } from '@/components/Pill';
import { Select } from '@/components/Select';
import { Skeleton } from '@/components/Skeleton';
import {
  FinanceAgg,
  FinanceBreakdownRow,
  FinanceTransaction,
  PaymentMethod,
} from '@/redux/api/admin/types';
import { RANGE_PRESETS, RangePreset } from '@/utils/dateRange';
import { bpsToPercentText, formatMoney } from '@/utils/money';
import { TransactionTab, useAdminTransactions } from './useAdminTransactions';
import styles from '@/components/FinanceTable/FinanceTable.module.css';
import local from './AdminTransactions.module.css';

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const METHOD_LABEL: Record<PaymentMethod, string> = {
  ONLINE: 'Online',
  CASH: 'COD / Cash',
  PARTIAL: 'Partial',
};
const METHOD_TONE: Record<PaymentMethod, PillTone> = {
  ONLINE: 'green',
  CASH: 'grey',
  PARTIAL: 'blue',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
};
const STATUS_TONE: Record<string, PillTone> = {
  PENDING: 'yellow',
  CONFIRMED: 'blue',
  READY: 'lavender',
  COMPLETED: 'green',
  CANCELLED: 'red',
  NO_SHOW: 'orange',
};

/** Signed amount: "+₹1,200" / "−₹80". */
function signed(minor: number): string {
  return `${minor > 0 ? '+' : minor < 0 ? '−' : ''}${formatMoney(Math.abs(minor))}`;
}

/** How a sale was paid: the method, and the online / in-person split. */
function PaymentCell({ t }: { t: FinanceTransaction }) {
  const open = t.state === 'UPCOMING';
  const parts: string[] = [];
  if (t.onlineMinor > 0) parts.push(`${formatMoney(t.onlineMinor)} online`);
  if (t.cashMinor > 0) parts.push(`${formatMoney(t.cashMinor)} ${open ? 'due in person' : 'cash'}`);
  return (
    <div className={local.split}>
      <Pill tone={METHOD_TONE[t.paymentMethod]}>
        {t.paymentMethod === 'CASH' ? (
          <Banknote size={13} aria-hidden="true" />
        ) : (
          <CreditCard size={13} aria-hidden="true" />
        )}
        {METHOD_LABEL[t.paymentMethod]}
      </Pill>
      {t.state === 'NONE' ? (
        <span className={styles.muted}>
          {t.refundedMinor > 0 ? `Refunded ${formatMoney(t.refundedMinor)}` : 'Nothing paid'}
        </span>
      ) : (
        <span className={styles.muted}>{parts.join(' + ') || '—'}</span>
      )}
      {t.sharedPayment && (
        <span
          className={styles.muted}
          title="The customer paid once for a cart with items from several stores; each store's order holds only its own share."
        >
          One {formatMoney(t.sharedPayment.totalMinor)} payment for {t.sharedPayment.orders} stores
        </span>
      )}
    </div>
  );
}

/** What this one sale adds to — or, for cash sales, takes off — what DNX pays the provider. */
function PayableCell({ t }: { t: FinanceTransaction }) {
  if (t.state === 'NONE') return <span className={styles.muted}>—</span>;
  const open = t.state === 'UPCOMING';
  const tone =
    t.payableMinor < 0 ? styles.negative : t.payableMinor > 0 ? styles.positive : styles.muted;
  const text = t.payableMinor === 0 ? '—' : signed(t.payableMinor);
  return (
    <div className={`${styles.cellMain} ${styles.cellEnd}`}>
      <span className={open ? styles.muted : tone}>{text}</span>
      {t.payableMinor < 0 && (
        <span className={styles.muted}>{open ? 'taken off if completed' : 'taken off dues'}</span>
      )}
      {t.payableMinor > 0 && open && <span className={styles.muted}>if completed</span>}
    </div>
  );
}

function BreakdownTable({
  rows,
  by,
  onOpen,
}: {
  rows: FinanceBreakdownRow[];
  by: 'business' | 'service';
  onOpen: (r: FinanceBreakdownRow) => void;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<ReceiptText size={28} strokeWidth={1.6} aria-hidden="true" />}
        title="Nothing here yet"
        description="No bookings or orders match these filters."
      />
    );
  }
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{by === 'service' ? 'Service' : 'Business'}</th>
            <th scope="col" className={styles.num}>
              Completed
            </th>
            <th scope="col" className={styles.num}>
              Sales
            </th>
            <th scope="col" className={styles.num}>
              Paid online
            </th>
            <th scope="col" className={styles.num}>
              Cash / COD
            </th>
            <th scope="col" className={styles.num}>
              Commission
            </th>
            <th scope="col" className={styles.num}>
              You owe provider
            </th>
            <th scope="col" className={styles.num}>
              Open
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className={styles.rowLink}
              onClick={() => onOpen(r)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpen(r);
                }
              }}
              tabIndex={0}
              aria-label={`Show transactions for ${r.name}`}
              title="Show these transactions"
            >
              <td>
                <div className={styles.cellMain}>
                  <span className={styles.cellTitle}>{r.name}</span>
                  {by === 'service' && <span className={styles.muted}>{r.businessName}</span>}
                  <span className={styles.muted}>
                    {r.methods.ONLINE} online · {r.methods.CASH} COD · {r.methods.PARTIAL} partial
                  </span>
                </div>
              </td>
              <td className={styles.num}>{r.completedCount}</td>
              <td className={`${styles.num} ${styles.strongNum}`}>{formatMoney(r.grossMinor)}</td>
              <td className={styles.num}>{formatMoney(r.onlineMinor)}</td>
              <td className={styles.num}>{formatMoney(r.cashMinor)}</td>
              <td className={styles.num}>{formatMoney(r.commissionMinor)}</td>
              <td
                className={`${styles.num} ${r.payableMinor < 0 ? styles.negative : styles.positive}`}
              >
                {r.payableMinor < 0 ? '−' : ''}
                {formatMoney(Math.abs(r.payableMinor))}
              </td>
              <td className={styles.num}>
                {r.upcomingCount > 0 ? `${r.upcomingCount} · ${formatMoney(r.upcomingMinor)}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryTiles({ s }: { s: FinanceAgg }) {
  return (
    <div className={styles.tiles3}>
      <MoneyTile
        tone="blue"
        label="Completed sales"
        value={formatMoney(s.grossMinor)}
        icon={<Banknote size={20} />}
        note={`${s.completedCount} completed · ${s.upcomingCount} open (${formatMoney(s.upcomingMinor)})`}
      />
      <MoneyTile
        tone="mint"
        label="Paid online"
        value={formatMoney(s.onlineMinor)}
        icon={<Wallet size={20} />}
        note="Collected by DNX"
      />
      <MoneyTile
        tone="peach"
        label="Cash / COD"
        value={formatMoney(s.cashMinor)}
        icon={<HandCoins size={20} />}
        note="Collected by the provider"
      />
      <MoneyTile
        tone="lavender"
        label="Your commission"
        value={formatMoney(s.commissionMinor)}
        icon={<Coins size={20} />}
        note={`Gateway fees ${formatMoney(s.gatewayFeeMinor)} (${formatMoney(s.providerFeeMinor)} passed on to providers)`}
      />
      <MoneyTile
        tone="mint"
        label="Providers keep"
        value={formatMoney(s.earningMinor)}
        icon={<PiggyBank size={20} />}
        note="After commission"
      />
      <MoneyTile
        tone={s.payableMinor < 0 ? 'pink' : 'blue'}
        label="You owe providers"
        value={`${s.payableMinor < 0 ? '−' : ''}${formatMoney(Math.abs(s.payableMinor))}`}
        icon={<Landmark size={20} />}
        note="Online money − commission"
      />
    </div>
  );
}

/** The admin's money ledger: every booking/order, how it was paid, and what each side gets. */
export function AdminTransactions() {
  const t = useAdminTransactions();

  const viewTabs: { id: TransactionTab; label: string; count?: number }[] = [
    { id: 'all', label: 'All transactions', count: t.data?.total },
    { id: 'business', label: 'By business' },
    { id: 'service', label: 'By service' },
  ];
  const pages = t.data ? Math.max(1, Math.ceil(t.data.total / t.pageSize)) : 1;
  const selectedBusiness = t.businessOptions.find((b) => b.id === t.businessId);
  const selectedService = t.serviceOptions.find((x) => x.id === t.serviceId);

  return (
    <div className={styles.section}>
      <div className={styles.controls}>
        <Segmented<RangePreset>
          label="Date range"
          options={RANGE_PRESETS}
          value={t.preset}
          onChange={t.onPreset}
        />
      </div>

      <p className={styles.infoBox}>
        <Info size={16} aria-hidden="true" />
        <span>
          <strong>How it adds up:</strong> DNX collects the online part of each payment, so it owes
          the provider that money <strong>minus its commission</strong>. For cash / COD the
          provider keeps the cash, so the commission on it is <strong>taken off</strong> what you
          owe them. A partial payment does both: the commission comes out of the online deposit
          first. Dates are when the booking or order was placed.
        </span>
      </p>

      <ModernCard icon={<ListFilter size={20} aria-hidden="true" />} title="Filters">
        <div className={local.filterBar}>
          <label className={`${styles.search} ${styles.searchWide}`} style={{ width: '100%' }}>
            <Search size={16} aria-hidden="true" />
            <input
              key={t.search}
              type="search"
              aria-label="Search transactions"
              placeholder="Search customer, business, service…  (press Enter)"
              defaultValue={t.search}
              onKeyDown={(e) => {
                if (e.key === 'Enter') t.onSearch(e.currentTarget.value.trim());
              }}
              onBlur={(e) => {
                if (e.currentTarget.value.trim() !== t.search)
                  t.onSearch(e.currentTarget.value.trim());
              }}
            />
          </label>

          <div className={local.filters}>
            <Select
              className={local.filterSelect}
              aria-label="Business"
              value={t.businessId}
              onChange={(e) => t.onBusiness(e.target.value)}
            >
              <option value="">All businesses</option>
              {t.businessOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
            <Select
              className={local.filterSelect}
              aria-label="Service"
              value={t.serviceId}
              onChange={(e) => t.onService(e.target.value)}
            >
              <option value="">All services</option>
              {t.serviceOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {/* With no business chosen, say which business each service belongs to. */}
                  {t.businessId ? s.name : `${s.name} — ${s.businessName}`}
                  {s.isActive ? '' : ' (inactive)'}
                </option>
              ))}
            </Select>
            <Select
              className={local.filterSelect}
              aria-label="Payment type"
              value={t.method}
              onChange={(e) => t.onMethod(e.target.value)}
            >
              <option value="">All payment types</option>
              <option value="ONLINE">Online</option>
              <option value="CASH">COD / Cash</option>
              <option value="PARTIAL">Partial</option>
            </Select>
            <Select
              className={local.filterSelect}
              aria-label="Type"
              value={t.kind}
              onChange={(e) => t.onKind(e.target.value)}
            >
              <option value="">Bookings &amp; orders</option>
              <option value="BOOKING">Bookings</option>
              <option value="ORDER">Orders</option>
            </Select>
            <Select
              className={local.filterSelect}
              aria-label="Status"
              value={t.status}
              onChange={(e) => t.onStatus(e.target.value)}
            >
              <option value="">Any status</option>
              <option value="OPEN">Open (not finished)</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No-show</option>
            </Select>
          </div>

          {(t.ownerId || t.hasFilters || selectedService || selectedBusiness) && (
            <div className={local.activeRow}>
              {t.ownerId && (
                <span className={styles.filterChip}>
                  Provider: {t.ownerName ?? 'selected'}
                  <button
                    type="button"
                    className={styles.chipClose}
                    aria-label="Remove provider filter"
                    onClick={t.clearOwner}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </span>
              )}
              {(selectedService || selectedBusiness) && (
                <span className={styles.muted}>
                  {selectedService
                    ? `Showing ${selectedService.name} at ${selectedService.businessName} (bookings only).`
                    : `Showing ${selectedBusiness?.name}. Owner: ${selectedBusiness?.ownerName}.`}
                </span>
              )}
              {t.hasFilters && (
                <Button variant="ghost" onClick={t.clearAll}>
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </ModernCard>

      {t.isLoading || !t.data ? (
        <div className={styles.tiles3}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={96} radius="var(--m-radius-card)" />
          ))}
        </div>
      ) : (
        <SummaryTiles s={t.data.summary} />
      )}

      <div className={local.viewBar}>
        <div className={styles.chipRow} role="group" aria-label="View">
          {viewTabs.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={t.tab === v.id}
              className={`${styles.chip} ${t.tab === v.id ? styles.chipActive : ''}`}
              onClick={() => t.onTab(v.id)}
            >
              {v.label}
              {v.count !== undefined && <span className={styles.chipCount}>{v.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {t.tab === 'all' ? (
        <ModernCard
          icon={<ReceiptText size={20} aria-hidden="true" />}
          title="Transactions"
          suffix={t.data ? `(${t.data.total})` : undefined}
        >
          {t.isLoading || !t.data ? (
            <Skeleton height={200} radius="var(--m-radius-box)" />
          ) : t.data.rows.length === 0 ? (
            <EmptyState
              icon={<ReceiptText size={28} strokeWidth={1.6} aria-hidden="true" />}
              title="No transactions found"
              description="Try a wider date range or clear some filters."
              action={
                t.hasFilters ? (
                  <Button variant="secondary" onClick={t.clearAll}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">Placed</th>
                      <th scope="col">Sale</th>
                      <th scope="col">Payment</th>
                      <th scope="col" className={styles.num}>
                        Total
                      </th>
                      <th scope="col" className={styles.num}>
                        Commission
                      </th>
                      <th scope="col" className={styles.num}>
                        Provider keeps
                      </th>
                      <th scope="col" className={styles.num}>
                        You pay provider
                      </th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.data.rows.map((r) => (
                      <tr key={`${r.kind}-${r.id}`}>
                        <td className={styles.nowrap}>{dateFmt.format(new Date(r.placedAt))}</td>
                        <td>
                          <div className={`${styles.cellMain} ${local.saleCell}`}>
                            <span className={styles.cellTitle} title={r.title}>
                              {r.title}
                            </span>
                            <span
                              className={styles.muted}
                              title={`${r.businessName} · ${r.customerName}`}
                            >
                              {r.kind === 'BOOKING' ? 'Booking' : 'Order'} · {r.businessName} ·{' '}
                              {r.customerName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <PaymentCell t={r} />
                        </td>
                        <td className={`${styles.num} ${styles.strongNum}`}>
                          {formatMoney(r.totalMinor)}
                        </td>
                        <td className={styles.num}>
                          {r.state === 'NONE' ? (
                            <span className={styles.muted}>—</span>
                          ) : (
                            <div className={`${styles.cellMain} ${styles.cellEnd}`}>
                              <span>{formatMoney(r.commissionMinor)}</span>
                              <span className={styles.muted}>
                                {bpsToPercentText(r.commissionBps)}%
                              </span>
                            </div>
                          )}
                        </td>
                        <td className={styles.num}>
                          {r.state === 'NONE' ? (
                            <span className={styles.muted}>—</span>
                          ) : (
                            formatMoney(r.earningMinor)
                          )}
                        </td>
                        <td className={styles.num}>
                          <PayableCell t={r} />
                        </td>
                        <td>
                          <Pill tone={STATUS_TONE[r.status] ?? 'grey'}>
                            {STATUS_LABEL[r.status] ?? r.status}
                          </Pill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.pager}>
                <span>
                  Showing {(t.page - 1) * t.pageSize + 1}–
                  {Math.min(t.page * t.pageSize, t.data.total)} of {t.data.total}
                </span>
                <span className={styles.pageBtns}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={t.page <= 1}
                    onClick={() => t.onPage(t.page - 1)}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                  </button>
                  <span>
                    Page {t.page} of {pages}
                  </span>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={t.page >= pages}
                    onClick={() => t.onPage(t.page + 1)}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </span>
              </div>
            </>
          )}
        </ModernCard>
      ) : (
        <ModernCard
          icon={<ReceiptText size={20} aria-hidden="true" />}
          title={t.tab === 'service' ? 'By service' : 'By business'}
        >
          <p className={styles.cardIntro}>
            {t.tab === 'service'
              ? 'Bookings grouped by service. Click a row to see its transactions. (Store orders have no single service — see them under By business.)'
              : 'Click a business to see its transactions.'}
          </p>
          {t.breakdownLoading ? (
            <Skeleton height={160} radius="var(--m-radius-box)" />
          ) : (
            <BreakdownTable
              rows={t.breakdown}
              by={t.tab === 'service' ? 'service' : 'business'}
              onOpen={(r) =>
                t.tab === 'service' ? t.openService(r.id, r.businessId) : t.openBusiness(r.id)
              }
            />
          )}
        </ModernCard>
      )}
    </div>
  );
}
