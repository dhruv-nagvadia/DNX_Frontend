export interface TrendChartDatum {
  label: string;
  value: number;
  /** Fuller text for the hover tooltip's heading, e.g. "18 October 2026" where
   * `label` is the short axis text "18 Oct". Falls back to `label`. */
  fullLabel?: string;
}

/** One line/area in a multi-series chart — its own color and data. */
export interface TrendSeries {
  id: string;
  /** Shown in the tooltip next to this series' value, and usable for a
   * legend above the chart. Omit for a single, unlabelled series. */
  label?: string;
  /** Any CSS color (a `var(--color-*)` token is typical). */
  color: string;
  data: TrendChartDatum[];
}

export interface TrendChartProps {
  /** Single-series shorthand — wrapped into one unlabelled series internally. */
  data?: TrendChartDatum[];
  /** Two or more series, each its own color — use instead of `data`. */
  series?: TrendSeries[];
  /** Formats a value for the hover tooltip. Defaults to the raw number. */
  formatValue?: (value: number) => string;
  /** Formats the y-axis tick labels (keep it short, e.g. "₹1.2K"). Falls back to formatValue. */
  formatAxis?: (value: number) => string;
  /** Chart height in pixels. Defaults to 200. */
  height?: number;
  /** Emphasise the final point (the current period) with a larger, always-visible marker. */
  highlightLast?: boolean;
}
