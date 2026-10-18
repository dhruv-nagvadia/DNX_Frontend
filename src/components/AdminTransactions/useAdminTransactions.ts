import { useSearchParams } from 'react-router-dom';
import {
  useGetFinanceBalancesQuery,
  useGetFinanceBreakdownQuery,
  useGetFinanceBusinessesQuery,
  useGetFinanceServicesQuery,
  useGetFinanceTransactionsQuery,
} from '@/redux/api/admin/adminApi';
import {
  FinanceFilterParams,
  PaymentMethod,
  TransactionKind,
  TransactionStatusFilter,
} from '@/redux/api/admin/types';
import { RANGE_PRESETS, RangePreset, rangeFor } from '@/utils/dateRange';

export type TransactionTab = 'all' | 'business' | 'service';

const PAGE_SIZE = 25;
const METHODS: PaymentMethod[] = ['ONLINE', 'CASH', 'PARTIAL'];
const KINDS: TransactionKind[] = ['BOOKING', 'ORDER'];
const STATUSES: TransactionStatusFilter[] = [
  'OPEN',
  'PENDING',
  'CONFIRMED',
  'READY',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];
const TABS: TransactionTab[] = ['all', 'business', 'service'];

/** Keeps the value only if it's one of the allowed choices (a hand-edited URL must not reach the API as garbage). */
function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

/**
 * Filters live in the URL, so a drill-down ("this business", "this provider's
 * sales") can be linked to, survives a refresh, and works with the back button.
 */
export function useAdminTransactions() {
  const [params, setParams] = useSearchParams();

  const preset = (oneOf(
    params.get('range'),
    RANGE_PRESETS.map((p) => p.id),
  ) ?? '30d') as RangePreset;
  const tab = oneOf(params.get('tab'), TABS) ?? 'all';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const businessId = params.get('businessId') ?? '';
  const serviceId = params.get('serviceId') ?? '';
  const ownerId = params.get('ownerId') ?? '';
  const method = oneOf(params.get('method'), METHODS);
  const kind = oneOf(params.get('kind'), KINDS);
  const status = oneOf(params.get('status'), STATUSES);
  const search = params.get('q') ?? '';

  /** Changes some filters at once. Anything but the page itself sends you back to page 1. */
  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };

  const filters: FinanceFilterParams = {
    ...rangeFor(preset),
    businessId: businessId || undefined,
    serviceId: serviceId || undefined,
    ownerId: ownerId || undefined,
    method,
    kind,
    status,
    search: search.trim() || undefined,
  };

  // Money screens should never show a stale figure when the admin comes back to them.
  const fresh = { refetchOnMountOrArgChange: true } as const;

  const transactions = useGetFinanceTransactionsQuery(
    { ...filters, page, limit: PAGE_SIZE },
    fresh,
  );
  const breakdown = useGetFinanceBreakdownQuery(
    { ...filters, by: tab === 'service' ? 'service' : 'business' },
    { ...fresh, skip: tab === 'all' },
  );
  // The service dropdown lists every service — or just the chosen business's.
  const services = useGetFinanceServicesQuery({ businessId: businessId || undefined });
  const businesses = useGetFinanceBusinessesQuery();
  const balances = useGetFinanceBalancesQuery();

  const hasFilters = !!(businessId || serviceId || ownerId || method || kind || status || search);

  return {
    preset,
    tab,
    page,
    pageSize: PAGE_SIZE,
    businessId,
    serviceId,
    ownerId,
    ownerName: balances.data?.find((b) => b.userId === ownerId)?.name,
    method: method ?? '',
    kind: kind ?? '',
    status: status ?? '',
    search,
    hasFilters,
    data: transactions.data,
    isLoading: transactions.isLoading,
    breakdown: breakdown.data ?? [],
    breakdownLoading: breakdown.isLoading,
    businessOptions: businesses.data?.businesses ?? [],
    serviceOptions: services.data ?? [],
    // Picking a service needs no business first; the business just narrows the list.
    onPreset: (p: RangePreset) => update({ range: p }),
    onTab: (t: TransactionTab) => update({ tab: t === 'all' ? undefined : t }),
    onPage: (p: number) => update({ page: p > 1 ? String(p) : undefined }),
    onBusiness: (id: string) => update({ businessId: id || undefined, serviceId: undefined }),
    onService: (id: string) => update({ serviceId: id || undefined }),
    onMethod: (m: string) => update({ method: m || undefined }),
    onKind: (k: string) => update({ kind: k || undefined }),
    onStatus: (s: string) => update({ status: s || undefined }),
    onSearch: (q: string) => update({ q: q || undefined }),
    clearOwner: () => update({ ownerId: undefined }),
    clearAll: () =>
      update({
        businessId: undefined,
        serviceId: undefined,
        ownerId: undefined,
        method: undefined,
        kind: undefined,
        status: undefined,
        q: undefined,
      }),
    /** Drill into one business's transactions. */
    openBusiness: (id: string) => update({ businessId: id, serviceId: undefined, tab: undefined }),
    /** Drill into one service's transactions. */
    openService: (serviceId: string, businessId: string) =>
      update({ businessId, serviceId, tab: undefined }),
  };
}
