export interface BusinessForm {
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

export type BusinessFormErrors = Partial<Record<keyof BusinessForm, string>>;

export interface PickedImage {
  file: File;
  preview: string;
}
