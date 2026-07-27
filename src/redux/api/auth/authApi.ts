import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/api/apiConfig';
import { endpoints } from '@/api/endpoints';
import { AuthData, AuthUser, LoginRequest, RegisterRequest } from './types';
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
  }),
});

export const { useLoginMutation, useRegisterMutation, useGetMeQuery, useLazyGetMeQuery } = authApi;
