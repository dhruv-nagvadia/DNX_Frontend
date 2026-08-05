import { TextFieldProps } from '@/components/TextField/types';

export interface PasswordFieldProps extends Omit<TextFieldProps, 'type' | 'trailing' | 'prefix'> {
  /** Render the 3-segment strength meter below the field. */
  showStrength?: boolean;
}

export interface PasswordStrength {
  /** 0 = empty, 1 = weak, 2 = fair, 3 = strong. */
  score: 0 | 1 | 2 | 3;
  label: string;
}
