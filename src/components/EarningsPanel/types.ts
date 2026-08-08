export type EarningsPeriod = 'week' | 'month' | 'year';

export interface EarningsPoint {
  label: string;
  /** Value in major currency units (e.g. rupees). */
  value: number;
}

export interface EarningsSeries {
  points: EarningsPoint[];
  /** Sum across the selected period, in major units. */
  total: number;
  /** % change of the latest bucket vs the previous one; null if not comparable. */
  trendPct: number | null;
  currency: string;
  /** True when showing generated sample data (no real earnings yet). */
  isSample: boolean;
}
