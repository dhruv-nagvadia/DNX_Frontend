/**
 * Single source of truth for base URL and every endpoint path.
 * BASE_URL comes from Vite env (import.meta.env) — never hardcode it.
 */
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export const endpoints = {
  // Auth (shared)
  register: '/auth/register',
  login: '/auth/login',
  refresh: '/auth/refresh',
  me: '/auth/me',

  // Categories (shared/public)
  categories: '/categories',

  // Customer browse (public) — kept for completeness; the provider app rarely uses these
  providers: '/customer/providers',
  providerById: (id: string) => `/customer/providers/${id}`,

  // Provider app — manage your own businesses (role PROVIDER)
  myProviders: '/provider/businesses',
  myProviderById: (id: string) => `/provider/businesses/${id}`,
  myProviderImages: (id: string) => `/provider/businesses/${id}/images`,
  myProviderHours: (id: string) => `/provider/businesses/${id}/hours`,
  providerServices: (providerId: string) => `/provider/businesses/${providerId}/services`,
  providerService: (providerId: string, serviceId: string) =>
    `/provider/businesses/${providerId}/services/${serviceId}`,
};
