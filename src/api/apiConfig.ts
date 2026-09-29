import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';

import { BASE_URL } from './endpoints';
import { tokenStorage } from '@/utils/tokenStorage';

// ── Axios instance ──────────────────────────────────────────────────────────
const networkCall = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

// Request interceptor — attach the stored Bearer token.
networkCall.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Token refresh (on 401) ───────────────────────────────────────────────────
// The access token is short-lived (15m) — a coding session (or just leaving a
// tab open) easily outlasts that. Without this, the very next request after
// expiry would look like a real logout even though the refresh token (30d)
// is still perfectly valid.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;
  try {
    // Bare axios (not `networkCall`) so this request skips the interceptors.
    const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
    const tokens = res.data?.data ?? res.data;
    const accessToken: string | undefined = tokens?.accessToken;
    if (!accessToken) return null;
    tokenStorage.save(
      { accessToken, refreshToken: tokens.refreshToken ?? refreshToken },
      tokenStorage.isRemembered(),
    );
    return accessToken;
  } catch {
    return null;
  }
}

// Response interceptor — refresh the token on 401 and retry once.
networkCall.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;

      if (newToken) {
        // Retry the original request; the request interceptor re-attaches the
        // freshly stored token.
        return networkCall(original);
      }

      tokenStorage.clear();
      // Hard redirect keeps this logic outside React and avoids circular imports.
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }

    return Promise.reject(error);
  },
);

// ── RTK Query base query ─────────────────────────────────────────────────────
export interface AxiosBaseQueryArgs {
  endpoint: string;
  method?: AxiosRequestConfig['method'];
  data?: AxiosRequestConfig['data'];
  params?: AxiosRequestConfig['params'];
  headers?: AxiosRequestConfig['headers'];
}

/**
 * Adapts Axios to the shape RTK Query expects:
 *   success → { data }
 *   failure → { error: { status, data } }
 */
export const axiosBaseQuery =
  (): BaseQueryFn<AxiosBaseQueryArgs, unknown, { status?: number; data?: unknown }> =>
  async ({ endpoint, method = 'get', data, params, headers }) => {
    try {
      const result = await networkCall({ url: endpoint, method, data, params, headers });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      return {
        error: { status: err.response?.status, data: err.response?.data || err.message },
      };
    }
  };

export { networkCall };
