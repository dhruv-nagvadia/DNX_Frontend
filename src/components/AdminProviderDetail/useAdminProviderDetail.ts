import { useState } from 'react';
import {
  useBlockBusinessMutation,
  useBlockProviderAccountMutation,
  useDisableBusinessCodMutation,
  useEnableBusinessCodMutation,
  useGetAdminProviderDetailQuery,
  useUnblockBusinessMutation,
  useUnblockProviderAccountMutation,
} from '@/redux/api/admin/adminApi';
import { AdminProviderBusiness } from '@/redux/api/admin/types';

const serverMessage = (err: unknown, fallback: string) =>
  (err as { data?: { message?: string } })?.data?.message ?? fallback;

/** An action that needs a (optional) reason before it's applied. */
export type ReasonAction =
  | { kind: 'BLOCK_ACCOUNT' }
  | { kind: 'BLOCK_BUSINESS'; business: AdminProviderBusiness }
  | { kind: 'COD_OFF'; business: AdminProviderBusiness };

/** Everything the admin "provider detail" screen needs: account/business blocks and COD. */
export function useAdminProviderDetail(userId: string) {
  const { data, isLoading } = useGetAdminProviderDetailQuery(userId, {
    refetchOnMountOrArgChange: true,
  });
  const [blockAccount] = useBlockProviderAccountMutation();
  const [unblockAccount] = useUnblockProviderAccountMutation();
  const [blockBusiness] = useBlockBusinessMutation();
  const [unblockBusiness] = useUnblockBusinessMutation();
  const [disableCod] = useDisableBusinessCodMutation();
  const [enableCod] = useEnableBusinessCodMutation();

  // The action waiting on a reason, and the reason typed so far.
  const [action, setAction] = useState<ReasonAction | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  // What's currently being applied — account, or a business id — so only that button spins.
  const [busy, setBusy] = useState<string | null>(null);

  const open = (a: ReasonAction) => {
    setAction(a);
    setReason('');
    setError(null);
  };
  const close = () => setAction(null);

  const confirm = async () => {
    if (!action) return;
    const text = reason.trim() || undefined;
    setBusy('modal');
    setError(null);
    try {
      if (action.kind === 'BLOCK_ACCOUNT') await blockAccount({ userId, reason: text }).unwrap();
      else if (action.kind === 'BLOCK_BUSINESS') {
        await blockBusiness({ businessId: action.business.id, reason: text }).unwrap();
      } else await disableCod({ businessId: action.business.id, reason: text }).unwrap();
      setAction(null);
    } catch (err) {
      setError(serverMessage(err, 'That did not go through. Please try again.'));
    } finally {
      setBusy(null);
    }
  };

  /** Actions that need no reason: just apply them. */
  const run = (key: string, fn: () => Promise<unknown>) => async () => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(serverMessage(err, 'That did not go through. Please try again.'));
    } finally {
      setBusy(null);
    }
  };

  return {
    data,
    isLoading,
    action,
    reason,
    setReason,
    error,
    busy,
    open,
    close,
    confirm,
    unblockAccount: run('account', () => unblockAccount(userId).unwrap()),
    unblockBusiness: (id: string) => run(id, () => unblockBusiness(id).unwrap()),
    enableCod: (id: string) => run(`cod-${id}`, () => enableCod(id).unwrap()),
  };
}
