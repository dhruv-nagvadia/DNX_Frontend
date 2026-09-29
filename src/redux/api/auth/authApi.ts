import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/api/apiConfig';
import { endpoints } from '@/api/endpoints';
import {
  AuthData,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  RequestPasswordResetRequest,
  ResetPasswordRequest,
} from './types';
import { ApiEnvelope } from '../types';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Me'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthData, LoginRequest>({
      query: (data) => ({ endpoint: endpoints.login, method: 'post', data }),
      transformResponse: (res: ApiEnvelope<AuthData>) => res.data,
      invalidatesTags: ['Me'],
    }),

    register: builder.mutation<AuthData, RegisterRequest>({
      query: (data) => ({ endpoint: endpoints.register, method: 'post', data }),
      transformResponse: (res: ApiEnvelope<AuthData>) => res.data,
      invalidatesTags: ['Me'],
    }),

    getMe: builder.query<AuthUser, void>({
      query: () => ({ endpoint: endpoints.me, method: 'get' }),
      transformResponse: (res: ApiEnvelope<AuthUser>) => res.data,
      providesTags: ['Me'],
    }),

    updateMe: builder.mutation<AuthUser, { fullName?: string; email?: string; phone?: string }>({
      query: (data) => ({ endpoint: endpoints.me, method: 'patch', data }),
      transformResponse: (res: ApiEnvelope<AuthUser>) => res.data,
      invalidatesTags: ['Me'],
    }),

    requestPasswordReset: builder.mutation<void, RequestPasswordResetRequest>({
      query: (data) => ({ endpoint: endpoints.forgotPassword, method: 'post', data }),
      transformResponse: () => undefined,
    }),

    resetPassword: builder.mutation<void, ResetPasswordRequest>({
      query: (data) => ({ endpoint: endpoints.resetPassword, method: 'post', data }),
      transformResponse: () => undefined,
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useUpdateMeMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
} = authApi;
