export interface BarChartDatum {
  label: string;
  value: number;
}

export interface BarChartProps {
  data: BarChartDatum[];
  /** Formats a value for the hover tooltip. Defaults to the raw number. */
  formatValue?: (value: number) => string;
  /** Formats the y-axis tick labels (keep it short, e.g. "₹1.2K"). Falls back to formatValue. */
  formatAxis?: (value: number) => string;
  /** Chart height in pixels. Defaults to 200. */
  height?: number;
  /** Emphasise the final bar (the current period). */
  highlightLast?: boolean;
}
