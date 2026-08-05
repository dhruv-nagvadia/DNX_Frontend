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

// Response interceptor — global 401 handling.
networkCall.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
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
