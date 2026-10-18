import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/api/apiConfig';
import { endpoints } from '@/api/endpoints';
import { ApiEnvelope } from '../types';
import {
  AdminAnalyticsOverview,
  AdminAuthData,
  AdminCustomer,
  AdminCustomerDetail,
  AdminLoginRequest,
  CreatePenaltyInput,
  FinanceBalance,
  FinanceBreakdownRow,
  FinanceBusinessesData,
  FinanceFilterParams,
  FinanceOverview,
  FinanceRangeParams,
  FinanceServiceOption,
  FinanceTransactionsData,
  FinanceTransactionsParams,
  Payout,
  PlatformConfig,
  PlatformCoupon,
  PlatformCouponInput,
  RecordPayoutInput,
  UpdatePlatformConfigInput,
  UserPenalty,
} from './types';

/** Kept separate from authApi (provider/customer) so admin-only code stays physically isolated. */
export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['PlatformCoupons', 'AdminUsers', 'Finance', 'PlatformConfig'],
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

    // ── Users (no-show history, penalties, blocking) ──────────────────────
    getAdminUsers: builder.query<AdminCustomer[], { search?: string } | void>({
      query: (params) => ({
        endpoint: endpoints.adminUsers,
        method: 'get',
        params: params?.search ? { search: params.search } : undefined,
      }),
      transformResponse: (res: ApiEnvelope<AdminCustomer[]>) => res.data,
      providesTags: ['AdminUsers'],
    }),

    getAdminUserDetail: builder.query<AdminCustomerDetail, string>({
      query: (userId) => ({ endpoint: endpoints.adminUser(userId), method: 'get' }),
      transformResponse: (res: ApiEnvelope<AdminCustomerDetail>) => res.data,
      providesTags: ['AdminUsers'],
    }),

    blockUser: builder.mutation<{ id: string }, { userId: string; reason?: string }>({
      query: ({ userId, reason }) => ({
        endpoint: endpoints.adminUserBlock(userId),
        method: 'post',
        data: { reason },
      }),
      transformResponse: (res: ApiEnvelope<{ id: string }>) => res.data,
      invalidatesTags: ['AdminUsers'],
    }),

    unblockUser: builder.mutation<{ id: string }, string>({
      query: (userId) => ({ endpoint: endpoints.adminUserUnblock(userId), method: 'post' }),
      transformResponse: (res: ApiEnvelope<{ id: string }>) => res.data,
      invalidatesTags: ['AdminUsers'],
    }),

    createPenalty: builder.mutation<UserPenalty, { userId: string; data: CreatePenaltyInput }>({
      query: ({ userId, data }) => ({
        endpoint: endpoints.adminUserPenalties(userId),
        method: 'post',
        data,
      }),
      transformResponse: (res: ApiEnvelope<UserPenalty>) => res.data,
      invalidatesTags: ['AdminUsers'],
    }),

    updatePenaltyStatus: builder.mutation<UserPenalty, { penaltyId: string; status: 'PAID' | 'WAIVED' }>({
      query: ({ penaltyId, status }) => ({
        endpoint: endpoints.adminPenalty(penaltyId),
        method: 'patch',
        data: { status },
      }),
      transformResponse: (res: ApiEnvelope<UserPenalty>) => res.data,
      invalidatesTags: ['AdminUsers'],
    }),

    disableCod: builder.mutation<{ id: string }, string>({
      query: (userId) => ({ endpoint: endpoints.adminUserDisableCod(userId), method: 'post' }),
      transformResponse: (res: ApiEnvelope<{ id: string }>) => res.data,
      invalidatesTags: ['AdminUsers'],
    }),

    enableCod: builder.mutation<{ id: string }, string>({
      query: (userId) => ({ endpoint: endpoints.adminUserEnableCod(userId), method: 'post' }),
      transformResponse: (res: ApiEnvelope<{ id: string }>) => res.data,
      invalidatesTags: ['AdminUsers'],
    }),

    // ── Platform-wide settings ─────────────────────────────────────────────
    getPlatformConfig: builder.query<PlatformConfig, void>({
      query: () => ({ endpoint: endpoints.adminConfig, method: 'get' }),
      transformResponse: (res: ApiEnvelope<PlatformConfig>) => res.data,
      providesTags: ['PlatformConfig'],
    }),

    updatePlatformConfig: builder.mutation<PlatformConfig, UpdatePlatformConfigInput>({
      query: (data) => ({ endpoint: endpoints.adminConfig, method: 'patch', data }),
      transformResponse: (res: ApiEnvelope<PlatformConfig>) => res.data,
      // Refetch the saved settings (so the form never shows a stale copy when
      // you come back to it); the default commission also appears in the
      // per-business list.
      invalidatesTags: ['PlatformConfig', 'Finance'],
    }),

    // ── Money: commission, gateway fees, profit, settlements ──────────────
    getFinanceOverview: builder.query<FinanceOverview, FinanceRangeParams>({
      query: (params) => ({ endpoint: endpoints.adminFinanceOverview, method: 'get', params }),
      transformResponse: (res: ApiEnvelope<FinanceOverview>) => res.data,
      providesTags: ['Finance'],
    }),

    getFinanceTransactions: builder.query<FinanceTransactionsData, FinanceTransactionsParams>({
      query: (params) => ({ endpoint: endpoints.adminFinanceTransactions, method: 'get', params }),
      transformResponse: (res: ApiEnvelope<FinanceTransactionsData>) => res.data,
      providesTags: ['Finance'],
    }),

    getFinanceBreakdown: builder.query<
      FinanceBreakdownRow[],
      FinanceFilterParams & { by: 'business' | 'service' }
    >({
      query: (params) => ({ endpoint: endpoints.adminFinanceBreakdown, method: 'get', params }),
      transformResponse: (res: ApiEnvelope<FinanceBreakdownRow[]>) => res.data,
      providesTags: ['Finance'],
    }),

    // Every service across all businesses (or one business's) — for the Service filter.
    getFinanceServices: builder.query<FinanceServiceOption[], { businessId?: string } | void>({
      query: (params) => ({
        endpoint: endpoints.adminFinanceServices,
        method: 'get',
        params: params?.businessId ? { businessId: params.businessId } : undefined,
      }),
      transformResponse: (res: ApiEnvelope<FinanceServiceOption[]>) => res.data,
      providesTags: ['Finance'],
    }),

    getFinanceBalances: builder.query<FinanceBalance[], void>({
      query: () => ({ endpoint: endpoints.adminFinanceBalances, method: 'get' }),
      transformResponse: (res: ApiEnvelope<FinanceBalance[]>) => res.data,
      providesTags: ['Finance'],
    }),

    getFinanceBusinesses: builder.query<FinanceBusinessesData, { search?: string } | void>({
      query: (params) => ({
        endpoint: endpoints.adminFinanceBusinesses,
        method: 'get',
        params: params?.search ? { search: params.search } : undefined,
      }),
      transformResponse: (res: ApiEnvelope<FinanceBusinessesData>) => res.data,
      providesTags: ['Finance'],
    }),

    setBusinessCommission: builder.mutation<
      { id: string; customCommissionBps: number | null; effectiveCommissionBps: number },
      { businessId: string; commissionBps: number | null }
    >({
      query: ({ businessId, commissionBps }) => ({
        endpoint: endpoints.adminFinanceBusinessCommission(businessId),
        method: 'patch',
        data: { commissionBps },
      }),
      transformResponse: (
        res: ApiEnvelope<{
          id: string;
          customCommissionBps: number | null;
          effectiveCommissionBps: number;
        }>,
      ) => res.data,
      invalidatesTags: ['Finance'],
    }),

    getPayouts: builder.query<Payout[], void>({
      query: () => ({ endpoint: endpoints.adminFinancePayouts, method: 'get' }),
      transformResponse: (res: ApiEnvelope<Payout[]>) => res.data,
      providesTags: ['Finance'],
    }),

    recordPayout: builder.mutation<Payout, RecordPayoutInput>({
      query: (data) => ({ endpoint: endpoints.adminFinancePayouts, method: 'post', data }),
      transformResponse: (res: ApiEnvelope<Payout>) => res.data,
      invalidatesTags: ['Finance'],
    }),

    deletePayout: builder.mutation<{ id: string }, string>({
      query: (payoutId) => ({ endpoint: endpoints.adminFinancePayout(payoutId), method: 'delete' }),
      transformResponse: (res: ApiEnvelope<{ id: string }>) => res.data,
      invalidatesTags: ['Finance'],
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
  useGetAdminUsersQuery,
  useGetAdminUserDetailQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  useCreatePenaltyMutation,
  useUpdatePenaltyStatusMutation,
  useDisableCodMutation,
  useEnableCodMutation,
  useGetPlatformConfigQuery,
  useUpdatePlatformConfigMutation,
  useGetFinanceOverviewQuery,
  useGetFinanceTransactionsQuery,
  useGetFinanceBreakdownQuery,
  useGetFinanceServicesQuery,
  useGetFinanceBalancesQuery,
  useGetFinanceBusinessesQuery,
  useSetBusinessCommissionMutation,
  useGetPayoutsQuery,
  useRecordPayoutMutation,
  useDeletePayoutMutation,
} = adminApi;
