import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';

import { TrendChart } from '@/components/TrendChart';
import { Card } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { Tabs } from '@/components/Tabs';
import { BusinessType } from '@/redux/api/provider/types';

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

/** Short axis label, e.g. ₹1.2K. */
function compact(major: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(major);
  } catch {
    return `${Math.round(major)}`;
  }
}

/** Earnings summary + chart for one business, with a period toggle. */
export function EarningsPanel({
  providerId,
  businessType = 'SERVICE',
}: {
  providerId: string;
  businessType?: BusinessType;
}) {
  const { period, setPeriod, series, isLoading } = useEarnings(providerId, businessType);

  return (
    <Card
      title="Earnings"
      subtitle={PERIOD_NOTE[period]}
      action={
        <Tabs
          tabs={PERIODS}
          active={period}
          onChange={(id) => setPeriod(id as EarningsPeriod)}
        />
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

          {/* Always show the chart, even at a flat zero — the day/week/month
              labels on it already say "no revenue in this period" on their
              own; a quiet period isn't the same as "never had any data". */}
          <div className={styles.chartWrap}>
            <TrendChart
              data={series.points}
              height={260}
              highlightLast
              formatValue={(v) => money(v, series.currency)}
              formatAxis={(v) => compact(v, series.currency)}
            />
          </div>
          {series.isEmpty && (
            <p className={styles.emptyNote}>
              No earnings yet for this period. Your revenue will appear here once bookings or
              orders come in.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
