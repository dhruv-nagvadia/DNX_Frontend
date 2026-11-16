import { useContext } from 'react';
import { ConfirmContext } from './context';
import { ConfirmFn } from './types';

/**
 * Themed replacement for `window.confirm`:
 * `if (!(await confirm({ title: 'Delete this coupon?', tone: 'danger' }))) return;`
 */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>.');
  return confirm;
}
