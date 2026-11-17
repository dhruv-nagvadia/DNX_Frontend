import { Search, Store } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { EntityCell } from '@/components/FinanceOverview/financeUi';
import { ModernCard } from '@/components/ModernCard';
import { Pill } from '@/components/Pill';
import { Skeleton } from '@/components/Skeleton';
import { bpsToPercentText } from '@/utils/money';
import { useBusinessCommissionRates } from './useBusinessCommissionRates';
import styles from '@/components/FinanceTable/FinanceTable.module.css';

/** Every business and the commission it's charged — override one without touching the default. */
export function BusinessCommissionRates() {
  const r = useBusinessCommissionRates();

  return (
    <div className={styles.section}>
      <ModernCard
        icon={<Store size={20} aria-hidden="true" />}
        title="Rates per business"
        suffix={r.businesses.length > 0 ? `(${r.businesses.length})` : undefined}
        action={
          <form role="search" onSubmit={r.onSearch}>
            <label className={styles.search}>
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search businesses"
                placeholder="Search business, owner or email…"
                value={r.query}
                onChange={r.onQuery}
              />
            </label>
          </form>
        }
      >
        <p className={styles.cardIntro}>
          {r.defaultCommissionBps === null
            ? 'Give a specific business its own commission, e.g. a launch offer.'
            : `Businesses follow the platform default of ${bpsToPercentText(r.defaultCommissionBps)}% unless you set their own rate here. Applies to new bookings and orders.`}
        </p>

        {r.error && (
          <div style={{ marginBottom: 'var(--m-gap)' }}>
            <AlertBanner tone="error">{r.error}</AlertBanner>
          </div>
        )}

        {r.isLoading ? (
          <Skeleton height={160} radius="var(--m-radius-box)" />
        ) : r.businesses.length === 0 ? (
          <EmptyState
            icon={<Store size={28} strokeWidth={1.6} aria-hidden="true" />}
            title="No businesses found"
            description="Try a different search, or check back once providers add businesses."
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Business</th>
                  <th scope="col">Owner</th>
                  <th scope="col">Rate type</th>
                  <th scope="col" className={styles.num}>
                    Commission
                  </th>
                  <th scope="col" className={styles.num}>
                    <span className={styles.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {r.businesses.map((b) => {
                  const editing = r.editingId === b.id;
                  const custom = b.customCommissionBps !== null;
                  return (
                    <tr key={b.id}>
                      <td>
                        <EntityCell
                          id={b.id}
                          name={b.name}
                          sub={`${b.type === 'STORE' ? 'Store' : 'Service'}${b.city ? ` · ${b.city}` : ''}`}
                        />
                      </td>
                      <td>
                        <div className={styles.cellMain}>
                          <span>{b.ownerName}</span>
                          <span className={styles.muted}>{b.ownerEmail}</span>
                        </div>
                      </td>
                      <td>
                        {custom ? (
                          <Pill tone="lavender">Custom</Pill>
                        ) : (
                          <Pill tone="grey">Default</Pill>
                        )}
                      </td>
                      <td className={styles.num}>
                        {editing ? (
                          <span className={styles.inlineForm}>
                            <input
                              className={styles.smallInput}
                              type="number"
                              min="0"
                              max="50"
                              step="any"
                              inputMode="decimal"
                              aria-label={`Commission % for ${b.name}`}
                              value={r.draft}
                              onChange={r.onDraft}
                              autoFocus
                            />
                            %
                          </span>
                        ) : (
                          <span className={styles.strongNum}>
                            {bpsToPercentText(b.effectiveCommissionBps)}%
                          </span>
                        )}
                      </td>
                      <td className={styles.num}>
                        {editing ? (
                          <span className={styles.actions}>
                            <Button variant="ghost" onClick={r.cancel} disabled={r.saving}>
                              Cancel
                            </Button>
                            <Button
                              onClick={() => r.save(b.id)}
                              loading={r.saving}
                              loadingText="Saving…"
                            >
                              Save
                            </Button>
                          </span>
                        ) : (
                          <span className={styles.actions}>
                            {custom && (
                              <Button
                                variant="ghost"
                                onClick={() => r.useDefault(b.id)}
                                disabled={r.saving}
                              >
                                Use default
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              onClick={() => r.startEdit(b.id, b.effectiveCommissionBps)}
                            >
                              Set rate
                            </Button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ModernCard>
    </div>
  );
}
