import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { BarChart } from '@/components/BarChart';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';

import { EarningsPeriod } from './types';
import { useEarnings } from './useEarnings';
import styles from './EarningsPanel.module.css';

const PERIODS: { id: EarningsPeriod; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

const PERIOD_NOTE: Record<EarningsPeriod, string> = {
  week: 'Last 7 days',
  month: 'Last 4 weeks',
  year: 'Last 12 months',
};

function money(major: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(major);
  } catch {
    return `${Math.round(major)}`;
  }
}

/** Earnings summary + chart for one business, with a period toggle. */
export function EarningsPanel({ providerId }: { providerId: string }) {
  const { period, setPeriod, series, isLoading } = useEarnings(providerId);

  return (
    <Card
      title="Earnings"
      subtitle={PERIOD_NOTE[period]}
      action={
        <div className={styles.toggle} role="tablist" aria-label="Earnings period">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={period === p.id}
              className={`${styles.toggleBtn} ${period === p.id ? styles.toggleBtnActive : ''}`}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      }
    >
      {isLoading ? (
        <Skeleton height={260} radius="var(--radius-lg)" />
      ) : (
        <>
          <div className={styles.headline}>
            <span className={styles.totalIcon}>
              <Wallet size={18} aria-hidden="true" />
            </span>
            <div className={styles.totalText}>
              <span className={styles.totalValue}>{money(series.total, series.currency)}</span>
              <span className={styles.totalLabel}>Total this {period}</span>
            </div>
            {series.trendPct !== null && (
              <span
                className={`${styles.trend} ${series.trendPct >= 0 ? styles.trendUp : styles.trendDown}`}
              >
                {series.trendPct >= 0 ? (
                  <TrendingUp size={14} aria-hidden="true" />
                ) : (
                  <TrendingDown size={14} aria-hidden="true" />
                )}
                {Math.abs(series.trendPct)}%
              </span>
            )}
          </div>

          <div className={styles.chartWrap}>
            <BarChart
              data={series.points}
              height={200}
              highlightLast
              formatValue={(v) => money(v, series.currency)}
            />
          </div>

          {series.isSample && (
            <p className={styles.sample}>
              Showing sample figures — your real earnings will appear here as bookings come in.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
