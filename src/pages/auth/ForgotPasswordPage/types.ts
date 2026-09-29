/** Step 1: request a code. Step 2: enter the code + a new password. */
export type ForgotPasswordStep = 'email' | 'reset';

export interface EmailForm {
  email: string;
}

export interface EmailErrors {
  email?: string;
}

export interface ResetForm {
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetErrors {
  otp?: string;
  newPassword?: string;
  confirmPassword?: string;
}
