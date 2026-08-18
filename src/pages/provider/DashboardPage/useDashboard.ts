import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  useGetAllMyBookingsQuery,
  useGetMyBusinessesQuery,
} from '@/redux/api/provider/providerApi';
import { useAppSelector } from '@/redux/hooks';
import { DashboardBooking } from '@/redux/api/provider/types';

/** Amount still owed on a booking (0 if fully paid). */
const outstanding = (b: DashboardBooking) => b.amountMinor - (b.amountPaidMinor ?? 0);

/** A cash / partial booking whose balance the provider still needs to collect. */
const needsCollection = (b: DashboardBooking) =>
  b.status !== 'CANCELLED' &&
  (b.paymentMethod === 'CASH' || b.paymentMethod === 'PARTIAL') &&
  b.paymentStatus !== 'PAID' &&
  b.paymentStatus !== 'REFUNDED' &&
  outstanding(b) > 0;

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

    // Rough monthly revenue: amount actually paid on bookings scheduled this month.
    const collectedThisMonth = bookings
      .filter((b) => new Date(b.startTime).getTime() >= monthStart.getTime())
      .reduce((sum, b) => sum + (b.amountPaidMinor ?? 0), 0);

    return {
      todays,
      upcomingCount,
      attention,
      collectedThisMonth,
      currency: bookings[0]?.currency ?? 'INR',
    };
  }, [bookings]);

  return {
    fullName,
    businesses,
    isLoading: bizLoading || bookingsLoading,
    hasBusinesses: businesses.length > 0,
    ...derived,
    goToBusiness: (id: string) => navigate(`/businesses/${id}`),
    addBusiness: () => navigate('/businesses/new'),
    viewBusinesses: () => navigate('/businesses'),
  };
}
