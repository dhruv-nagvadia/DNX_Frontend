import { useState } from 'react';
import styles from './GrowthChart.module.css';

interface GrowthChartProps {
  labels: string[]; // ISO dates, e.g. "2026-09-29"
  customers: number[];
  providers: number[];
}

const dayFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });

/** A simple grouped-bar chart: new customers vs. new providers, per day. */
export function GrowthChart({ labels, customers, providers }: GrowthChartProps) {
  const max = Math.max(1, ...customers, ...providers);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.dotCustomers}`} aria-hidden="true" />
          New customers (app)
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.dot} ${styles.dotProviders}`} aria-hidden="true" />
          New providers (web)
        </span>
      </div>

      <div className={styles.chart} role="img" aria-label="Daily new customers and providers, last 14 days">
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
                  <div className={styles.tooltipDate}>{dayFmt.format(new Date(label))}</div>
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
              <span className={styles.axisLabel}>{dayFmt.format(new Date(label))}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
