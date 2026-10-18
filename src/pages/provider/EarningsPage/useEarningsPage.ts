import { useState } from 'react';
import { useGetMyBusinessesQuery, useGetMyEarningsQuery } from '@/redux/api/provider/providerApi';
import { RangePreset, rangeFor } from '@/utils/dateRange';

/** The provider's earnings for a chosen period, optionally for just one of their businesses. */
export function useEarningsPage() {
  const [preset, setPreset] = useState<RangePreset>('month');
  const [businessId, setBusinessId] = useState('');

  const { data: businesses } = useGetMyBusinessesQuery();
  const { data, isLoading } = useGetMyEarningsQuery(
    { ...rangeFor(preset), businessId: businessId || undefined },
    // Money screens should never show a stale figure when the provider comes back to them.
    { refetchOnMountOrArgChange: true },
  );

  return {
    data,
    isLoading,
    preset,
    onPreset: setPreset,
    businessId,
    onBusiness: setBusinessId,
    businesses: businesses ?? [],
  };
}
