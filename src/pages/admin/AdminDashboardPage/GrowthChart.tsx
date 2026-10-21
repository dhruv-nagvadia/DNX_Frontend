import { useState } from 'react';
import type { GrowthGroupBy } from '@/redux/api/admin/types';
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

/** The short text under each bar. */
function axisLabel(label: string, groupBy: GrowthGroupBy): string {
  if (groupBy === 'day') return shortDay.format(dayDate(label));
  if (groupBy === 'month') return shortMonth.format(monthDate(label));
  return label;
}

/** The full text in the hover tooltip. */
function fullLabel(label: string, groupBy: GrowthGroupBy): string {
  if (groupBy === 'day') return longDay.format(dayDate(label));
  if (groupBy === 'month') return longMonth.format(monthDate(label));
  return label;
}

const PERIOD_WORD: Record<GrowthGroupBy, string> = { day: 'day', month: 'month', year: 'year' };

/** A simple grouped-bar chart: new customers vs. new providers, per day, month or year. */
export function GrowthChart({ groupBy, labels, customers, providers }: GrowthChartProps) {
  const max = Math.max(1, ...customers, ...providers);
  const [hovered, setHovered] = useState<number | null>(null);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

  return (
    <div>
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

      <div
        className={styles.chart}
        role="img"
        aria-label={`New customers and providers per ${PERIOD_WORD[groupBy]}`}
      >
        {labels.map((label, i) => {
          const c = customers[i] ?? 0;
          const p = providers[i] ?? 0;
          return (
            <div
              key={label}
              className={styles.column}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            >
              {hovered === i && (
                <div className={styles.tooltip} role="tooltip">
                  <div className={styles.tooltipDate}>{fullLabel(label, groupBy)}</div>
                  <div className={styles.tooltipRow}>
                    <span className={`${styles.dot} ${styles.dotCustomers}`} aria-hidden="true" />
                    {c} new customer{c === 1 ? '' : 's'}
                  </div>
                  <div className={styles.tooltipRow}>
                    <span className={`${styles.dot} ${styles.dotProviders}`} aria-hidden="true" />
                    {p} new provider{p === 1 ? '' : 's'}
                  </div>
                </div>
              )}
              <div className={styles.bars}>
                <div
                  className={`${styles.bar} ${styles.barCustomers}`}
                  style={{ height: `${(c / max) * 100}%` }}
                />
                <div
                  className={`${styles.bar} ${styles.barProviders}`}
                  style={{ height: `${(p / max) * 100}%` }}
                />
              </div>
              <span className={styles.axisLabel}>{axisLabel(label, groupBy)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
