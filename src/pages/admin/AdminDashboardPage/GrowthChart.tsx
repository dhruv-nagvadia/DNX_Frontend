import type { GrowthGroupBy } from '@/redux/api/admin/types';
import { TrendChart } from '@/components/TrendChart';
import styles from './GrowthChart.module.css';

interface GrowthChartProps {
  groupBy: GrowthGroupBy;
  /** "2026-10-18" (day), "2026-10" (month) or "2026" (year). */
  labels: string[];
  customers: number[];
  providers: number[];
}

const shortDay = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const shortMonth = new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' });
const longMonth = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });
const longDay = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Parsed at noon so the viewer's timezone can never move it to a neighbouring day. */
const dayDate = (label: string) => new Date(`${label}T12:00:00`);
const monthDate = (label: string) => new Date(`${label}-15T12:00:00`);

/** The short text under each point. */
function axisLabel(label: string, groupBy: GrowthGroupBy): string {
  if (groupBy === 'day') return shortDay.format(dayDate(label));
  if (groupBy === 'month') return shortMonth.format(monthDate(label));
  return label;
}

/** The full text in the hover tooltip's heading. */
function fullLabel(label: string, groupBy: GrowthGroupBy): string {
  if (groupBy === 'day') return longDay.format(dayDate(label));
  if (groupBy === 'month') return longMonth.format(monthDate(label));
  return label;
}

const PERIOD_WORD: Record<GrowthGroupBy, string> = { day: 'day', month: 'month', year: 'year' };

/** New customers vs. new providers per day, month or year — the same trend-
 * line treatment as the provider's earnings chart, with one line per series. */
export function GrowthChart({ groupBy, labels, customers, providers }: GrowthChartProps) {
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

  const points = labels.map((label, i) => ({
    label: axisLabel(label, groupBy),
    fullLabel: fullLabel(label, groupBy),
    i,
  }));

  return (
    <div role="img" aria-label={`New customers and providers per ${PERIOD_WORD[groupBy]}`}>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.dotCustomers}`} aria-hidden="true" />
          New customers (app) · {sum(customers)}
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.dotProviders}`} aria-hidden="true" />
          New providers (web) · {sum(providers)}
        </span>
      </div>

      <TrendChart
        height={220}
        highlightLast
        formatValue={(v) => `${Math.round(v)}`}
        series={[
          {
            id: 'customers',
            label: 'New customers',
            color: 'var(--color-primary)',
            data: points.map((p) => ({ label: p.label, fullLabel: p.fullLabel, value: customers[p.i] ?? 0 })),
          },
          {
            id: 'providers',
            label: 'New providers',
            color: 'var(--color-accent)',
            data: points.map((p) => ({ label: p.label, fullLabel: p.fullLabel, value: providers[p.i] ?? 0 })),
          },
        ]}
      />
    </div>
  );
}
