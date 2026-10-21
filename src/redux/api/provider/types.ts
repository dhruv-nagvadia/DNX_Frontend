import { Category, Subcategory } from '../category/types';

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  priceMinor: number;
  currency: string;
  durationMin: number;
  isActive?: boolean;
  // On-location service (provider travels to the customer) — off by default.
  travelRequired?: boolean;
  travelBaseFeeMinor?: number;
  travelPerKmMinor?: number;
  // Off = this service can't be booked with Partial Pay, even if the
  // business otherwise offers it. Defaults to true.
  partialPayEnabled?: boolean;
}

export interface ServiceInput {
  name: string;
  description?: string;
  // Price in major units (rupees); the API converts to minor units.
  price: number;
  durationMin: number;
  travelRequired?: boolean;
  // Travel fees in major units (rupees); the API converts to minor units.
  travelBaseFee?: number;
  travelPerKm?: number;
  partialPayEnabled?: boolean;
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
  // Made-to-order / no fixed quantity (e.g. a restaurant dish) — stockQty is
  // ignored everywhere when this is on (never shows as out/low stock).
  unlimitedStock?: boolean;
  stepQty: number; // minimum + increment, base units
  imageUrl?: string | null;
  isActive?: boolean;
  ratingAvg?: number;
  ratingCount?: number;
  // What kind of product this is (e.g. "Bath & Body") — lets customers
  // browse it pooled with the same kind of product from other stores.
  productTypeId?: string | null;
  productType?: { name: string } | null;
  // Off = this product can't be paid for with Cash on Delivery, even if the
  // store otherwise accepts it. Defaults to true.
  codEnabled?: boolean;
  // Same idea for Partial Pay.
  partialPayEnabled?: boolean;
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
  unlimitedStock?: boolean;
  stepQty?: number; // base units
  imageUrl?: string;
  productTypeId?: string | null;
  codEnabled?: boolean;
  partialPayEnabled?: boolean;
}

export type StockAdjustmentReason = 'SALE' | 'RESTOCK' | 'DAMAGED' | 'OTHER';

export interface AdjustStockInput {
  // Positive = stock added, negative = stock removed, in the product's base unit.
  delta: number;
  reason?: StockAdjustmentReason;
  note?: string;
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
  latitude?: number | null;
  longitude?: number | null;
  images: string[];
  ratingAvg: number;
  ratingCount: number;
  isVerified: boolean;
  depositPercent?: number;
  // Accepts Cash on Delivery at all — a product's own codEnabled can only
  // narrow this further, never override it back on.
  codEnabled?: boolean;
  // Offers Partial Pay at all — a product's/service's own partialPayEnabled
  // can only narrow this further, never override it back on.
  partialPayEnabled?: boolean;
  // Set by DNX, not the owner: a blocked business is hidden from customers and
  // takes no new bookings/orders; Cash on Delivery can be turned off for it.
  // (Only the owner's own endpoints return these.)
  isBlocked?: boolean;
  blockedReason?: string | null;
  codDisabledByAdmin?: boolean;
  codDisabledReason?: string | null;
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

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

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
  // How much of amountPaidMinor was actually refunded — less than the full
  // amount for a cancelled/no-show order with a mix of made-to-order and
  // static items (only the made-to-order portion is forfeited).
  refundedMinor?: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  note?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  readyAt?: string | null;
  items: ProviderOrderItem[];
  user: { fullName: string; phone?: string | null };
  provider: { id: string; businessName: string };
}

export type DiscountType = 'PERCENT' | 'FLAT';
// What triggers eligibility: a minimum order/booking amount, one specific
// service (service businesses), or one specific product (stores).
export type CouponScope = 'ORDER' | 'SERVICE' | 'PRODUCT';

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number; // percent (1-100) or flat amount in minor units
  scope: CouponScope;
  serviceId?: string | null;
  service?: { name: string } | null;
  productId?: string | null;
  product?: { name: string } | null;
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
  scope?: CouponScope;
  serviceId?: string | null;
  productId?: string | null;
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
  providerReply?: string | null;
  repliedAt?: string | null;
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
  latitude?: number;
  longitude?: number;
  depositPercent?: number;
}

// ── Earnings (after the platform's commission) ──────────────────────────────

export interface EarningsParams {
  from?: string;
  to?: string;
  businessId?: string;
}

export interface EarningsTotals {
  count: number;
  grossMinor: number;
  commissionMinor: number;
  netMinor: number;
  /** Part of the sales paid online (held by the platform). */
  onlineMinor: number;
  /** Part of the sales the provider collected in person. */
  cashMinor: number;
}

export interface EarningsTransaction {
  kind: 'BOOKING' | 'ORDER';
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  status: string;
  paymentMethod: PaymentMethod;
  settledAt: string | null;
  commissionBps: number;
  grossMinor: number;
  commissionMinor: number;
  earningMinor: number;
  onlineMinor: number;
  cashMinor: number;
  /** What this sale adds to (or, for a cash sale, takes off) what DNX pays you: online money minus commission. */
  payableMinor: number;
}

export interface EarningsSettlement {
  id: string;
  direction: 'TO_PROVIDER' | 'FROM_PROVIDER';
  amountMinor: number;
  method: string | null;
  reference: string | null;
  note: string | null;
  paidAt: string;
}

export interface Earnings {
  range: { from?: string; to?: string };
  /** The commission a new sale is charged right now (basis points). */
  defaultCommissionBps: number;
  summary: EarningsTotals;
  /** Open bookings/orders — what they'd be worth if they complete. */
  upcoming: EarningsTotals;
  balance: {
    /** Online money DNX collected for the provider's finished sales (all time). */
    earnedOnlineMinor: number;
    /** DNX's commission on all those finished sales, online and cash (all time). */
    earnedCommissionMinor: number;
    paidOutMinor: number;
    receivedMinor: number;
    /** Positive: the platform owes you. Negative: you owe the platform. */
    balanceMinor: number;
  };
  businesses: (EarningsTotals & {
    id: string;
    name: string;
    commissionBps: number;
    isCustomRate: boolean;
  })[];
  transactions: EarningsTransaction[];
  payouts: EarningsSettlement[];
}
