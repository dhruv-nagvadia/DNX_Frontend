import { ReactNode, useCallback, useRef, useState } from 'react';

import { ConfirmDialog } from './ConfirmDialog';
import { ConfirmContext } from './context';
import { ConfirmOptions } from './types';

const errorText = (err: unknown) =>
  (err as { data?: { message?: string } })?.data?.message ??
  (err instanceof Error ? err.message : null) ??
  'Something went wrong. Please try again.';

/** Mounted once at the app root; renders the single shared confirm dialog. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  const settle = useCallback((ok: boolean) => {
    resolveRef.current?.(ok);
    resolveRef.current = null;
    setOptions(null);
    setLoading(false);
    setError(null);
  }, []);

  const confirm = useCallback((next: ConfirmOptions) => {
    // A new prompt replaces any one still open, which counts as cancelled.
    resolveRef.current?.(false);
    setError(null);
    setLoading(false);
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const onConfirm = async () => {
    if (!options?.onConfirm) {
      settle(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await options.onConfirm();
      settle(true);
    } catch (err) {
      setLoading(false);
      setError(errorText(err));
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={!!options}
        title={options?.title ?? ''}
        message={options?.message}
        confirmText={options?.confirmText}
        cancelText={options?.cancelText}
        tone={options?.tone}
        icon={options?.icon}
        hideCancel={options?.hideCancel}
        loadingText={options?.loadingText}
        loading={loading}
        error={error}
        onConfirm={onConfirm}
        onCancel={() => settle(false)}
      />
    </ConfirmContext.Provider>
  );
}
