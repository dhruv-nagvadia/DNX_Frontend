export interface TopItem {
  name: string;
  revenueMinor: number;
  /** Bookings for a service, or times ordered for a product. */
  count: number;
}

export interface TopSellersData {
  items: TopItem[];
  currency: string;
  /** The single weekday with the most activity (by count), if any. */
  busiestDay: string | null;
  /** Average bookings/orders on that weekday (per date that had any). */
  busiestAvg: number | null;
  itemLabel: 'service' | 'product';
}
