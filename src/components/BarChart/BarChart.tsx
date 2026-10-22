import { BarChartProps } from './types';
import styles from './BarChart.module.css';

const TICK_COUNT = 4; // gridlines above zero

/** Rounds a step up to 1 / 2 / 2.5 / 5 / 10 × a power of ten so axis labels read cleanly. */
function niceStep(raw: number): number {
  if (raw <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * pow;
}

/**
 * Lightweight, dependency-free bar chart (pure HTML/CSS) with a y-axis,
 * gridlines and a rounded scale. Bars grow in on mount with a small stagger;
 * exact values surface on hover.
 */
export function BarChart({
  data,
  formatValue,
  formatAxis,
  height = 200,
  highlightLast,
}: BarChartProps) {
  const fmt = formatValue ?? ((v: number) => String(v));
  const fmtAxis = formatAxis ?? fmt;

  const max = Math.max(0, ...data.map((d) => d.value));
  const step = niceStep(max / TICK_COUNT);
  const top = step * TICK_COUNT;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => step * (TICK_COUNT - i));

  return (
    <div className={styles.chart} style={{ height }}>
      <div className={styles.axis} aria-hidden="true">
        {ticks.map((t) => (
          <span key={t} className={styles.tick}>
            {fmtAxis(t)}
          </span>
        ))}
      </div>

      <div className={styles.plot}>
        <div className={styles.grid} aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className={styles.gridLine} />
          ))}
        </div>

        <div className={styles.cols}>
          {data.map((d, i) => {
            const pct = d.value > 0 ? Math.max(3, (d.value / top) * 100) : 0;
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
                    style={{ height: `${pct}%`, animationDelay: `${i * 40}ms` }}
                    title={`${d.label}: ${fmt(d.value)}`}
                  />
                </div>
                <span className={styles.label}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
