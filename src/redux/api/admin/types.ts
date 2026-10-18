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

export type PenaltyStatus = 'PENDING' | 'PAID' | 'WAIVED';

export interface UserPenalty {
  id: string;
  userId: string;
  amountMinor: number;
  reason: string;
  note: string | null;
  status: PenaltyStatus;
  createdByAdminId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePenaltyInput {
  amountMinor: number;
  reason: string;
  note?: string;
}

// A customer row in the admin "Users" list, sorted worst-no-show-first.
export interface AdminCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isBlocked: boolean;
  codDisabled: boolean;
  createdAt: string;
  noShowCount: number;
}

export interface AdminNoShowBooking {
  id: string;
  startTime: string;
  amountMinor: number | null;
  amountPaidMinor: number;
  paymentMethod: 'ONLINE' | 'CASH' | 'PARTIAL';
  service: { name: string };
  provider: { businessName: string };
}

export interface AdminNoShowOrder {
  id: string;
  createdAt: string;
  amountMinor: number;
  amountPaidMinor: number;
  paymentMethod: 'ONLINE' | 'CASH' | 'PARTIAL';
  provider: { businessName: string };
}

export interface AdminCustomerDetail {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    isBlocked: boolean;
    blockedReason: string | null;
    blockedAt: string | null;
    codDisabled: boolean;
    createdAt: string;
  };
  noShowBookings: AdminNoShowBooking[];
  noShowOrders: AdminNoShowOrder[];
  penalties: UserPenalty[];
}

export interface PlatformConfig {
  id: number;
  orderPickupWindowHours: number;
  // Platform commission on each completed sale, in basis points (1000 = 10%).
  commissionBps: number;
  // Estimated payment-gateway fee, used only for the profit view.
  gatewayFeeBps: number;
  gatewayFeeFlatMinor: number;
  gatewayFeeAboveMinor: number;
  gatewayFeeCapMinor: number;
  updatedAt: string;
}

export type UpdatePlatformConfigInput = Partial<
  Omit<PlatformConfig, 'id' | 'updatedAt'>
>;

export type FinanceGroupBy = 'day' | 'month';

export interface FinanceRangeParams {
  from?: string;
  to?: string;
  groupBy?: FinanceGroupBy;
}

export interface FinanceTotals {
  count: number;
  grossMinor: number;
  commissionMinor: number;
  netMinor: number;
  onlineMinor: number;
  cashMinor: number;
}

export interface FinanceOverview {
  range: { from?: string; to?: string };
  groupBy: FinanceGroupBy;
  totals: FinanceTotals & { gatewayFeesMinor: number; profitMinor: number };
  /** Open bookings/orders — commission expected if they complete. */
  upcoming: FinanceTotals;
  series: {
    key: string;
    count: number;
    grossMinor: number;
    commissionMinor: number;
    gatewayFeeMinor: number;
    profitMinor: number;
  }[];
}

export interface FinanceBalance {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  businessCount: number;
  grossMinor: number;
  commissionMinor: number;
  netMinor: number;
  paidOutMinor: number;
  receivedMinor: number;
  /** Positive: the platform owes the provider. Negative: the provider owes the platform. */
  balanceMinor: number;
}

export interface FinanceBusiness {
  id: string;
  name: string;
  type: 'SERVICE' | 'STORE';
  city: string | null;
  ownerName: string;
  ownerEmail: string;
  customCommissionBps: number | null;
  effectiveCommissionBps: number;
}

export interface FinanceBusinessesData {
  defaultCommissionBps: number;
  businesses: FinanceBusiness[];
}

export type PaymentMethod = 'ONLINE' | 'CASH' | 'PARTIAL';
export type TransactionKind = 'BOOKING' | 'ORDER';
/** OPEN = pending / confirmed / ready. */
export type TransactionStatusFilter =
  | 'OPEN'
  | 'PENDING'
  | 'CONFIRMED'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

/** Filters shared by the transactions list and the by-business / by-service breakdowns. */
export interface FinanceFilterParams {
  from?: string;
  to?: string;
  businessId?: string;
  serviceId?: string;
  /** A provider account (owner of one or more businesses). */
  ownerId?: string;
  method?: PaymentMethod;
  kind?: TransactionKind;
  status?: TransactionStatusFilter;
  search?: string;
}

export interface FinanceTransactionsParams extends FinanceFilterParams {
  page?: number;
  limit?: number;
}

/** Totals for any set of bookings/orders. */
export interface FinanceAgg {
  completedCount: number;
  /** Value of completed sales (plus payments kept after a no-show / late cancel). */
  grossMinor: number;
  /** Of that, paid through the gateway (DNX holds it). */
  onlineMinor: number;
  /** Of that, collected in person by the provider (COD / the cash part of a partial). */
  cashMinor: number;
  commissionMinor: number;
  gatewayFeeMinor: number;
  /** What providers keep after commission. */
  earningMinor: number;
  /** Online money held minus commission — what DNX still has to pass on. Negative = commission to take back. */
  payableMinor: number;
  upcomingCount: number;
  upcomingMinor: number;
  cancelledCount: number;
  refundedMinor: number;
  methods: Record<PaymentMethod, number>;
}

export type TransactionState = 'EARNED' | 'UPCOMING' | 'NONE';

export interface FinanceTransaction {
  kind: TransactionKind;
  id: string;
  placedAt: string;
  settledAt: string | null;
  /** Set when this order was paid in one payment together with other stores' orders (one cart). */
  sharedPayment: { orders: number; totalMinor: number } | null;
  businessId: string;
  businessName: string;
  ownerId: string;
  ownerName: string;
  serviceId: string | null;
  title: string;
  customerName: string;
  status: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  /** EARNED = finished with money kept, UPCOMING = still open, NONE = cancelled and fully refunded. */
  state: TransactionState;
  totalMinor: number;
  paidMinor: number;
  /** Paid through the gateway. */
  onlineMinor: number;
  /** In person — for an open sale, what's still due at the venue / on pickup. */
  cashMinor: number;
  refundedMinor: number;
  commissionBps: number;
  commissionMinor: number;
  gatewayFeeMinor: number;
  earningMinor: number;
  /** Online money DNX holds for this sale minus its commission. Negative for a cash sale: taken off what DNX owes the provider. */
  payableMinor: number;
}

export interface FinanceTransactionsData {
  summary: FinanceAgg;
  total: number;
  page: number;
  limit: number;
  rows: FinanceTransaction[];
}

export interface FinanceBreakdownRow extends FinanceAgg {
  id: string;
  name: string;
  businessId: string;
  businessName: string;
}

export type PayoutDirection = 'TO_PROVIDER' | 'FROM_PROVIDER';

export interface Payout {
  id: string;
  userId: string;
  direction: PayoutDirection;
  amountMinor: number;
  method: string | null;
  reference: string | null;
  note: string | null;
  paidAt: string;
  providerName?: string;
  providerEmail?: string;
}

export interface RecordPayoutInput {
  userId: string;
  direction: PayoutDirection;
  amountMinor: number;
  method?: string;
  reference?: string;
  note?: string;
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
