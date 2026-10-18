import { useState } from 'react';
import {
  useBlockUserMutation,
  useCreatePenaltyMutation,
  useDisableCodMutation,
  useEnableCodMutation,
  useGetAdminUserDetailQuery,
  useUnblockUserMutation,
  useUpdatePenaltyStatusMutation,
} from '@/redux/api/admin/adminApi';

const serverMessage = (err: unknown, fallback: string) =>
  (err as { data?: { message?: string } })?.data?.message ?? fallback;

/** Everything the admin "customer detail" screen needs: no-show history,
 * penalties, and the block/disable-COD/charge actions. */
export function useAdminUserDetail(userId: string) {
  const { data, isLoading, refetch } = useGetAdminUserDetailQuery(userId);
  const [blockUser, { isLoading: blocking }] = useBlockUserMutation();
  const [unblockUser, { isLoading: unblocking }] = useUnblockUserMutation();
  const [disableCod, { isLoading: disablingCod }] = useDisableCodMutation();
  const [enableCod, { isLoading: enablingCod }] = useEnableCodMutation();
  const [createPenalty, { isLoading: creatingPenalty }] = useCreatePenaltyMutation();
  const [updatePenaltyStatus] = useUpdatePenaltyStatusMutation();

  // Block confirmation modal (with a reason).
  const [blocking_, setBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  // Add-charge form.
  const [chargeOpen, setChargeOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openBlock = () => {
    setBlockReason('');
    setBlockOpen(true);
  };
  const closeBlock = () => setBlockOpen(false);

  const confirmBlock = async () => {
    try {
      await blockUser({ userId, reason: blockReason.trim() || undefined }).unwrap();
      setBlockOpen(false);
    } catch {
      // surfaced via mutation state
    }
  };

  const unblock = async () => {
    await unblockUser(userId).unwrap().catch(() => undefined);
  };

  const toggleCod = async (next: boolean) => {
    const action = next ? disableCod : enableCod;
    await action(userId).unwrap().catch(() => undefined);
  };

  const openCharge = () => {
    setAmount('');
    setReason('');
    setNote('');
    setError(null);
    setChargeOpen(true);
  };
  const closeCharge = () => setChargeOpen(false);

  const submitCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const rupees = Number(amount);
    if (Number.isNaN(rupees) || rupees <= 0) return setError('Enter a valid amount');
    if (reason.trim().length < 1) return setError('Enter a reason');
    try {
      await createPenalty({
        userId,
        data: { amountMinor: Math.round(rupees * 100), reason: reason.trim(), note: note.trim() || undefined },
      }).unwrap();
      setChargeOpen(false);
    } catch (err) {
      setError(serverMessage(err, 'Could not add the charge. Please try again.'));
    }
  };

  const setPenaltyStatus = async (penaltyId: string, status: 'PAID' | 'WAIVED') => {
    await updatePenaltyStatus({ penaltyId, status }).unwrap().catch(() => undefined);
  };

  return {
    data,
    isLoading,
    refetch,
    blockOpen: blocking_,
    blockReason,
    setBlockReason,
    openBlock,
    closeBlock,
    confirmBlock,
    blocking,
    unblock,
    unblocking,
    toggleCod,
    togglingCod: disablingCod || enablingCod,
    chargeOpen,
    openCharge,
    closeCharge,
    amount,
    setAmount,
    reason,
    setReason,
    note,
    setNote,
    error,
    submitCharge,
    creatingPenalty,
    setPenaltyStatus,
  };
}
