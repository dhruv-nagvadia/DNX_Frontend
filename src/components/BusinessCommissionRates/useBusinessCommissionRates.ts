import { useState } from 'react';
import {
  useGetFinanceBusinessesQuery,
  useSetBusinessCommissionMutation,
} from '@/redux/api/admin/adminApi';
import { bpsToPercentText, percentTextToBps } from '@/utils/money';

const MAX_COMMISSION_PERCENT = 50;

const serverMessage = (err: unknown, fallback: string) =>
  (err as { data?: { message?: string } })?.data?.message ?? fallback;

/** Per-business commission overrides (e.g. a launch offer for one shop). */
export function useBusinessCommissionRates() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const { data, isLoading, isFetching } = useGetFinanceBusinessesQuery(
    search ? { search } : undefined,
    { refetchOnMountOrArgChange: true },
  );
  const [setCommission, { isLoading: saving }] = useSetBusinessCommissionMutation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startEdit = (id: string, effectiveBps: number) => {
    setEditingId(id);
    setDraft(bpsToPercentText(effectiveBps));
    setError(null);
  };
  const cancel = () => {
    setEditingId(null);
    setError(null);
  };

  const save = async (businessId: string) => {
    const commissionBps = percentTextToBps(draft, MAX_COMMISSION_PERCENT);
    if (commissionBps === null) {
      setError(`Enter a percentage between 0 and ${MAX_COMMISSION_PERCENT}.`);
      return;
    }
    try {
      await setCommission({ businessId, commissionBps }).unwrap();
      setEditingId(null);
      setError(null);
    } catch (err) {
      setError(serverMessage(err, "Couldn't save that rate."));
    }
  };

  /** Clears the override so the business follows the platform default again. */
  const useDefault = async (businessId: string) => {
    try {
      await setCommission({ businessId, commissionBps: null }).unwrap();
      setEditingId(null);
    } catch (err) {
      setError(serverMessage(err, "Couldn't reset that rate."));
    }
  };

  return {
    businesses: data?.businesses ?? [],
    defaultCommissionBps: data?.defaultCommissionBps ?? null,
    isLoading,
    isFetching,
    query,
    onQuery: (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
    onSearch: (e: React.FormEvent) => {
      e.preventDefault();
      setSearch(query.trim());
    },
    editingId,
    draft,
    onDraft: (e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value),
    startEdit,
    cancel,
    save,
    useDefault,
    saving,
    error,
  };
}
