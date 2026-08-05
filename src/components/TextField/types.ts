import { InputHTMLAttributes, ReactNode } from 'react';

/** `prefix` is omitted from the native attributes so it can carry a ReactNode. */
export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label: string;
  name: string;
  error?: string;
  /** Helper text under the field. Replaced by the error message when one exists. */
  hint?: string;
  /** Static content inside the field, before the input (e.g. "+91"). */
  prefix?: ReactNode;
  /** Interactive content inside the field, after the input (e.g. an eye toggle). */
  trailing?: ReactNode;
  /** Drop the default bottom margin — for forms that space fields with gap. */
  dense?: boolean;
}
