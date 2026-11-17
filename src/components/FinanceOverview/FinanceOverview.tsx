import { Banknote, Coins, Info, Landmark, LineChart, TrendingUp } from 'lucide-react';

import { EmptyState } from '@/components/EmptyState';
import { ModernCard } from '@/components/ModernCard';
import { Skeleton } from '@/components/Skeleton';
import { SmoothTrendChart } from '@/components/SmoothTrendChart';
import { FinanceGroupBy } from '@/redux/api/admin/types';
import { RANGE_PRESETS, RangePreset } from '@/utils/dateRange';
import { formatMoney } from '@/utils/money';
import { MoneyTile, Segmented } from './financeUi';
import { bucketLabel, useFinanceOverview } from './useFinanceOverview';
import styles from '@/components/FinanceTable/FinanceTable.module.css';

const MAX_BARS = 31;

const GROUP_OPTIONS: { id: FinanceGroupBy; label: string }[] = [
  { id: 'day', label: 'By day' },
  { id: 'month', label: 'By month' },
];

/** What the platform earned: commission, gateway fees and profit, for any period. */
export function FinanceOverview() {
  const { data, isLoading, preset, onPreset, groupBy, onGroupBy } = useFinanceOverview();

  return (
    <div className={styles.section}>
      <div className={styles.controls}>
        <Segmented<RangePreset>
          label="Date range"
          options={RANGE_PRESETS}
          value={preset}
          onChange={onPreset}
        />
        <Segmented<FinanceGroupBy>
          label="Group by"
          options={GROUP_OPTIONS}
          value={groupBy}
          onChange={onGroupBy}
        />
      </div>

      {isLoading || !data ? (
        <div className={styles.tiles}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={96} radius="var(--m-radius-card)" />
          ))}
        </div>
      ) : (
        <>
          <div className={styles.tiles}>
            <MoneyTile
              tone="blue"
              label="Sales (GMV)"
              value={formatMoney(data.totals.grossMinor)}
              icon={<Banknote size={20} />}
              note={`${data.totals.count} completed (incl. kept no-show payments)`}
            />
            <MoneyTile
              tone="lavender"
              label="Your commission"
              value={formatMoney(data.totals.commissionMinor)}
              icon={<Coins size={20} />}
              note={`Providers earn ${formatMoney(data.totals.netMinor)}`}
            />
            <MoneyTile
              tone="peach"
              label="Gateway fees (est.)"
              value={formatMoney(data.totals.gatewayFeesMinor)}
              icon={<Landmark size={20} />}
              note="Set under Commission → gateway fee"
            />
            <MoneyTile
              tone={data.totals.profitMinor < 0 ? 'pink' : 'mint'}
              label="Your profit"
              value={formatMoney(data.totals.profitMinor)}
              icon={<TrendingUp size={20} />}
              note="Commission − gateway fees"
            />
          </div>

          {data.upcoming.count > 0 && (
            <p className={styles.infoBox}>
              <Info size={16} aria-hidden="true" />
              <span>
                Plus <strong>{formatMoney(data.upcoming.commissionMinor)}</strong> commission
                expected from {data.upcoming.count} open booking
                {data.upcoming.count === 1 ? '' : 's'}/order
                {data.upcoming.count === 1 ? '' : 's'}, counted once they complete.
              </span>
            </p>
          )}

          <ModernCard
            icon={<LineChart size={20} aria-hidden="true" />}
            title={groupBy === 'month' ? 'Commission by month' : 'Commission by day'}
          >
            <p className={styles.cardIntro}>
              Counted on the day a booking or order is completed (or cancelled with money kept).
            </p>
            {data.series.length === 0 ? (
              <EmptyState
                title="No completed sales in this period"
                description="Commission shows up here once bookings and orders are completed."
              />
            ) : (
              <>
                <SmoothTrendChart
                  points={data.series.slice(-MAX_BARS).map((s) => ({
                    label: bucketLabel(s.key),
                    value: s.commissionMinor,
                    secondary: s.profitMinor,
                  }))}
                  seriesLabel="Commission"
                  secondaryLabel="Profit"
                  height={240}
                  ariaLabel="Commission and profit over the selected period"
                />
                <div className={styles.tableWrap} style={{ marginTop: 'var(--m-gap)' }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope="col">{groupBy === 'month' ? 'Month' : 'Day'}</th>
                        <th scope="col" className={styles.num}>
                          Sales
                        </th>
                        <th scope="col" className={styles.num}>
                          Commission
                        </th>
                        <th scope="col" className={styles.num}>
                          Gateway fees
                        </th>
                        <th scope="col" className={styles.num}>
                          Profit
                        </th>
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
                          <td className={`${styles.num} ${styles.strongNum}`}>
                            {formatMoney(s.commissionMinor)}
                          </td>
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
          </ModernCard>
        </>
      )}
    </div>
  );
}
