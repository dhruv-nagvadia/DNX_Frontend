export interface TrendChartDatum {
  label: string;
  value: number;
}

export interface TrendChartProps {
  data: TrendChartDatum[];
  /** Formats a value for the hover tooltip. Defaults to the raw number. */
  formatValue?: (value: number) => string;
  /** Formats the y-axis tick labels (keep it short, e.g. "₹1.2K"). Falls back to formatValue. */
  formatAxis?: (value: number) => string;
  /** Chart height in pixels. Defaults to 200. */
  height?: number;
  /** Emphasise the final point (the current period) with a larger, always-visible marker. */
  highlightLast?: boolean;
}
