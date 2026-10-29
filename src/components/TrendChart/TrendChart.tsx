import { useId } from 'react';
import { TrendChartProps, TrendSeries } from './types';
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
 * Lightweight, dependency-free area/line chart (pure HTML/SVG) for one or
 * more series over time — the default form for a trend, rather than a bar
 * per period. A y-axis, gridlines and a rounded scale frame it; a crosshair
 * + tooltip surface exact values on hover, and the current period gets an
 * always-visible marker.
 *
 * Each data point gets an equal-width flex column (same mechanism a bar
 * chart would use), and each SVG line's x coordinates sit at its own
 * column's center (`(i + 0.5) / n`) — so a line can never drift out of step
 * with the columns it's drawn over, regardless of container size.
 *
 * Pass `data` for a single, unlabelled line (the common case — e.g. a
 * provider's earnings), or `series` for two or more labelled, differently
 * colored lines sharing one scale (e.g. admin "new customers vs. new
 * providers").
 */
export function TrendChart({ data, series, formatValue, formatAxis, height = 200, highlightLast }: TrendChartProps) {
  const baseId = useId();
  const fmt = formatValue ?? ((v: number) => String(v));
  const fmtAxis = formatAxis ?? fmt;

  const allSeries: TrendSeries[] = series ?? (data ? [{ id: 'default', color: 'var(--color-primary)', data }] : []);
  const labels = allSeries[0]?.data.map((d) => d.label) ?? [];
  const n = labels.length;

  const max = Math.max(0, ...allSeries.flatMap((s) => s.data.map((d) => d.value)));
  const step = niceStep(max / TICK_COUNT);
  const top = step * TICK_COUNT;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => step * (TICK_COUNT - i));

  const seriesPoints = allSeries.map((s) =>
    s.data.map((d, i) => ({
      x: ((i + 0.5) / n) * 100,
      y: top > 0 ? 100 - (d.value / top) * 100 : 100,
    })),
  );

  const pathsFor = (points: { x: number; y: number }[]) => {
    const linePath = points.length > 1 ? `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}` : '';
    const areaPath =
      points.length > 1
        ? `${linePath} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`
        : '';
    return { linePath, areaPath };
  };

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

        {n > 1 && (
          <svg className={styles.svg} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              {allSeries.map((s, si) => (
                <linearGradient key={s.id} id={`${baseId}-${si}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: s.color, stopOpacity: 0.22 }} />
                  <stop offset="100%" style={{ stopColor: s.color, stopOpacity: 0 }} />
                </linearGradient>
              ))}
            </defs>
            {allSeries.map((s, si) => {
              const { linePath, areaPath } = pathsFor(seriesPoints[si]);
              return (
                <g key={s.id}>
                  <path d={areaPath} fill={`url(#${baseId}-${si})`} stroke="none" />
                  <path
                    d={linePath}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              );
            })}
          </svg>
        )}

        <div className={styles.cols}>
          {labels.map((label, i) => {
            const isLast = Boolean(highlightLast) && i === n - 1;
            const heading = allSeries[0]?.data[i]?.fullLabel ?? label;
            return (
              <div
                className={styles.col}
                key={`${label}-${i}`}
                title={`${heading}: ${allSeries
                  .map((s) => `${s.label ? `${s.label} ` : ''}${fmt(s.data[i]?.value ?? 0)}`)
                  .join(' · ')}`}
              >
                <span className={styles.tooltip} role="tooltip">
                  <span className={styles.tipLabel}>{heading}</span>
                  {allSeries.map((s) => (
                    <span className={styles.tipRow} key={s.id}>
                      {s.label && (
                        <span className={styles.tipDot} style={{ background: s.color }} aria-hidden="true" />
                      )}
                      {s.label && <span className={styles.tipSeriesLabel}>{s.label}</span>}
                      <span className={styles.tipValue}>{fmt(s.data[i]?.value ?? 0)}</span>
                    </span>
                  ))}
                </span>
                <span className={styles.crosshair} aria-hidden="true" />
                {allSeries.map((s, si) => (
                  <span
                    key={s.id}
                    className={`${styles.dot} ${isLast ? styles.dotActive : ''}`}
                    style={{
                      bottom: `${100 - seriesPoints[si][i].y}%`,
                      background: s.color,
                      ...(isLast
                        ? { boxShadow: `0 0 0 4px color-mix(in srgb, ${s.color} 30%, transparent), var(--shadow-sm)` }
                        : {}),
                    }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            );
          })}
        </div>

        <div className={styles.labels}>
          {labels.map((label, i) => (
            <span className={styles.label} key={`${label}-${i}`}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
