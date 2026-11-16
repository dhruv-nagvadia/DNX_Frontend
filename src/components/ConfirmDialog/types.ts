import { ReactNode } from 'react';

export type ConfirmTone = 'danger' | 'warning' | 'info';

export interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  /** Only one button (an acknowledgement, like `window.alert`). */
  hideCancel?: boolean;
  /** Replaces the tone's default icon. */
  icon?: ReactNode;
  /**
   * Optional work to run on confirm. The dialog shows a spinner until it
   * settles; if it throws, the dialog stays open with the error shown.
   */
  onConfirm?: () => Promise<unknown> | unknown;
  /** Button text while `onConfirm` runs. */
  loadingText?: string;
}

export interface ConfirmDialogProps extends Omit<ConfirmOptions, 'onConfirm'> {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
