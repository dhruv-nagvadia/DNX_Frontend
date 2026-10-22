import { FormEvent, ReactNode } from 'react';
import { TabItem } from '@/components/Tabs/types';

export interface FormDialogProps {
  open: boolean;
  title: string;
  subtitle?: string;
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
  children: ReactNode;
}
