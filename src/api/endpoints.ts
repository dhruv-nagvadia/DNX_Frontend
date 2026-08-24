/**
 * Single source of truth for base URL and every endpoint path.
 * BASE_URL comes from Vite env (import.meta.env) — never hardcode it.
 */
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export const endpoints = {
  // Auth — provider accounts (PROVIDER); refresh/me are shared/token-based
  register: '/provider/auth/register',
  login: '/provider/auth/login',
  refresh: '/auth/refresh',
  me: '/auth/me',

  // Categories (shared/public)
  categories: '/categories',

  // In-app notifications (shared/token-based; any role)
  notifications: '/notifications',
  notificationsUnreadCount: '/notifications/unread-count',
  notificationsReadAll: '/notifications/read-all',
  notificationRead: (id: string) => `/notifications/${id}/read`,

  // Customer browse (public) — kept for completeness; the provider app rarely uses these
  providers: '/customer/providers',
  providerById: (id: string) => `/customer/providers/${id}`,

  // Provider app — manage your own businesses (role PROVIDER)
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
  providerServices: (providerId: string) => `/provider/businesses/${providerId}/services`,
  providerService: (providerId: string, serviceId: string) =>
    `/provider/businesses/${providerId}/services/${serviceId}`,
  providerProducts: (providerId: string) => `/provider/businesses/${providerId}/products`,
  providerProduct: (providerId: string, productId: string) =>
    `/provider/businesses/${providerId}/products/${productId}`,
};
