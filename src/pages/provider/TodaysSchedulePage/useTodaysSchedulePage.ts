import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useGetAllMyBookingsQuery } from '@/redux/api/provider/providerApi';

/** The full "Today's Schedule" list — same derivation as the Dashboard's
 * preview, just unsliced and on its own page. */
export function useTodaysSchedulePage() {
  const navigate = useNavigate();
  const { data: bookings = [], isLoading } = useGetAllMyBookingsQuery();

  const todays = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    return bookings
      .filter((b) => b.status !== 'CANCELLED')
      .filter((b) => {
        const t = new Date(b.startTime).getTime();
        return t >= todayStart.getTime() && t < todayEnd.getTime();
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [bookings]);

  return {
    isLoading,
    todays,
    goToBusiness: (id: string) => navigate(`/businesses/${id}`),
  };
}
