export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN';
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminAuthData extends AdminUser {
  accessToken: string;
  refreshToken: string;
}

export type PlatformCouponAppliesTo = 'ANY' | 'BOOKING' | 'ORDER';
export type DiscountType = 'PERCENT' | 'FLAT';

// A discount code an admin creates — usable across any business, unlike a
// provider's own coupons (which only work for that one business).
export interface PlatformCoupon {
  id: string;
  code: string;
  description: string | null;
  appliesTo: PlatformCouponAppliesTo;
  discountType: DiscountType;
  discountValue: number;
  minOrderMinor: number;
  maxDiscountMinor: number | null;
  // Restricts the code to one business category (e.g. only "Beauty & Wellness"). Null = any category.
  categoryId: string | null;
  category?: { id: string; name: string } | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformCouponInput {
  code: string;
  description?: string;
  appliesTo?: PlatformCouponAppliesTo;
  discountType: DiscountType;
  discountValue: number;
  minOrderMinor?: number;
  maxDiscountMinor?: number;
  categoryId?: string | null;
  expiresAt?: string | null;
  usageLimit?: number;
  isActive?: boolean;
}

export interface AdminAnalyticsOverview {
  totals: {
    customers: number;
    providers: number;
    businesses: number;
    bookings: number;
    orders: number;
  };
  revenueMinor: number;
  last30Days: {
    newCustomers: number;
    newProviders: number;
    customerGrowthPct: number;
    providerGrowthPct: number;
  };
  dailyGrowth: {
    labels: string[];
    customers: number[];
    providers: number[];
  };
}
