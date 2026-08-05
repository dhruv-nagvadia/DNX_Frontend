export interface RegisterForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export type RegisterErrors = Partial<Record<keyof RegisterForm, string>>;
