import { Banknote, Coins, Hourglass, PiggyBank } from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { StatTile } from '@/components/StatTile';
import { Tabs } from '@/components/Tabs';
import { EarningsTransaction } from '@/redux/api/provider/types';
import { RANGE_PRESETS } from '@/utils/dateRange';
import { bpsToPercentText, formatMoney } from '@/utils/money';
import { useEarningsPage } from './useEarningsPage';
// Generic field/label/form styling shared across provider/admin forms.
import form from '@/components/ServicesManager/ServicesManager.module.css';
import styles from '@/components/FinanceTable/FinanceTable.module.css';

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function paidVia(t: EarningsTransaction): string {
  if (t.onlineMinor > 0 && t.cashMinor > 0) return 'Online + cash';
  if (t.onlineMinor > 0) return 'Online';
  return 'Cash';
}

/** What the provider takes home after the platform's commission, and what's owed either way. */
export default function EarningsPage() {
  const e = useEarningsPage();
  const data = e.data;

  const tabs = RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label }));
  const balance = data?.balance.balanceMinor ?? 0;

  return (
    <AppShell>
      <PageHeader
        title="Earnings"
        subtitle="What you take home after DNX's commission, and what's owed between you and DNX."
      />

      <div className={styles.controls}>
        <Tabs tabs={tabs} active={e.preset} onChange={(id) => e.onPreset(id as typeof e.preset)} />
        {e.businesses.length > 1 && (
          <select
            className={form.select}
            style={{ width: 'auto', minWidth: 200 }}
            aria-label="Filter by business"
            value={e.businessId}
            onChange={(ev) => e.onBusiness(ev.target.value)}
          >
            <option value="">All businesses</option>
            {e.businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.businessName}
              </option>
            ))}
          </select>
        )}
      </div>

      {e.isLoading || !data ? (
        <div className={styles.stats}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={96} radius="var(--radius-lg)" />
          ))}
        </div>
      ) : (
        <>
          <div className={styles.stats}>
            <StatTile
              label="Sales"
              value={formatMoney(data.summary.grossMinor)}
              icon={<Banknote size={18} aria-hidden="true" />}
              note={`${data.summary.count} completed`}
            />
            <StatTile
              label="DNX commission"
              value={formatMoney(data.summary.commissionMinor)}
              icon={<Coins size={18} aria-hidden="true" />}
              note={`Currently ${bpsToPercentText(data.defaultCommissionBps)}% on new sales`}
            />
            <StatTile
              label="You earn"
              value={formatMoney(data.summary.netMinor)}
              icon={<PiggyBank size={18} aria-hidden="true" />}
              note={`${formatMoney(data.summary.onlineMinor)} online · ${formatMoney(data.summary.cashMinor)} cash`}
            />
            <StatTile
              label="Coming up"
              value={formatMoney(data.upcoming.netMinor)}
              icon={<Hourglass size={18} aria-hidden="true" />}
              note={`${data.upcoming.count} open · after ${formatMoney(data.upcoming.commissionMinor)} commission`}
            />
          </div>

          <Card
            title="Your payout from DNX"
            subtitle="How the amount DNX pays you is worked out, across all your businesses and every completed sale."
          >
            <div className={styles.calc}>
              <div className={styles.calcRow}>
                <span>
                  Online payments DNX collected for you
                  <small>Customers who paid online (or the online part of a partial payment)</small>
                </span>
                <span className={styles.calcAmount}>
                  + {formatMoney(data.balance.earnedOnlineMinor)}
                </span>
              </div>
              <div className={styles.calcRow}>
                <span>
                  DNX commission
                  <small>
                    On all completed sales — including cash / COD, which you collected yourself, so
                    its commission comes off here
                  </small>
                </span>
                <span className={styles.calcAmount}>
                  − {formatMoney(data.balance.earnedCommissionMinor)}
                </span>
              </div>
              <div className={styles.calcRow}>
                <span>
                  Already paid to you
                  <small>Transfers DNX has recorded</small>
                </span>
                <span className={styles.calcAmount}>
                  − {formatMoney(data.balance.paidOutMinor)}
                </span>
              </div>
              {data.balance.receivedMinor > 0 && (
                <div className={styles.calcRow}>
                  <span>
                    Commission you've already paid DNX
                    <small>Settled directly with DNX</small>
                  </span>
                  <span className={styles.calcAmount}>
                    + {formatMoney(data.balance.receivedMinor)}
                  </span>
                </div>
              )}
              <div className={styles.calcTotal}>
                <span>{balance < 0 ? 'You owe DNX' : 'DNX will pay you'}</span>
                <span
                  className={
                    balance < 0 ? styles.negative : balance > 0 ? styles.positive : undefined
                  }
                >
                  {formatMoney(Math.abs(balance))}
                </span>
              </div>
            </div>
            <p className={styles.hint}>
              {balance > 0
                ? "This is the amount you'll receive from DNX by UPI / bank transfer. It shows under Settlements once DNX records the transfer."
                : balance < 0
                  ? 'Most of your sales were paid in cash, so the commission on them is more than the online money DNX holds. DNX will settle this with you.'
                  : "You're all settled up — nothing owed either way."}{' '}
              Sales still open ({data.upcoming.count}) are counted once they&apos;re completed.
            </p>
          </Card>

          {data.businesses.length > 1 && (
            <Card title="By business">
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th className={styles.num}>Rate</th>
                      <th className={styles.num}>Sales</th>
                      <th className={styles.num}>Commission</th>
                      <th className={styles.num}>You earn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.businesses.map((b) => (
                      <tr key={b.id}>
                        <td>{b.name}</td>
                        <td className={styles.num}>
                          {bpsToPercentText(b.commissionBps)}%{' '}
                          {b.isCustomRate && <Badge tone="accent">Custom</Badge>}
                        </td>
                        <td className={styles.num}>{formatMoney(b.grossMinor)}</td>
                        <td className={styles.num}>{formatMoney(b.commissionMinor)}</td>
                        <td className={styles.num}>{formatMoney(b.netMinor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <Card title="Completed sales">
            {data.transactions.length === 0 ? (
              <EmptyState
                icon={<Banknote size={28} strokeWidth={1.6} aria-hidden="true" />}
                title="No completed sales in this period"
                description="Sales appear here once a booking or order is completed."
              />
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Sale</th>
                      <th className={styles.num}>Price</th>
                      <th className={styles.num}>Commission</th>
                      <th className={styles.num}>You earn</th>
                      <th>Paid</th>
                      <th className={styles.num}>From DNX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map((t) => (
                      <tr key={`${t.kind}-${t.id}`}>
                        <td className={styles.num}>
                          {t.settledAt ? dateFmt.format(new Date(t.settledAt)) : '—'}
                        </td>
                        <td>
                          <div className={styles.cellMain}>
                            <span className={styles.cellTitle}>{t.title}</span>
                            <span className={styles.muted}>
                              {t.kind === 'BOOKING' ? 'Booking' : 'Order'} · {t.businessName}
                              {t.status !== 'COMPLETED' &&
                                ' · payment kept after no-show/late cancel'}
                            </span>
                          </div>
                        </td>
                        <td className={styles.num}>{formatMoney(t.grossMinor)}</td>
                        <td className={styles.num}>
                          −{formatMoney(t.commissionMinor)}{' '}
                          <span className={styles.muted}>
                            ({bpsToPercentText(t.commissionBps)}%)
                          </span>
                        </td>
                        <td className={`${styles.num} ${styles.positive}`}>
                          {formatMoney(t.earningMinor)}
                        </td>
                        <td>{paidVia(t)}</td>
                        <td className={styles.num}>
                          <div className={styles.cellMain}>
                            <span
                              className={
                                t.payableMinor < 0
                                  ? styles.negative
                                  : t.payableMinor > 0
                                    ? styles.positive
                                    : styles.muted
                              }
                            >
                              {t.payableMinor === 0
                                ? '—'
                                : `${t.payableMinor > 0 ? '+' : '−'}${formatMoney(Math.abs(t.payableMinor))}`}
                            </span>
                            {t.payableMinor < 0 && (
                              <span className={styles.muted}>cash — commission taken off</span>
                            )}
                            {t.payableMinor > 0 && t.cashMinor > 0 && (
                              <span className={styles.muted}>online part, after commission</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {data.payouts.length > 0 && (
            <Card title="Settlements">
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th className={styles.num}>Amount</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payouts.map((p) => (
                      <tr key={p.id}>
                        <td className={styles.num}>{dateFmt.format(new Date(p.paidAt))}</td>
                        <td>
                          <Badge tone={p.direction === 'TO_PROVIDER' ? 'success' : 'neutral'}>
                            {p.direction === 'TO_PROVIDER' ? 'Paid to you' : 'Paid to DNX'}
                          </Badge>
                        </td>
                        <td className={styles.num}>{formatMoney(p.amountMinor)}</td>
                        <td>
                          <span className={styles.muted}>
                            {[p.method, p.reference, p.note].filter(Boolean).join(' · ') || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </AppShell>
  );
}
