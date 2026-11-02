import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useGetAllMyBookingsQuery } from '@/redux/api/provider/providerApi';
import { DashboardBooking } from '@/redux/api/provider/types';

/** One booking that needs the provider to do something. */
export interface AttentionItem {
  booking: DashboardBooking;
  confirm: boolean; // still PENDING → needs confirming
  collect: boolean; // cash/partial balance to collect
  due: number; // outstanding amount (minor units)
}

const outstanding = (b: DashboardBooking) => b.amountMinor - (b.amountPaidMinor ?? 0);
const needsCollection = (b: DashboardBooking) =>
  b.status !== 'CANCELLED' &&
  (b.paymentMethod === 'CASH' || b.paymentMethod === 'PARTIAL') &&
  b.paymentStatus !== 'PAID' &&
  b.paymentStatus !== 'REFUNDED' &&
  outstanding(b) > 0;

/** The full "Needs Your Attention" list — same derivation as the Dashboard's
 * preview, just unsliced and on its own page. */
export function useAttentionPage() {
  const navigate = useNavigate();
  const { data: bookings = [], isLoading } = useGetAllMyBookingsQuery();

  const attention = useMemo(() => {
    const active = bookings.filter((b) => b.status !== 'CANCELLED');
    const items: AttentionItem[] = active
      .map((b) => ({
        booking: b,
        confirm: b.status === 'PENDING',
        collect: needsCollection(b),
        due: outstanding(b),
      }))
      .filter((i) => i.confirm || i.collect)
      .sort((a, b) => new Date(a.booking.startTime).getTime() - new Date(b.booking.startTime).getTime());
    return items;
  }, [bookings]);

  return {
    isLoading,
    attention,
    currency: bookings[0]?.currency ?? 'INR',
    goToBusiness: (id: string) => navigate(`/businesses/${id}`),
  };
}
