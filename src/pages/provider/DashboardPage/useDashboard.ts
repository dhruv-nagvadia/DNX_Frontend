import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  useGetAllMyBookingsQuery,
  useGetMyBusinessesQuery,
  useGetMyOrdersQuery,
} from '@/redux/api/provider/providerApi';
import { useAppSelector } from '@/redux/hooks';
import { DashboardBooking, Product, ProviderOrder } from '@/redux/api/provider/types';
import { StockLevel, stockLevel } from '@/utils/units';

/** A product running low or out, tagged with the business it belongs to. */
export interface LowStockItem {
  product: Product;
  businessId: string;
  businessName: string;
  level: StockLevel;
}

/** Amount still owed on a booking (0 if fully paid). */
const outstanding = (b: DashboardBooking) => b.amountMinor - (b.amountPaidMinor ?? 0);

/** A cash / partial booking whose balance the provider still needs to collect. */
const needsCollection = (b: DashboardBooking) =>
  b.status !== 'CANCELLED' &&
  (b.paymentMethod === 'CASH' || b.paymentMethod === 'PARTIAL') &&
  b.paymentStatus !== 'PAID' &&
  b.paymentStatus !== 'REFUNDED' &&
  outstanding(b) > 0;

/** Amount still owed on an order (0 if fully paid). */
export const orderOutstanding = (o: ProviderOrder) => o.amountMinor - (o.amountPaidMinor ?? 0);

/** A cash / partial order whose balance the provider still needs to collect. */
export const orderNeedsCollection = (o: ProviderOrder) =>
  o.status !== 'CANCELLED' &&
  (o.paymentMethod === 'CASH' || o.paymentMethod === 'PARTIAL') &&
  o.paymentStatus !== 'PAID' &&
  o.paymentStatus !== 'REFUNDED' &&
  orderOutstanding(o) > 0;

/** An order still working through fulfilment (not completed or cancelled). */
const isOpenOrder = (o: ProviderOrder) =>
  o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'READY';

/** One booking that needs the provider to do something. */
export interface AttentionItem {
  booking: DashboardBooking;
  confirm: boolean; // still PENDING → needs confirming
  collect: boolean; // cash/partial balance to collect
  due: number; // outstanding amount (minor units)
}

/** Loads businesses + all bookings and derives the home dashboard figures. */
export function useDashboard() {
  const navigate = useNavigate();
  const fullName = useAppSelector((s) => s.user.currentUser?.fullName ?? '');

  const { data: businesses = [], isLoading: bizLoading } = useGetMyBusinessesQuery();
  const { data: bookings = [], isLoading: bookingsLoading } = useGetAllMyBookingsQuery();
  const { data: orders = [], isLoading: ordersLoading } = useGetMyOrdersQuery();

  const derived = useMemo(() => {
    const now = Date.now();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const active = bookings.filter((b) => b.status !== 'CANCELLED');

    const todays = active
      .filter((b) => {
        const t = new Date(b.startTime).getTime();
        return t >= todayStart.getTime() && t < todayEnd.getTime();
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const upcomingCount = active.filter((b) => new Date(b.endTime).getTime() >= now).length;

    const attention: AttentionItem[] = active
      .map((b) => ({
        booking: b,
        confirm: b.status === 'PENDING',
        collect: needsCollection(b),
        due: outstanding(b),
      }))
      .filter((i) => i.confirm || i.collect)
      .sort(
        (a, b) =>
          new Date(a.booking.startTime).getTime() - new Date(b.booking.startTime).getTime(),
      );

    // ── Store orders ─────────────────────────────────────────────────────────
    // Orders still to fulfil, oldest first (longest-waiting customer on top).
    const openOrders = orders
      .filter(isOpenOrder)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Orders that need the provider to act: confirm a new one or collect cash.
    const orderAttentionCount = orders.filter(
      (o) => o.status === 'PENDING' || orderNeedsCollection(o),
    ).length;

    // Amount actually paid on bookings + orders in the current month.
    const bookingRevenue = bookings
      .filter((b) => new Date(b.startTime).getTime() >= monthStart.getTime())
      .reduce((sum, b) => sum + (b.amountPaidMinor ?? 0), 0);
    const orderRevenue = orders
      .filter((o) => new Date(o.createdAt).getTime() >= monthStart.getTime())
      .reduce((sum, o) => sum + (o.amountPaidMinor ?? 0), 0);

    return {
      todays,
      upcomingCount,
      attention,
      openOrders,
      openOrdersCount: openOrders.length,
      needsActionCount: attention.length + orderAttentionCount,
      collectedThisMonth: bookingRevenue + orderRevenue,
      currency: bookings[0]?.currency ?? orders[0]?.currency ?? 'INR',
    };
  }, [bookings, orders]);

  // Active products across all stores that are out or running low, worst first.
  const lowStock = useMemo(() => {
    const items: LowStockItem[] = [];
    for (const b of businesses) {
      for (const p of b.products ?? []) {
        if (p.isActive === false) continue;
        const level = stockLevel(p.stockQty, p.stepQty);
        if (level !== 'ok') {
          items.push({ product: p, businessId: b.id, businessName: b.businessName, level });
        }
      }
    }
    return items.sort((a, b) => {
      if (a.level !== b.level) return a.level === 'out' ? -1 : 1;
      return a.product.stockQty - b.product.stockQty;
    });
  }, [businesses]);

  const hasService = businesses.some((b) => (b.type ?? 'SERVICE') === 'SERVICE');
  const hasStore = businesses.some((b) => b.type === 'STORE') || orders.length > 0;

  return {
    fullName,
    businesses,
    isLoading: bizLoading || bookingsLoading || ordersLoading,
    hasBusinesses: businesses.length > 0,
    hasService,
    hasStore,
    lowStock,
    ...derived,
    goToBusiness: (id: string) => navigate(`/businesses/${id}`),
    goToBusinessOrders: (id: string) => navigate(`/businesses/${id}`, { state: { tab: 'bookings' } }),
    goToBusinessProducts: (id: string) =>
      navigate(`/businesses/${id}`, { state: { tab: 'products' } }),
    addBusiness: () => navigate('/businesses/new'),
    viewBusinesses: () => navigate('/businesses'),
  };
}
