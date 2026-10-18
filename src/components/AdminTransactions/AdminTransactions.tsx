import { Banknote, Coins, HandCoins, Landmark, PiggyBank, ReceiptText, Wallet } from 'lucide-react';

import { Badge } from '@/components/Badge';
import { BadgeTone } from '@/components/Badge/types';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { StatTile } from '@/components/StatTile';
import { Tabs } from '@/components/Tabs';
import {
  FinanceAgg,
  FinanceBreakdownRow,
  FinanceTransaction,
  PaymentMethod,
} from '@/redux/api/admin/types';
import { RANGE_PRESETS } from '@/utils/dateRange';
import { bpsToPercentText, formatMoney } from '@/utils/money';
import { TransactionTab, useAdminTransactions } from './useAdminTransactions';
// Generic field/label/form styling shared across provider/admin forms.
import form from '@/components/ServicesManager/ServicesManager.module.css';
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
const METHOD_TONE: Record<PaymentMethod, BadgeTone> = {
  ONLINE: 'success',
  CASH: 'warning',
  PARTIAL: 'accent',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
};
const STATUS_TONE: Record<string, BadgeTone> = {
  PENDING: 'neutral',
  CONFIRMED: 'brand',
  READY: 'brand',
  COMPLETED: 'success',
  CANCELLED: 'error',
  NO_SHOW: 'warning',
};

/** How a sale was paid: the method, and the online / in-person split. */
function PaymentCell({ t }: { t: FinanceTransaction }) {
  const open = t.state === 'UPCOMING';
  const parts: string[] = [];
  if (t.onlineMinor > 0) parts.push(`${formatMoney(t.onlineMinor)} online`);
  if (t.cashMinor > 0) parts.push(`${formatMoney(t.cashMinor)} ${open ? 'due in person' : 'cash'}`);
  return (
    <div className={local.split}>
      <Badge tone={METHOD_TONE[t.paymentMethod]}>{METHOD_LABEL[t.paymentMethod]}</Badge>
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
  const text =
    t.payableMinor === 0
      ? '—'
      : `${t.payableMinor > 0 ? '+' : '−'}${formatMoney(Math.abs(t.payableMinor))}`;
  return (
    <div className={styles.cellMain}>
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
            <th>{by === 'service' ? 'Service' : 'Business'}</th>
            <th className={styles.num}>Completed</th>
            <th className={styles.num}>Sales</th>
            <th className={styles.num}>Paid online</th>
            <th className={styles.num}>Cash / COD</th>
            <th className={styles.num}>Commission</th>
            <th className={styles.num}>You owe provider</th>
            <th className={styles.num}>Open</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className={local.rowLink}
              onClick={() => onOpen(r)}
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
              <td className={styles.num}>{formatMoney(r.grossMinor)}</td>
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
    <div className={styles.stats3}>
      <StatTile
        label="Completed sales"
        value={formatMoney(s.grossMinor)}
        icon={<Banknote size={18} aria-hidden="true" />}
        note={`${s.completedCount} completed · ${s.upcomingCount} open (${formatMoney(s.upcomingMinor)})`}
      />
      <StatTile
        label="Paid online"
        value={formatMoney(s.onlineMinor)}
        icon={<Wallet size={18} aria-hidden="true" />}
        note="Collected by DNX"
      />
      <StatTile
        label="Cash / COD"
        value={formatMoney(s.cashMinor)}
        icon={<HandCoins size={18} aria-hidden="true" />}
        note="Collected by the provider"
      />
      <StatTile
        label="Your commission"
        value={formatMoney(s.commissionMinor)}
        icon={<Coins size={18} aria-hidden="true" />}
        note={`Gateway fees ${formatMoney(s.gatewayFeeMinor)}`}
      />
      <StatTile
        label="Providers keep"
        value={formatMoney(s.earningMinor)}
        icon={<PiggyBank size={18} aria-hidden="true" />}
        note="After commission"
      />
      <StatTile
        label="You owe providers"
        value={`${s.payableMinor < 0 ? '−' : ''}${formatMoney(Math.abs(s.payableMinor))}`}
        icon={<Landmark size={18} aria-hidden="true" />}
        note="Online money − commission"
      />
    </div>
  );
}

/** The admin's money ledger: every booking/order, how it was paid, and what each side gets. */
export function AdminTransactions() {
  const t = useAdminTransactions();

  const rangeTabs = RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label }));
  const viewTabs = [
    { id: 'all', label: 'All transactions', count: t.data?.total },
    { id: 'business', label: 'By business' },
    { id: 'service', label: 'By service' },
  ];
  const pages = t.data ? Math.max(1, Math.ceil(t.data.total / t.pageSize)) : 1;
  const selectedBusiness = t.businessOptions.find((b) => b.id === t.businessId);
  const selectedService = t.serviceOptions.find((x) => x.id === t.serviceId);

  return (
    <>
      <div className={styles.controls}>
        <Tabs
          tabs={rangeTabs}
          active={t.preset}
          onChange={(id) => t.onPreset(id as typeof t.preset)}
        />
      </div>

      <p className={local.explain}>
        <strong>How it adds up:</strong> DNX collects the online part of each payment, so it owes
        the provider that money <strong>minus its commission</strong>. For cash / COD the provider
        keeps the cash, so the commission on it is <strong>taken off</strong> what you owe them. A
        partial payment does both: the commission comes out of the online deposit first. Dates are
        when the booking or order was placed.
      </p>

      <Card>
        <div className={local.filters}>
          <select
            className={form.select}
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
          </select>
          <select
            className={form.select}
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
          </select>
          <select
            className={form.select}
            aria-label="Payment type"
            value={t.method}
            onChange={(e) => t.onMethod(e.target.value)}
          >
            <option value="">All payment types</option>
            <option value="ONLINE">Online</option>
            <option value="CASH">COD / Cash</option>
            <option value="PARTIAL">Partial</option>
          </select>
          <select
            className={form.select}
            aria-label="Type"
            value={t.kind}
            onChange={(e) => t.onKind(e.target.value)}
          >
            <option value="">Bookings &amp; orders</option>
            <option value="BOOKING">Bookings</option>
            <option value="ORDER">Orders</option>
          </select>
          <select
            className={form.select}
            aria-label="Status"
            value={t.status}
            onChange={(e) => t.onStatus(e.target.value)}
          >
            <option value="">Any status</option>
            <option value="OPEN">Open (not finished)</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No-show</option>
          </select>
          <input
            key={t.search}
            className={`${form.input} ${local.search}`}
            type="search"
            placeholder="Search customer, business, service…"
            defaultValue={t.search}
            onKeyDown={(e) => {
              if (e.key === 'Enter') t.onSearch(e.currentTarget.value.trim());
            }}
            onBlur={(e) => {
              if (e.currentTarget.value.trim() !== t.search)
                t.onSearch(e.currentTarget.value.trim());
            }}
          />
          {t.ownerId && (
            <span className={local.chip}>
              Provider: {t.ownerName ?? 'selected'}
              <button
                type="button"
                className={local.chipClose}
                aria-label="Remove provider filter"
                onClick={t.clearOwner}
              >
                ×
              </button>
            </span>
          )}
          {t.hasFilters && (
            <Button variant="ghost" onClick={t.clearAll}>
              Clear filters
            </Button>
          )}
        </div>
        {(selectedService || selectedBusiness) && (
          <p className={styles.hint}>
            {selectedService
              ? `Showing ${selectedService.name} at ${selectedService.businessName} (bookings only).`
              : `Showing ${selectedBusiness?.name}. Owner: ${selectedBusiness?.ownerName}.`}
          </p>
        )}
      </Card>

      {t.isLoading || !t.data ? (
        <div className={styles.stats3}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={96} radius="var(--radius-lg)" />
          ))}
        </div>
      ) : (
        <SummaryTiles s={t.data.summary} />
      )}

      <div className={styles.controls}>
        <Tabs tabs={viewTabs} active={t.tab} onChange={(id) => t.onTab(id as TransactionTab)} />
      </div>

      {t.tab === 'all' ? (
        <Card flush>
          {t.isLoading || !t.data ? (
            <Skeleton height={200} radius="var(--radius-md)" />
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
              <div className={styles.tableWrap} style={{ border: 'none', borderRadius: 0 }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Placed</th>
                      <th>Sale</th>
                      <th>Payment</th>
                      <th className={styles.num}>Total</th>
                      <th className={styles.num}>Commission</th>
                      <th className={styles.num}>Provider keeps</th>
                      <th className={styles.num}>You pay provider</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t.data.rows.map((r) => (
                      <tr key={`${r.kind}-${r.id}`}>
                        <td className={styles.num}>{dateFmt.format(new Date(r.placedAt))}</td>
                        <td>
                          <div className={styles.cellMain}>
                            <span className={styles.cellTitle}>{r.title}</span>
                            <span className={styles.muted}>
                              {r.kind === 'BOOKING' ? 'Booking' : 'Order'} · {r.businessName} ·{' '}
                              {r.customerName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <PaymentCell t={r} />
                        </td>
                        <td className={styles.num}>{formatMoney(r.totalMinor)}</td>
                        <td className={styles.num}>
                          {r.state === 'NONE' ? (
                            '—'
                          ) : (
                            <div className={styles.cellMain}>
                              <span>{formatMoney(r.commissionMinor)}</span>
                              <span className={styles.muted}>
                                {bpsToPercentText(r.commissionBps)}%
                              </span>
                            </div>
                          )}
                        </td>
                        <td className={styles.num}>
                          {r.state === 'NONE' ? '—' : formatMoney(r.earningMinor)}
                        </td>
                        <td className={styles.num}>
                          <PayableCell t={r} />
                        </td>
                        <td>
                          <Badge tone={STATUS_TONE[r.status] ?? 'neutral'}>
                            {STATUS_LABEL[r.status] ?? r.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={local.pager} style={{ padding: '0 var(--space-lg) var(--space-md)' }}>
                <span className={styles.muted}>
                  {(t.page - 1) * t.pageSize + 1}–{Math.min(t.page * t.pageSize, t.data.total)} of{' '}
                  {t.data.total}
                </span>
                <span className={styles.inlineForm}>
                  <Button
                    variant="secondary"
                    disabled={t.page <= 1}
                    onClick={() => t.onPage(t.page - 1)}
                  >
                    Previous
                  </Button>
                  <span className={styles.muted}>
                    Page {t.page} of {pages}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={t.page >= pages}
                    onClick={() => t.onPage(t.page + 1)}
                  >
                    Next
                  </Button>
                </span>
              </div>
            </>
          )}
        </Card>
      ) : (
        <Card
          title={t.tab === 'service' ? 'By service' : 'By business'}
          subtitle={
            t.tab === 'service'
              ? 'Bookings grouped by service. Click a row to see its transactions. (Store orders have no single service — see them under By business.)'
              : 'Click a business to see its transactions.'
          }
        >
          {t.breakdownLoading ? (
            <Skeleton height={160} radius="var(--radius-md)" />
          ) : (
            <BreakdownTable
              rows={t.breakdown}
              by={t.tab === 'service' ? 'service' : 'business'}
              onOpen={(r) =>
                t.tab === 'service' ? t.openService(r.id, r.businessId) : t.openBusiness(r.id)
              }
            />
          )}
        </Card>
      )}
    </>
  );
}
