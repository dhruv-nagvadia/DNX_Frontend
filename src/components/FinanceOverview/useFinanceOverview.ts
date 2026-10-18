import { useState } from 'react';
import { useGetFinanceOverviewQuery } from '@/redux/api/admin/adminApi';
import { FinanceGroupBy } from '@/redux/api/admin/types';
import { RangePreset, rangeFor } from '@/utils/dateRange';

const dayFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const monthFmt = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' });

/** "2026-10-18" → "18 Oct", "2026-10" → "Oct 2026". Parsed at noon so the timezone can't shift the day. */
export function bucketLabel(key: string): string {
  if (key.length === 7) return monthFmt.format(new Date(`${key}-15T12:00:00`));
  return dayFmt.format(new Date(`${key}T12:00:00`));
}

/** Platform money over a chosen period, grouped by day or month. */
export function useFinanceOverview() {
  const [preset, setPreset] = useState<RangePreset>('30d');
  // "All time" is far too many days to read, so it defaults to months.
  const [groupOverride, setGroupOverride] = useState<FinanceGroupBy | null>(null);
  const groupBy: FinanceGroupBy = groupOverride ?? (preset === 'all' ? 'month' : 'day');

  const { data, isLoading, isFetching } = useGetFinanceOverviewQuery(
    { ...rangeFor(preset), groupBy },
    // Money screens should never show a stale figure when the admin comes back to them.
    { refetchOnMountOrArgChange: true },
  );

  return {
    data,
    isLoading,
    isFetching,
    preset,
    onPreset: (p: RangePreset) => {
      setPreset(p);
      setGroupOverride(null);
    },
    groupBy,
    onGroupBy: setGroupOverride,
  };
}
