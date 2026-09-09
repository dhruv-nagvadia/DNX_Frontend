export interface BusinessForm {
  type: 'SERVICE' | 'STORE';
  categoryId: string;
  subcategoryId: string;
  businessName: string;
  phone: string;
  email: string;
  description: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  // Coordinates — set via the "Use my current location" button. Powers
  // "nearest" search on the customer app.
  latitude: string;
  longitude: string;
  depositPercent: string;
}

export type BusinessFormErrors = Partial<Record<keyof BusinessForm, string>>;

export interface PickedImage {
  file: File;
  preview: string;
}
