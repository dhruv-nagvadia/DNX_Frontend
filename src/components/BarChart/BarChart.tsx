import { BarChartProps } from './types';
import styles from './BarChart.module.css';

/**
 * Lightweight, dependency-free bar chart (pure HTML/CSS). Bars grow in on
 * mount with a small stagger. Values surface on hover.
 */
export function BarChart({ data, formatValue, height = 200, highlightLast }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const fmt = formatValue ?? ((v: number) => String(v));

  return (
    <div className={styles.chart} style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.max(2, Math.round((d.value / max) * 100));
        const isLast = highlightLast && i === data.length - 1;
        return (
          <div className={styles.col} key={`${d.label}-${i}`}>
            <div className={styles.track}>
              <span className={styles.tooltip} role="tooltip">
                <span className={styles.tipLabel}>{d.label}</span>
                <span className={styles.tipValue}>{fmt(d.value)}</span>
              </span>
              <div
                className={`${styles.bar} ${isLast ? styles.barActive : ''}`}
                style={{ height: `${pct}%`, animationDelay: `${i * 45}ms` }}
                title={`${d.label}: ${fmt(d.value)}`}
              />
            </div>
            <span className={styles.label}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
