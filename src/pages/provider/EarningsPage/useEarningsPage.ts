import { useMemo, useState } from 'react';

import { useGetMyBusinessesQuery, useGetMyEarningsQuery } from '@/redux/api/provider/providerApi';
import { useAppSelector } from '@/redux/hooks';

import { EarningsPreset, previousRange, rangeForPreset } from './earningsRange';

/** The provider's earnings for a chosen period, optionally for just one of their businesses. */
export function useEarningsPage() {
  const [preset, setPreset] = useState<EarningsPreset>('month');
  const [businessId, setBusinessId] = useState('');
  const user = useAppSelector((s) => s.user.currentUser);

  const { data: businesses } = useGetMyBusinessesQuery();

  const range = useMemo(() => rangeForPreset(preset), [preset]);
  const prev = useMemo(() => previousRange(preset), [preset]);

  const { data, isLoading, isFetching, isError, refetch } = useGetMyEarningsQuery(
    { ...range, businessId: businessId || undefined },
    // Money screens should never show a stale figure when the provider comes back to them.
    { refetchOnMountOrArgChange: true },
  );

  // The same stretch one period back, for the "You earn" change.
  const { data: prevData } = useGetMyEarningsQuery(
    { ...(prev?.range ?? {}), businessId: businessId || undefined },
    { skip: !prev, refetchOnMountOrArgChange: true },
  );

  // Previous "You earn" — null when there's nothing to compare against.
  const prevNetMinor = prev && prevData ? prevData.summary.netMinor : null;

  return {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
    range,
    preset,
    onPreset: setPreset,
    businessId,
    onBusiness: setBusinessId,
    businesses: businesses ?? [],
    prevNetMinor,
    compareLabel: prev?.label ?? '',
    fullName: user?.fullName ?? '',
    avatarUrl: user?.avatarUrl ?? null,
  };
}
