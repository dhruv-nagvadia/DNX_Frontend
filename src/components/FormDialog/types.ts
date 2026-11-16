import { FormEvent, ReactNode } from 'react';
import { TabItem } from '@/components/Tabs/types';

export interface FormDialogProps {
  open: boolean;
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  /** When given, the dialog shows a tab bar and the caller renders the matching tab's fields. */
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  /** Shown above the buttons, so a problem on any tab is always visible. */
  error?: string | null;
  submitLabel: string;
  submitting?: boolean;
  submittingLabel?: string;
  /** Disables the submit button without showing the loading state. */
  submitDisabled?: boolean;
  /** Text of the secondary (close) button. Defaults to "Cancel". */
  cancelLabel?: string;
  /** `danger` turns the submit button red (and tints the header icon). */
  tone?: 'primary' | 'danger';
  /** Optional round icon shown before the title. */
  icon?: ReactNode;
  /** sm = 440px (short prompts), md = 560px, lg = 720px (default, long forms). */
  size?: 'sm' | 'md' | 'lg';
  /** Where focus lands on open: the panel (default) or its first field. */
  initialFocus?: 'panel' | 'firstField';
  children: ReactNode;
}
