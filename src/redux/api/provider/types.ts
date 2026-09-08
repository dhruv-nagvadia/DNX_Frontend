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

export type BusinessType = 'SERVICE' | 'STORE';

export type Measure = 'weight' | 'volume' | 'count';

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  measure: Measure;
  priceMinor: number; // price for `priceQty` base units
  priceQty: number; // base units the price covers (e.g. 100 for ₹200/100g)
  currency: string;
  unit: string; // base unit label (g / ml / piece)
  section?: string | null;
  stockQty: number; // base units
  stepQty: number; // minimum + increment, base units
  imageUrl?: string | null;
  isActive?: boolean;
  ratingAvg?: number;
  ratingCount?: number;
}

export interface ProductInput {
  name: string;
  description?: string;
  measure: Measure;
  // Price in major units (rupees) for `priceQty` base units.
  price: number;
  priceQty: number;
  section?: string;
  stockQty?: number; // base units
  stepQty?: number; // base units
  imageUrl?: string;
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
  type?: BusinessType;
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
  depositPercent?: number;
  category: Category;
  subcategory?: Subcategory | null;
  services: Service[];
  products?: Product[];
  businessHours: BusinessHour[];
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'ONLINE' | 'CASH' | 'PARTIAL';

export interface ProviderBooking {
  id: string;
  status: BookingStatus;
  startTime: string;
  endTime: string;
  amountMinor: number;
  amountPaidMinor?: number;
  currency: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  cancelReason?: string | null;
  service: { name: string };
  user: { fullName: string; phone?: string | null };
}

/** A booking as seen on the cross-business home dashboard (carries its business). */
export interface DashboardBooking extends ProviderBooking {
  provider: { id: string; businessName: string };
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface ProviderOrderItem {
  id: string;
  name: string;
  measure: Measure;
  priceMinor: number;
  priceQty: number;
  unit: string;
  quantity: number;
}

export interface ProviderOrder {
  id: string;
  status: OrderStatus;
  amountMinor: number;
  amountPaidMinor: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  note?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  items: ProviderOrderItem[];
  user: { fullName: string; phone?: string | null };
  provider: { id: string; businessName: string };
}

export type DiscountType = 'PERCENT' | 'FLAT';

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number; // percent (1-100) or flat amount in minor units
  minOrderMinor: number;
  maxDiscountMinor?: number | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CouponInput {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderMinor?: number;
  maxDiscountMinor?: number;
  expiresAt?: string | null;
  usageLimit?: number;
  isActive?: boolean;
}

export interface BusinessReview {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user: { fullName: string };
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
  type?: BusinessType;
  phone: string;
  email?: string;
  description?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  depositPercent?: number;
}
