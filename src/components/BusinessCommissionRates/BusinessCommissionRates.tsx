import { Store } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { bpsToPercentText } from '@/utils/money';
import { useBusinessCommissionRates } from './useBusinessCommissionRates';
import styles from '@/components/FinanceTable/FinanceTable.module.css';
import search from '@/components/AdminUsersManager/AdminUsersManager.module.css';

/** Every business and the commission it's charged — override one without touching the default. */
export function BusinessCommissionRates() {
  const r = useBusinessCommissionRates();

  return (
    <Card
      title="Rates per business"
      subtitle={
        r.defaultCommissionBps === null
          ? 'Give a specific business its own commission, e.g. a launch offer.'
          : `Businesses follow the platform default of ${bpsToPercentText(r.defaultCommissionBps)}% unless you set their own rate here. Applies to new bookings and orders.`
      }
    >
      <form className={search.searchRow} onSubmit={r.onSearch}>
        <input
          className={search.searchInput}
          placeholder="Search by business, owner name or email…"
          value={r.query}
          onChange={r.onQuery}
        />
      </form>

      {r.error && <AlertBanner tone="error">{r.error}</AlertBanner>}

      {r.isLoading ? (
        <Skeleton height={120} radius="var(--radius-md)" />
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
                <th>Business</th>
                <th>Owner</th>
                <th className={styles.num}>Commission</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {r.businesses.map((b) => {
                const editing = r.editingId === b.id;
                const custom = b.customCommissionBps !== null;
                return (
                  <tr key={b.id}>
                    <td>
                      <div className={styles.cellMain}>
                        <span className={styles.cellTitle}>{b.name}</span>
                        <span className={styles.muted}>
                          {b.type === 'STORE' ? 'Store' : 'Service'}
                          {b.city ? ` · ${b.city}` : ''}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.cellMain}>
                        <span>{b.ownerName}</span>
                        <span className={styles.muted}>{b.ownerEmail}</span>
                      </div>
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
                        <span className={styles.inlineForm}>
                          {bpsToPercentText(b.effectiveCommissionBps)}%
                          {custom && <Badge tone="accent">Custom</Badge>}
                        </span>
                      )}
                    </td>
                    <td className={styles.num}>
                      {editing ? (
                        <span className={styles.inlineForm}>
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
                        <span className={styles.inlineForm}>
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
    </Card>
  );
}
