import { ArrowDown, ArrowUp, BarChart3 } from 'lucide-react';

import { TrendChart } from '@/components/TrendChart';
import { ModernCard } from '@/components/ModernCard';
import { Skeleton } from '@/components/Skeleton';
import { BusinessType } from '@/redux/api/provider/types';

import { EarningsPeriod } from './types';
import { useEarnings } from './useEarnings';
import styles from './EarningsPanel.module.css';

const PERIODS: { id: EarningsPeriod; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

/** The trend compares the latest point with the one before it. */
const COMPARE_LABEL: Record<EarningsPeriod, string> = {
  week: 'vs. previous day',
  month: 'vs. previous week',
  year: 'vs. previous month',
};

const rangeFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** "Oct 1, 2026 – Oct 30, 2026" — the window the chart covers (matches useEarnings' buckets). */
function rangeLabel(period: EarningsPeriod): string {
  const now = new Date();
  const from =
    period === 'week'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
      : period === 'month'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 27)
        : new Date(now.getFullYear(), now.getMonth() - 11, 1);
  return `${rangeFmt.format(from)} – ${rangeFmt.format(now)}`;
}

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

  const up = (series.trendPct ?? 0) >= 0;

  return (
    <ModernCard
      icon={<BarChart3 size={22} aria-hidden="true" />}
      title="Earnings"
      action={
        <div className={styles.segment} role="tablist" aria-label="Earnings period">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={period === p.id}
              className={`${styles.segmentBtn} ${period === p.id ? styles.segmentBtnActive : ''}`}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      }
    >
      {isLoading ? (
        <Skeleton height={190} radius="var(--m-radius-box)" />
      ) : (
        <>
          <p className={styles.range}>{rangeLabel(period)}</p>
          <span className={styles.totalValue}>{money(series.total, series.currency)}</span>
          {series.trendPct !== null && (
            <div className={styles.trendRow}>
              <span className={`${styles.trend} ${up ? styles.trendUp : styles.trendDown}`}>
                {up ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />}
                {up ? '+' : '−'}
                {Math.abs(series.trendPct)}%
              </span>
              <span className={styles.trendLabel}>{COMPARE_LABEL[period]}</span>
            </div>
          )}

          {/* Always show the chart, even at a flat zero — the day/week/month
              labels on it already say "no revenue in this period" on their
              own; a quiet period isn't the same as "never had any data". */}
          <div className={styles.chartWrap}>
            <TrendChart
              data={series.points}
              height={190}
              highlightLast
              formatValue={(v) => money(v, series.currency)}
              formatAxis={(v) => compact(v, series.currency)}
            />
          </div>
          {series.isEmpty && <p className={styles.emptyNote}>No earnings yet for this period.</p>}
        </>
      )}
    </ModernCard>
  );
}
