import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/api/apiConfig';
import { endpoints } from '@/api/endpoints';
import { ApiEnvelope } from '../types';
import {
  AdminAnalyticsOverview,
  AdminAuthData,
  AdminLoginRequest,
  PlatformCoupon,
  PlatformCouponInput,
} from './types';

/** Kept separate from authApi (provider/customer) so admin-only code stays physically isolated. */
export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['PlatformCoupons'],
  endpoints: (builder) => ({
    loginAdmin: builder.mutation<AdminAuthData, AdminLoginRequest>({
      query: (data) => ({ endpoint: endpoints.adminLogin, method: 'post', data }),
      transformResponse: (res: ApiEnvelope<AdminAuthData>) => res.data,
    }),

    getAnalyticsOverview: builder.query<AdminAnalyticsOverview, void>({
      query: () => ({ endpoint: endpoints.adminAnalyticsOverview, method: 'get' }),
      transformResponse: (res: ApiEnvelope<AdminAnalyticsOverview>) => res.data,
    }),

    getPlatformCoupons: builder.query<PlatformCoupon[], void>({
      query: () => ({ endpoint: endpoints.adminCoupons, method: 'get' }),
      transformResponse: (res: ApiEnvelope<PlatformCoupon[]>) => res.data,
      providesTags: ['PlatformCoupons'],
    }),

    createPlatformCoupon: builder.mutation<PlatformCoupon, PlatformCouponInput>({
      query: (data) => ({ endpoint: endpoints.adminCoupons, method: 'post', data }),
      transformResponse: (res: ApiEnvelope<PlatformCoupon>) => res.data,
      invalidatesTags: ['PlatformCoupons'],
    }),

    updatePlatformCoupon: builder.mutation<
      PlatformCoupon,
      { couponId: string; data: Partial<PlatformCouponInput> }
    >({
      query: ({ couponId, data }) => ({
        endpoint: endpoints.adminCoupon(couponId),
        method: 'patch',
        data,
      }),
      transformResponse: (res: ApiEnvelope<PlatformCoupon>) => res.data,
      invalidatesTags: ['PlatformCoupons'],
    }),

    deletePlatformCoupon: builder.mutation<{ id: string }, string>({
      query: (couponId) => ({ endpoint: endpoints.adminCoupon(couponId), method: 'delete' }),
      transformResponse: (res: ApiEnvelope<{ id: string }>) => res.data,
      invalidatesTags: ['PlatformCoupons'],
    }),
  }),
});

export const {
  useLoginAdminMutation,
  useGetAnalyticsOverviewQuery,
  useGetPlatformCouponsQuery,
  useCreatePlatformCouponMutation,
  useUpdatePlatformCouponMutation,
  useDeletePlatformCouponMutation,
} = adminApi;
