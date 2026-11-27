import { useState } from 'react';
import {
  useDeletePayoutMutation,
  useGetFinanceBalancesQuery,
  useGetPayoutsQuery,
  useRecordPayoutMutation,
} from '@/redux/api/admin/adminApi';
import { FinanceBalance, PayoutDirection } from '@/redux/api/admin/types';
import { minorToRupeesText, rupeesTextToMinor } from '@/utils/money';
import { useConfirm } from '@/components/ConfirmDialog';
import { apiErrorMessage } from '@/utils/apiError';

/** What each provider is owed (or owes), and recording the transfers that settle it. */
export function useProviderBalances() {
  const confirm = useConfirm();
  const { data: balances, isLoading } = useGetFinanceBalancesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: payouts } = useGetPayoutsQuery(undefined, { refetchOnMountOrArgChange: true });
  const [recordPayout, { isLoading: saving }] = useRecordPayoutMutation();
  const [deletePayout] = useDeletePayoutMutation();

  const [target, setTarget] = useState<FinanceBalance | null>(null);
  const [direction, setDirection] = useState<PayoutDirection>('TO_PROVIDER');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  /** Opens the form pre-filled with whatever settles the balance in full. */
  const open = (b: FinanceBalance) => {
    setTarget(b);
    setDirection(b.balanceMinor >= 0 ? 'TO_PROVIDER' : 'FROM_PROVIDER');
    setAmount(b.balanceMinor === 0 ? '' : minorToRupeesText(Math.abs(b.balanceMinor)));
    setMethod('UPI');
    setReference('');
    setNote('');
    setError(null);
  };
  const close = () => setTarget(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    const amountMinor = rupeesTextToMinor(amount);
    if (amountMinor === null || amountMinor <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    try {
      await recordPayout({
        userId: target.userId,
        direction,
        amountMinor,
        method: method.trim() || undefined,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      }).unwrap();
      setTarget(null);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't record the settlement. Please try again."));
    }
  };

  const remove = async (id: string) => {
    const ok = await confirm({
      title: 'Remove this settlement?',
      message: 'The provider’s balance will change back.',
      confirmText: 'Remove',
      tone: 'danger',
    });
    if (!ok) return;
    await deletePayout(id)
      .unwrap()
      .catch(() => undefined);
  };

  return {
    balances: balances ?? [],
    payouts: payouts ?? [],
    isLoading,
    target,
    open,
    close,
    direction,
    setDirection,
    amount,
    setAmount,
    method,
    setMethod,
    reference,
    setReference,
    note,
    setNote,
    error,
    saving,
    submit,
    remove,
  };
}
