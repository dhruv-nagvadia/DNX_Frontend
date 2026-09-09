import { useMemo } from 'react';

import {
  useGetBusinessBookingsQuery,
  useGetMyOrdersQuery,
} from '@/redux/api/provider/providerApi';
import { BusinessType, ProviderOrderItem } from '@/redux/api/provider/types';

import { TopItem, TopSellersData } from './types';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MAX_ITEMS = 5;

const lineTotal = (it: ProviderOrderItem) => Math.round((it.quantity / it.priceQty) * it.priceMinor);

/** Weekday label with the most activity, or null if there's nothing to rank. */
function busiestWeekday(dates: Date[]): string | null {
  if (dates.length === 0) return null;
  const counts = new Array(7).fill(0);
  for (const d of dates) counts[d.getDay()]++;
  const max = Math.max(...counts);
  if (max === 0) return null;
  return WEEKDAYS[counts.indexOf(max)];
}

/** Top services (by booking revenue) or top products (by order revenue) for one business. */
export function useTopSellers(providerId: string, businessType: BusinessType = 'SERVICE') {
  const isStore = businessType === 'STORE';
  const { data: bookings = [], isLoading: loadingBookings } = useGetBusinessBookingsQuery(
    providerId,
    { skip: isStore },
  );
  const { data: orders = [], isLoading: loadingOrders } = useGetMyOrdersQuery(undefined, {
    skip: !isStore,
  });
  const isLoading = isStore ? loadingOrders : loadingBookings;

  const data: TopSellersData = useMemo(() => {
    if (isStore) {
      const myOrders = orders.filter((o) => o.provider.id === providerId && o.status !== 'CANCELLED');
      const byProduct = new Map<string, TopItem>();
      for (const o of myOrders) {
        for (const it of o.items) {
          const cur = byProduct.get(it.name) ?? { name: it.name, revenueMinor: 0, count: 0 };
          cur.revenueMinor += lineTotal(it);
          cur.count += 1;
          byProduct.set(it.name, cur);
        }
      }
      const items = [...byProduct.values()].sort((a, b) => b.revenueMinor - a.revenueMinor).slice(0, MAX_ITEMS);
      return {
        items,
        currency: myOrders[0]?.currency ?? 'INR',
        busiestDay: busiestWeekday(myOrders.map((o) => new Date(o.createdAt))),
        itemLabel: 'product',
      };
    }

    const active = bookings.filter((b) => b.status !== 'CANCELLED');
    const byService = new Map<string, TopItem>();
    for (const b of active) {
      const cur = byService.get(b.service.name) ?? { name: b.service.name, revenueMinor: 0, count: 0 };
      cur.revenueMinor += b.amountMinor;
      cur.count += 1;
      byService.set(b.service.name, cur);
    }
    const items = [...byService.values()].sort((a, b) => b.revenueMinor - a.revenueMinor).slice(0, MAX_ITEMS);
    return {
      items,
      currency: active[0]?.currency ?? 'INR',
      busiestDay: busiestWeekday(active.map((b) => new Date(b.startTime))),
      itemLabel: 'service',
    };
  }, [isStore, orders, bookings, providerId]);

  return { data, isLoading };
}
