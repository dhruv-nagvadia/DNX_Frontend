/**
 * Single source of truth for base URL and every endpoint path.
 * BASE_URL comes from Vite env (import.meta.env) — never hardcode it.
 */
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export const endpoints = {
  // Auth
  register: '/auth/register',
  login: '/auth/login',
  refresh: '/auth/refresh',
  me: '/auth/me',

  // Categories
  categories: '/categories',

  // Providers
  providers: '/providers',
  providerById: (id: string) => `/providers/${id}`,
  myProvider: '/providers/me',
  myProviderImages: '/providers/me/images',

  // Bookings
  myBookings: '/bookings/mine',
};
