import { Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AlertBanner } from '@/components/AlertBanner';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { formatMoney } from '@/utils/money';
import { useProviderBalances } from './useProviderBalances';
// Generic field/label/form styling shared across provider/admin forms.
import form from '@/components/ServicesManager/ServicesManager.module.css';
import styles from '@/components/FinanceTable/FinanceTable.module.css';

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/**
 * Who you owe and who owes you. The platform holds every online payment, so
 * it owes providers those minus its commission; commission on cash sales is a
 * debt the provider owes back. Transfers happen outside the app (UPI/bank) and
 * are recorded here, which keeps the running balance honest.
 */
export function ProviderBalances() {
  const b = useProviderBalances();

  return (
    <>
      <Card
        title="Provider balances"
        subtitle="Positive = you owe the provider. Negative = the provider owes you commission (cash sales). Pay by UPI or bank transfer, then record it here."
      >
        {b.isLoading ? (
          <Skeleton height={120} radius="var(--radius-md)" />
        ) : b.balances.length === 0 ? (
          <EmptyState
            icon={<Wallet size={28} strokeWidth={1.6} aria-hidden="true" />}
            title="No providers yet"
            description="Balances appear once providers have completed sales."
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th className={styles.num}>Sales</th>
                  <th className={styles.num}>Commission</th>
                  <th className={styles.num}>Paid / received</th>
                  <th className={styles.num}>Balance</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {b.balances.map((row) => (
                  <tr key={row.userId}>
                    <td>
                      <div className={styles.cellMain}>
                        <span className={styles.cellTitle}>{row.name}</span>
                        <span className={styles.muted}>
                          {row.email} · {row.businessCount} business
                          {row.businessCount === 1 ? '' : 'es'}
                        </span>
                      </div>
                    </td>
                    <td className={styles.num}>{formatMoney(row.grossMinor)}</td>
                    <td className={styles.num}>{formatMoney(row.commissionMinor)}</td>
                    <td className={styles.num}>
                      {formatMoney(row.paidOutMinor)} / {formatMoney(row.receivedMinor)}
                    </td>
                    <td className={styles.num}>
                      {row.balanceMinor === 0 ? (
                        <span className={styles.muted}>Settled</span>
                      ) : row.balanceMinor > 0 ? (
                        <div className={styles.cellMain}>
                          <span className={styles.positive}>{formatMoney(row.balanceMinor)}</span>
                          <span className={styles.muted}>you owe them</span>
                        </div>
                      ) : (
                        <div className={styles.cellMain}>
                          <span className={styles.negative}>{formatMoney(-row.balanceMinor)}</span>
                          <span className={styles.muted}>they owe you</span>
                        </div>
                      )}
                    </td>
                    <td className={styles.num}>
                      <span className={styles.inlineForm}>
                        <Link to={`/admin/transactions?ownerId=${row.userId}&range=all`}>
                          <Button variant="ghost">Transactions</Button>
                        </Link>
                        <Button variant="secondary" onClick={() => b.open(row)}>
                          Record settlement
                        </Button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Recent settlements">
        {b.payouts.length === 0 ? (
          <p className={form.muted}>Nothing recorded yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Provider</th>
                  <th>Type</th>
                  <th className={styles.num}>Amount</th>
                  <th>Details</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {b.payouts.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.num}>{dateFmt.format(new Date(p.paidAt))}</td>
                    <td>{p.providerName ?? '—'}</td>
                    <td>
                      <Badge tone={p.direction === 'TO_PROVIDER' ? 'brand' : 'success'}>
                        {p.direction === 'TO_PROVIDER'
                          ? 'Paid to provider'
                          : 'Received from provider'}
                      </Badge>
                    </td>
                    <td className={styles.num}>{formatMoney(p.amountMinor)}</td>
                    <td>
                      <span className={styles.muted}>
                        {[p.method, p.reference, p.note].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </td>
                    <td className={styles.num}>
                      <Button variant="ghost" onClick={() => b.remove(p.id)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {b.target && (
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <form className={styles.stack} onSubmit={b.submit}>
              <p className={form.formTitle}>Record a settlement with {b.target.name}</p>
              <p className={form.muted}>
                Current balance:{' '}
                {b.target.balanceMinor === 0
                  ? 'settled'
                  : b.target.balanceMinor > 0
                    ? `you owe them ${formatMoney(b.target.balanceMinor)}`
                    : `they owe you ${formatMoney(-b.target.balanceMinor)}`}
                . Recording a transfer here only updates the books — it doesn't move money.
              </p>

              <div className={form.field}>
                <label className={form.label} htmlFor="settleDirection">
                  What happened
                </label>
                <select
                  id="settleDirection"
                  className={form.select}
                  value={b.direction}
                  onChange={(e) => b.setDirection(e.target.value as typeof b.direction)}
                >
                  <option value="TO_PROVIDER">I paid the provider their earnings</option>
                  <option value="FROM_PROVIDER">
                    The provider paid me the commission they owed
                  </option>
                </select>
              </div>

              <div className={form.field}>
                <label className={form.label} htmlFor="settleAmount">
                  Amount (₹)
                </label>
                <input
                  id="settleAmount"
                  className={form.input}
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={b.amount}
                  onChange={(e) => b.setAmount(e.target.value)}
                />
              </div>

              <div className={form.row2}>
                <div className={form.field}>
                  <label className={form.label} htmlFor="settleMethod">
                    Method <span className={form.optional}>(optional)</span>
                  </label>
                  <input
                    id="settleMethod"
                    className={form.input}
                    placeholder="UPI, bank transfer…"
                    value={b.method}
                    onChange={(e) => b.setMethod(e.target.value)}
                    maxLength={40}
                  />
                </div>
                <div className={form.field}>
                  <label className={form.label} htmlFor="settleRef">
                    Reference <span className={form.optional}>(optional)</span>
                  </label>
                  <input
                    id="settleRef"
                    className={form.input}
                    placeholder="Transaction ID"
                    value={b.reference}
                    onChange={(e) => b.setReference(e.target.value)}
                    maxLength={120}
                  />
                </div>
              </div>

              <div className={form.field}>
                <label className={form.label} htmlFor="settleNote">
                  Note <span className={form.optional}>(optional)</span>
                </label>
                <input
                  id="settleNote"
                  className={form.input}
                  value={b.note}
                  onChange={(e) => b.setNote(e.target.value)}
                  maxLength={500}
                />
              </div>

              {b.error && <AlertBanner tone="error">{b.error}</AlertBanner>}

              <div className={form.formActions}>
                <Button type="button" variant="secondary" onClick={b.close} disabled={b.saving}>
                  Cancel
                </Button>
                <Button type="submit" loading={b.saving} loadingText="Saving…">
                  Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
