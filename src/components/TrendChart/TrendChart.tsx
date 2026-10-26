import { useId } from 'react';
import { TrendChartProps } from './types';
import styles from './TrendChart.module.css';

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
 * Lightweight, dependency-free area/line chart (pure HTML/SVG) for a single
 * series over time — the default form for a trend, rather than a bar per
 * period. A y-axis, gridlines and a rounded scale frame it; a crosshair +
 * tooltip surface exact values on hover, and the current period gets an
 * always-visible marker.
 *
 * Each data point gets an equal-width flex column (same mechanism the
 * previous bar chart used), and the SVG line's x coordinates are placed at
 * each column's own center (`(i + 0.5) / n`) — so the line can never drift
 * out of step with the columns it's drawn over, regardless of container size.
 */
export function TrendChart({ data, formatValue, formatAxis, height = 200, highlightLast }: TrendChartProps) {
  const gradientId = useId();
  const fmt = formatValue ?? ((v: number) => String(v));
  const fmtAxis = formatAxis ?? fmt;

  const max = Math.max(0, ...data.map((d) => d.value));
  const step = niceStep(max / TICK_COUNT);
  const top = step * TICK_COUNT;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => step * (TICK_COUNT - i));

  const n = data.length;
  const points = data.map((d, i) => ({
    x: ((i + 0.5) / n) * 100,
    y: top > 0 ? 100 - (d.value / top) * 100 : 100,
  }));

  const linePath = points.length > 1 ? `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}` : '';
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`
      : '';

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

        {points.length > 1 && (
          <svg className={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 0.22 }} />
                <stop offset="100%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
            <path
              d={linePath}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        <div className={styles.cols}>
          {data.map((d, i) => {
            const isLast = Boolean(highlightLast) && i === data.length - 1;
            return (
              <div className={styles.col} key={`${d.label}-${i}`} title={`${d.label}: ${fmt(d.value)}`}>
                <span className={styles.tooltip} role="tooltip">
                  <span className={styles.tipLabel}>{d.label}</span>
                  <span className={styles.tipValue}>{fmt(d.value)}</span>
                </span>
                <span className={styles.crosshair} aria-hidden="true" />
                <span
                  className={`${styles.dot} ${isLast ? styles.dotActive : ''}`}
                  style={{ bottom: `${100 - points[i].y}%` }}
                  aria-hidden="true"
                />
              </div>
            );
          })}
        </div>

        <div className={styles.labels}>
          {data.map((d, i) => (
            <span className={styles.label} key={`${d.label}-${i}`}>
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
