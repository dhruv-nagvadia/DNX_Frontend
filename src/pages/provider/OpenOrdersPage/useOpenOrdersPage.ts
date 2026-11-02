import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useGetMyOrdersQuery } from '@/redux/api/provider/providerApi';
import { ProviderOrder } from '@/redux/api/provider/types';

/** An order still working through fulfilment (not completed or cancelled). */
const isOpenOrder = (o: ProviderOrder) =>
  o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'READY';

/** The full "Orders to Fulfil" list — same derivation as the Dashboard's
 * preview, just unsliced and on its own page. */
export function useOpenOrdersPage() {
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = useGetMyOrdersQuery();

  const openOrders = useMemo(
    () =>
      orders
        .filter(isOpenOrder)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders],
  );

  return {
    isLoading,
    openOrders,
    currency: orders[0]?.currency ?? 'INR',
    goToBusinessOrders: (id: string) => navigate(`/businesses/${id}`, { state: { tab: 'bookings' } }),
  };
}
