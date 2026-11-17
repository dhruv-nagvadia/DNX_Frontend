import { ArrowDownLeft, ArrowUpRight, ReceiptText, Scale, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { EntityCell, MoneyTile } from '@/components/FinanceOverview/financeUi';
import { FormDialog } from '@/components/FormDialog';
import { ModernCard } from '@/components/ModernCard';
import { Pill } from '@/components/Pill';
import { Select } from '@/components/Select';
import { Skeleton } from '@/components/Skeleton';
import { formatMoney } from '@/utils/money';
import { useProviderBalances } from './useProviderBalances';
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

  // Display-only totals, derived from the rows already loaded.
  let owedToProviders = 0;
  let owedByProviders = 0;
  let unsettled = 0;
  for (const row of b.balances) {
    if (row.balanceMinor > 0) owedToProviders += row.balanceMinor;
    if (row.balanceMinor < 0) owedByProviders -= row.balanceMinor;
    if (row.balanceMinor !== 0) unsettled += 1;
  }

  return (
    <div className={styles.section}>
      {!b.isLoading && b.balances.length > 0 && (
        <div className={styles.tiles3}>
          <MoneyTile
            tone="peach"
            label="Pending payouts"
            value={formatMoney(owedToProviders)}
            icon={<ArrowUpRight size={20} />}
            note="You owe providers (online money − commission)"
          />
          <MoneyTile
            tone="mint"
            label="Owed to you"
            value={formatMoney(owedByProviders)}
            icon={<ArrowDownLeft size={20} />}
            note="Commission on cash sales, still to collect"
          />
          <MoneyTile
            tone="blue"
            label="Open balances"
            value={`${unsettled} of ${b.balances.length}`}
            icon={<Scale size={20} />}
            note="Providers not yet settled"
          />
        </div>
      )}

      <ModernCard icon={<Wallet size={20} aria-hidden="true" />} title="Provider balances">
        <p className={styles.cardIntro}>
          Positive = you owe the provider. Negative = the provider owes you commission (cash
          sales). Pay by UPI or bank transfer, then record it here.
        </p>
        {b.isLoading ? (
          <Skeleton height={160} radius="var(--m-radius-box)" />
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
                  <th scope="col">Provider</th>
                  <th scope="col" className={styles.num}>
                    Sales
                  </th>
                  <th scope="col" className={styles.num}>
                    Commission
                  </th>
                  <th scope="col" className={styles.num}>
                    Paid / received
                  </th>
                  <th scope="col" className={styles.num}>
                    Balance
                  </th>
                  <th scope="col">Status</th>
                  <th scope="col" className={styles.num}>
                    <span className={styles.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {b.balances.map((row) => (
                  <tr key={row.userId}>
                    <td>
                      <EntityCell
                        id={row.userId}
                        name={row.name}
                        sub={`${row.email} · ${row.businessCount} business${row.businessCount === 1 ? '' : 'es'}`}
                      />
                    </td>
                    <td className={styles.num}>{formatMoney(row.grossMinor)}</td>
                    <td className={styles.num}>{formatMoney(row.commissionMinor)}</td>
                    <td className={styles.num}>
                      {formatMoney(row.paidOutMinor)} / {formatMoney(row.receivedMinor)}
                    </td>
                    <td
                      className={`${styles.num} ${
                        row.balanceMinor > 0
                          ? styles.positive
                          : row.balanceMinor < 0
                            ? styles.negative
                            : styles.strongNum
                      }`}
                    >
                      {row.balanceMinor < 0 ? '−' : ''}
                      {formatMoney(Math.abs(row.balanceMinor))}
                    </td>
                    <td>
                      {row.balanceMinor === 0 ? (
                        <Pill tone="green">Settled</Pill>
                      ) : row.balanceMinor > 0 ? (
                        <Pill tone="orange">You owe them</Pill>
                      ) : (
                        <Pill tone="blue">They owe you</Pill>
                      )}
                    </td>
                    <td className={styles.num}>
                      <span className={styles.actions}>
                        <Link
                          to={`/admin/transactions?ownerId=${row.userId}&range=all`}
                          className={styles.textLink}
                        >
                          <ReceiptText size={15} aria-hidden="true" />
                          Transactions
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
      </ModernCard>

      <ModernCard
        icon={<ReceiptText size={20} aria-hidden="true" />}
        title="Recent settlements"
        suffix={b.payouts.length > 0 ? `(${b.payouts.length})` : undefined}
      >
        {b.payouts.length === 0 ? (
          <p className={styles.cardIntro} style={{ margin: 0 }}>
            Nothing recorded yet.
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Provider</th>
                  <th scope="col">Type</th>
                  <th scope="col" className={styles.num}>
                    Amount
                  </th>
                  <th scope="col">Details</th>
                  <th scope="col" className={styles.num}>
                    <span className={styles.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {b.payouts.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.nowrap}>{dateFmt.format(new Date(p.paidAt))}</td>
                    <td className={styles.cellTitle}>{p.providerName ?? '—'}</td>
                    <td>
                      {p.direction === 'TO_PROVIDER' ? (
                        <Pill tone="orange">
                          <ArrowUpRight size={13} aria-hidden="true" />
                          Paid to provider
                        </Pill>
                      ) : (
                        <Pill tone="green">
                          <ArrowDownLeft size={13} aria-hidden="true" />
                          Received from provider
                        </Pill>
                      )}
                    </td>
                    <td className={`${styles.num} ${styles.strongNum}`}>
                      {formatMoney(p.amountMinor)}
                    </td>
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
      </ModernCard>

      <FormDialog
        open={!!b.target}
        size="md"
        title={b.target ? `Record a settlement with ${b.target.name}` : ''}
        subtitle={
          b.target ? (
            <>
              Current balance:{' '}
              {b.target.balanceMinor === 0
                ? 'settled'
                : b.target.balanceMinor > 0
                  ? `you owe them ${formatMoney(b.target.balanceMinor)}`
                  : `they owe you ${formatMoney(-b.target.balanceMinor)}`}
              . Recording a transfer here only updates the books — it doesn't move money.
            </>
          ) : undefined
        }
        onClose={b.close}
        onSubmit={b.submit}
        error={b.error}
        submitLabel="Record"
        submitting={b.saving}
        submittingLabel="Saving…"
      >
        <div className={styles.field}>
          <label className={styles.label} htmlFor="settleDirection">
            What happened
          </label>
          <Select
            id="settleDirection"
            value={b.direction}
            onChange={(e) => b.setDirection(e.target.value as typeof b.direction)}
          >
            <option value="TO_PROVIDER">I paid the provider their earnings</option>
            <option value="FROM_PROVIDER">The provider paid me the commission they owed</option>
          </Select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="settleAmount">
            Amount (₹)
          </label>
          <input
            id="settleAmount"
            className={styles.input}
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={b.amount}
            onChange={(e) => b.setAmount(e.target.value)}
          />
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="settleMethod">
              Method <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="settleMethod"
              className={styles.input}
              placeholder="UPI, bank transfer…"
              value={b.method}
              onChange={(e) => b.setMethod(e.target.value)}
              maxLength={40}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="settleRef">
              Reference <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="settleRef"
              className={styles.input}
              placeholder="Transaction ID"
              value={b.reference}
              onChange={(e) => b.setReference(e.target.value)}
              maxLength={120}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="settleNote">
            Note <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="settleNote"
            className={styles.input}
            value={b.note}
            onChange={(e) => b.setNote(e.target.value)}
            maxLength={500}
          />
        </div>
      </FormDialog>
    </div>
  );
}
