/**
 * Single source of truth for base URL and every endpoint path.
 * BASE_URL comes from Vite env (import.meta.env) — never hardcode it.
 */
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export const endpoints = {
  // Auth — provider accounts (PROVIDER); refresh/me are shared/token-based
  register: '/provider/auth/register',
  login: '/provider/auth/login',
  forgotPassword: '/provider/auth/forgot-password',
  resetPassword: '/provider/auth/reset-password',
  refresh: '/auth/refresh',
  me: '/auth/me',

  // Auth — unlisted admin console (ADMIN; login-only, no self-registration)
  adminLogin: '/admin/auth/login',
  adminAnalyticsOverview: '/admin/analytics/overview',
  adminCoupons: '/admin/coupons',
  adminCoupon: (id: string) => `/admin/coupons/${id}`,
  adminUsers: '/admin/users',
  adminUser: (userId: string) => `/admin/users/${userId}`,
  adminUserBlock: (userId: string) => `/admin/users/${userId}/block`,
  adminUserUnblock: (userId: string) => `/admin/users/${userId}/unblock`,
  adminUserPenalties: (userId: string) => `/admin/users/${userId}/penalties`,
  adminPenalty: (penaltyId: string) => `/admin/penalties/${penaltyId}`,
  adminUserDisableCod: (userId: string) => `/admin/users/${userId}/disable-cod`,
  adminUserEnableCod: (userId: string) => `/admin/users/${userId}/enable-cod`,
  adminConfig: '/admin/config',
  adminFinanceOverview: '/admin/finance/overview',
  adminFinanceTransactions: '/admin/finance/transactions',
  adminFinanceBreakdown: '/admin/finance/breakdown',
  adminFinanceServices: '/admin/finance/services',
  adminFinanceBalances: '/admin/finance/balances',
  adminFinanceBusinesses: '/admin/finance/businesses',
  adminFinanceBusinessCommission: (businessId: string) =>
    `/admin/finance/businesses/${businessId}/commission`,
  adminFinancePayouts: '/admin/finance/payouts',
  adminFinancePayout: (payoutId: string) => `/admin/finance/payouts/${payoutId}`,

  // Categories (shared/public)
  categories: '/categories',
  productTypes: '/customer/product-types',

  // Reverse geocoding proxy (avoids Nominatim's missing CORS headers)
  reverseGeocode: '/geo/reverse',

  // In-app notifications (shared/token-based; any role)
  notifications: '/notifications',
  notificationsUnreadCount: '/notifications/unread-count',
  notificationsReadAll: '/notifications/read-all',
  notificationRead: (id: string) => `/notifications/${id}/read`,

  // Customer browse (public) — kept for completeness; the provider app rarely uses these
  providers: '/customer/providers',
  providerById: (id: string) => `/customer/providers/${id}`,

  // Provider app — manage your own businesses (role PROVIDER)
  myEarnings: '/provider/earnings',
  myAllBookings: '/provider/bookings',
  myOrders: '/provider/orders',
  myOrder: (orderId: string) => `/provider/orders/${orderId}`,
  myOrderCollect: (orderId: string) => `/provider/orders/${orderId}/collect`,
  uploadImage: '/provider/uploads/image',
  myProviders: '/provider/businesses',
  myProviderById: (id: string) => `/provider/businesses/${id}`,
  myProviderImages: (id: string) => `/provider/businesses/${id}/images`,
  myProviderHours: (id: string) => `/provider/businesses/${id}/hours`,
  myProviderDateHours: (id: string) => `/provider/businesses/${id}/date-hours`,
  myProviderBookings: (id: string) => `/provider/businesses/${id}/bookings`,
  myProviderBooking: (id: string, bookingId: string) =>
    `/provider/businesses/${id}/bookings/${bookingId}`,
  myProviderBookingCollect: (id: string, bookingId: string) =>
    `/provider/businesses/${id}/bookings/${bookingId}/collect`,
  myProviderReviews: (id: string) => `/provider/businesses/${id}/reviews`,
  myProviderReviewReply: (id: string, reviewId: string) =>
    `/provider/businesses/${id}/reviews/${reviewId}/reply`,
  myProviderProductReviewReply: (id: string, productId: string, reviewId: string) =>
    `/provider/businesses/${id}/products/${productId}/reviews/${reviewId}/reply`,
  providerServices: (providerId: string) => `/provider/businesses/${providerId}/services`,
  providerService: (providerId: string, serviceId: string) =>
    `/provider/businesses/${providerId}/services/${serviceId}`,
  providerProducts: (providerId: string) => `/provider/businesses/${providerId}/products`,
  providerProduct: (providerId: string, productId: string) =>
    `/provider/businesses/${providerId}/products/${productId}`,
  providerProductStock: (providerId: string, productId: string) =>
    `/provider/businesses/${providerId}/products/${productId}/stock`,
  providerProductAvailability: (providerId: string, productId: string) =>
    `/provider/businesses/${providerId}/products/${productId}/availability`,
  providerCoupons: (providerId: string) => `/provider/businesses/${providerId}/coupons`,
  providerCoupon: (providerId: string, couponId: string) =>
    `/provider/businesses/${providerId}/coupons/${couponId}`,
};
