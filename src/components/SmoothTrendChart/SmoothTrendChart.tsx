import { MouseEvent, useEffect, useId, useRef, useState } from 'react';

import styles from './SmoothTrendChart.module.css';

export interface SmoothTrendChartPoint {
  /** Short x-axis label. */
  label: string;
  /** Longer label for the tooltip / value bubble; falls back to `label`. */
  tooltipLabel?: string;
  /** Primary series value, in MINOR units (paise). */
  value: number;
  /** Optional secondary series value (dashed line), in MINOR units. */
  secondary?: number;
}

export interface SmoothTrendChartProps {
  points: SmoothTrendChartPoint[];
  /** Legend / tooltip name for `value`. */
  seriesLabel?: string;
  /** Legend / tooltip name for `secondary`. */
  secondaryLabel?: string;
  /** Draw the dashed secondary line + legend. Defaults to true when any point has `secondary`. */
  showSecondary?: boolean;
  height?: number;
  /** Caption overlaid on the chart when every value is 0. Omit for no caption. */
  emptyText?: string;
  ariaLabel?: string;
}

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Monotone cubic (Fritsch–Carlson) path — smooth without overshooting below zero. */
function smoothPath(pts: [number, number][]): string {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    m.push(dx === 0 ? 0 : (pts[i + 1][1] - pts[i][1]) / dx);
  }
  const t: number[] = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      t[i] = tau * a * m[i];
      t[i + 1] = tau * b * m[i];
    }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const h = (x1 - x0) / 3;
    d += ` C${x0 + h},${y0 + t[i] * h} ${x1 - h},${y1 - t[i + 1] * h} ${x1},${y1}`;
  }
  return d;
}

/** A round axis maximum and step (in rupees) for ~5 gridlines. */
function niceScale(maxRupees: number): { max: number; step: number } {
  if (maxRupees <= 0) return { max: 1000, step: 250 };
  const raw = maxRupees / 5;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  const step = nice * mag;
  return { max: Math.ceil(maxRupees / step) * step, step };
}

const PAD = { left: 64, right: 18, top: 16, bottom: 30 };

/**
 * Smooth-line + soft gradient area chart with a ₹ y-axis, sparse x labels,
 * the latest point highlighted with a value bubble, and a hover tooltip.
 * Optionally draws a dashed secondary series (e.g. commission).
 */
export function SmoothTrendChart({
  points,
  seriesLabel = 'You earn',
  secondaryLabel = 'Commission',
  showSecondary,
  height = 250,
  emptyText,
  ariaLabel,
}: SmoothTrendChartProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);
  const gradId = useId();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(260, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const withSecondary = showSecondary ?? points.some((p) => p.secondary !== undefined);
  const sec = (p: SmoothTrendChartPoint) => (withSecondary ? (p.secondary ?? 0) : 0);

  const n = points.length;
  const isEmpty = points.every((p) => p.value === 0 && sec(p) === 0);
  const maxRupees = Math.max(0, ...points.map((p) => Math.max(p.value, sec(p)) / 100));
  const { max, step } = niceScale(maxRupees);

  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const xAt = (i: number) => (n <= 1 ? PAD.left + plotW / 2 : PAD.left + (plotW * i) / (n - 1));
  const yAt = (minor: number) => PAD.top + plotH - (minor / 100 / max) * plotH;
  const baseY = PAD.top + plotH;

  const toPts = (get: (p: SmoothTrendChartPoint) => number): [number, number][] =>
    n === 1
      ? [
          [PAD.left, yAt(get(points[0]))],
          [PAD.left + plotW, yAt(get(points[0]))],
        ]
      : points.map((p, i) => [xAt(i), yAt(get(p))]);

  const mainPts = toPts((p) => p.value);
  const mainLine = smoothPath(mainPts);
  const area = mainPts.length
    ? `${mainLine} L${mainPts[mainPts.length - 1][0]},${baseY} L${mainPts[0][0]},${baseY} Z`
    : '';
  const secLine = withSecondary ? smoothPath(toPts(sec)) : '';

  const ticks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(v);

  // ~7 evenly spaced x labels, always including the first and last point.
  const labelEvery = Math.max(1, Math.ceil((n - 1) / Math.max(1, Math.floor(plotW / 90))));
  const xLabels: number[] = [];
  for (let i = 0; i < n; i += labelEvery) xLabels.push(i);
  if (n > 1 && xLabels[xLabels.length - 1] !== n - 1) {
    // Drop a label that would collide with the final one.
    if (n - 1 - xLabels[xLabels.length - 1] < labelEvery / 2) xLabels.pop();
    xLabels.push(n - 1);
  }

  const active = hover ?? (isEmpty ? null : n - 1);
  const activePoint = active !== null ? points[active] : null;
  const activeX = active !== null ? xAt(active) : 0;
  const activeY = activePoint ? yAt(activePoint.value) : 0;

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    if (n === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const i = n <= 1 ? 0 : Math.round(((x - PAD.left) / plotW) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  const total = points.reduce((s, p) => s + p.value, 0);
  const label =
    ariaLabel ??
    (isEmpty
      ? (emptyText ?? 'No data in this period')
      : `${seriesLabel}: ${rupees.format(total / 100)} across ${n} ${n === 1 ? 'point' : 'points'}`);

  return (
    <>
      <div className={styles.chartWrap} ref={wrapRef}>
        <svg
          className={styles.chartSvg}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={label}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className={styles.areaStopTop} />
              <stop offset="100%" className={styles.areaStopBottom} />
            </linearGradient>
          </defs>

          {ticks.map((v) => {
            const y = PAD.top + plotH - (v / max) * plotH;
            return (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + plotW}
                  y1={y}
                  y2={y}
                  className={v === 0 ? styles.axisLine : styles.gridLine}
                />
                <text x={PAD.left - 10} y={y} className={styles.yLabel}>
                  {rupees.format(v)}
                </text>
              </g>
            );
          })}

          {xLabels.map((i) => (
            <text key={i} x={xAt(i)} y={height - 8} className={styles.xLabel}>
              {points[i].label}
            </text>
          ))}

          <path d={area} fill={`url(#${gradId})`} />
          {withSecondary && <path d={secLine} className={styles.commLine} />}
          <path d={mainLine} className={styles.earnLine} />

          {activePoint && (
            <g>
              {hover !== null && (
                <line
                  x1={activeX}
                  x2={activeX}
                  y1={PAD.top}
                  y2={baseY}
                  className={styles.hoverLine}
                />
              )}
              <circle cx={activeX} cy={activeY} r={6} className={styles.pointHalo} />
              <circle cx={activeX} cy={activeY} r={4.5} className={styles.point} />
            </g>
          )}
        </svg>

        {activePoint && (
          <div
            className={styles.tooltip}
            style={{
              left: Math.min(Math.max(activeX, 70), width - 70),
              top: Math.max(activeY - 14, 0),
            }}
          >
            <strong>{activePoint.tooltipLabel ?? activePoint.label}</strong> •{' '}
            {rupees.format(activePoint.value / 100)}
            {hover !== null && withSecondary && sec(activePoint) > 0 && (
              <span className={styles.tooltipSub}>
                {secondaryLabel} {rupees.format(sec(activePoint) / 100)}
              </span>
            )}
          </div>
        )}

        {isEmpty && emptyText && <p className={styles.chartEmpty}>{emptyText}</p>}
      </div>

      {withSecondary && (
        <div className={styles.chartLegend}>
          <span>
            <span className={styles.legendDot} aria-hidden="true" />
            {seriesLabel}
          </span>
          <span>
            <span className={styles.legendDash} aria-hidden="true" />
            {secondaryLabel}
          </span>
        </div>
      )}
    </>
  );
}
