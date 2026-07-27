export interface OnboardingForm {
  categoryId: string;
  businessName: string;
  phone: string;
  email: string;
  description: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
}

export type OnboardingErrors = Partial<Record<keyof OnboardingForm, string>>;

export interface PickedImage {
  file: File;
  /** Object URL for local preview before upload. */
  preview: string;
}
