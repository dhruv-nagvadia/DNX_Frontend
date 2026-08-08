import { Category, Subcategory } from '../category/types';

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  priceMinor: number;
  currency: string;
  durationMin: number;
  isActive?: boolean;
}

export interface ServiceInput {
  name: string;
  description?: string;
  // Price in major units (rupees); the API converts to minor units.
  price: number;
  durationMin: number;
}

export interface BusinessHour {
  id?: string;
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  isOpen: boolean;
  openTime: string; // "HH:MM"
  closeTime: string;
}

/** A date-specific override of the weekly hours. */
export interface DateHour {
  id: string;
  date: string; // ISO date (may include a T00:00:00Z suffix)
  isOpen: boolean;
  openTime: string; // "HH:MM"
  closeTime: string;
}

export interface DateHourInput {
  date: string; // "YYYY-MM-DD"
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface Provider {
  id: string;
  businessName: string;
  description?: string | null;
  phone: string;
  email?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  images: string[];
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
  category: Category;
  subcategory?: Subcategory | null;
  services: Service[];
  businessHours: BusinessHour[];
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface ProviderBooking {
  id: string;
  status: BookingStatus;
  startTime: string;
  endTime: string;
  amountMinor: number;
  currency: string;
  service: { name: string };
  user: { fullName: string; phone?: string | null };
}

export interface ListProvidersParams {
  categorySlug?: string;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateProviderRequest {
  businessName: string;
  categoryId: string;
  subcategoryId?: string;
  phone: string;
  email?: string;
  description?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}
