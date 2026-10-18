import { Banknote, Coins, Landmark, TrendingUp } from 'lucide-react';

import { BarChart } from '@/components/BarChart';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { StatTile } from '@/components/StatTile';
import { Tabs } from '@/components/Tabs';
import { RANGE_PRESETS } from '@/utils/dateRange';
import { formatMoney } from '@/utils/money';
import { bucketLabel, useFinanceOverview } from './useFinanceOverview';
import styles from '@/components/FinanceTable/FinanceTable.module.css';

const MAX_BARS = 31;

/** What the platform earned: commission, gateway fees and profit, for any period. */
export function FinanceOverview() {
  const { data, isLoading, preset, onPreset, groupBy, onGroupBy } = useFinanceOverview();

  const tabs = RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label }));
  const groupTabs = [
    { id: 'day', label: 'By day' },
    { id: 'month', label: 'By month' },
  ];

  return (
    <>
      <div className={styles.controls}>
        <Tabs tabs={tabs} active={preset} onChange={(id) => onPreset(id as typeof preset)} />
        <Tabs
          tabs={groupTabs}
          active={groupBy}
          onChange={(id) => onGroupBy(id as typeof groupBy)}
        />
      </div>

      {isLoading || !data ? (
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
              value={formatMoney(data.totals.grossMinor)}
              icon={<Banknote size={18} aria-hidden="true" />}
              note={`${data.totals.count} completed (incl. kept no-show payments)`}
            />
            <StatTile
              label="Your commission"
              value={formatMoney(data.totals.commissionMinor)}
              icon={<Coins size={18} aria-hidden="true" />}
              note={`Providers earn ${formatMoney(data.totals.netMinor)}`}
            />
            <StatTile
              label="Gateway fees (est.)"
              value={formatMoney(data.totals.gatewayFeesMinor)}
              icon={<Landmark size={18} aria-hidden="true" />}
              note="Set under Commission → gateway fee"
            />
            <StatTile
              label="Your profit"
              value={formatMoney(data.totals.profitMinor)}
              icon={<TrendingUp size={18} aria-hidden="true" />}
              note="Commission − gateway fees"
            />
          </div>

          {data.upcoming.count > 0 && (
            <p className={styles.hint} style={{ marginBottom: 'var(--space-lg)' }}>
              Plus {formatMoney(data.upcoming.commissionMinor)} commission expected from{' '}
              {data.upcoming.count} open booking{data.upcoming.count === 1 ? '' : 's'}/order
              {data.upcoming.count === 1 ? '' : 's'}, counted once they complete.
            </p>
          )}

          <Card
            title={groupBy === 'month' ? 'Commission by month' : 'Commission by day'}
            subtitle="Counted on the day a booking or order is completed (or cancelled with money kept)."
          >
            {data.series.length === 0 ? (
              <EmptyState
                title="No completed sales in this period"
                description="Commission shows up here once bookings and orders are completed."
              />
            ) : (
              <>
                <BarChart
                  data={data.series.slice(-MAX_BARS).map((s) => ({
                    label: bucketLabel(s.key),
                    value: s.commissionMinor,
                  }))}
                  formatValue={formatMoney}
                  highlightLast
                />
                <div className={styles.tableWrap} style={{ marginTop: 'var(--space-md)' }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>{groupBy === 'month' ? 'Month' : 'Day'}</th>
                        <th className={styles.num}>Sales</th>
                        <th className={styles.num}>Commission</th>
                        <th className={styles.num}>Gateway fees</th>
                        <th className={styles.num}>Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...data.series].reverse().map((s) => (
                        <tr key={s.key}>
                          <td>
                            <div className={styles.cellMain}>
                              <span className={styles.cellTitle}>{bucketLabel(s.key)}</span>
                              <span className={styles.muted}>{s.count} completed</span>
                            </div>
                          </td>
                          <td className={styles.num}>{formatMoney(s.grossMinor)}</td>
                          <td className={styles.num}>{formatMoney(s.commissionMinor)}</td>
                          <td className={styles.num}>{formatMoney(s.gatewayFeeMinor)}</td>
                          <td
                            className={`${styles.num} ${s.profitMinor < 0 ? styles.negative : styles.positive}`}
                          >
                            {formatMoney(s.profitMinor)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </>
  );
}
