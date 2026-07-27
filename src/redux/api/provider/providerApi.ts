import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/api/apiConfig';
import { endpoints } from '@/api/endpoints';
import { CreateProviderRequest, ListProvidersParams, Provider } from './types';
import { ApiEnvelope, Paginated } from '../types';

export const providerApi = createApi({
  reducerPath: 'providerApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Providers', 'Provider', 'MyProvider'],
  endpoints: (builder) => ({
    getProviders: builder.query<Paginated<Provider>, ListProvidersParams | void>({
      query: (params) => ({
        endpoint: endpoints.providers,
        method: 'get',
        params: params ?? undefined,
      }),
      transformResponse: (res: ApiEnvelope<Paginated<Provider>>) => res.data,
      providesTags: ['Providers'],
    }),

    getProviderById: builder.query<Provider, string>({
      query: (id) => ({ endpoint: endpoints.providerById(id), method: 'get' }),
      transformResponse: (res: ApiEnvelope<Provider>) => res.data,
      providesTags: (_result, _error, id) => [{ type: 'Provider', id }],
    }),

    // Provider creates their own business profile (requires PROVIDER auth).
    createProvider: builder.mutation<Provider, CreateProviderRequest>({
      query: (data) => ({ endpoint: endpoints.providers, method: 'post', data }),
      transformResponse: (res: ApiEnvelope<Provider>) => res.data,
      invalidatesTags: ['Providers', 'MyProvider'],
    }),

    // The logged-in provider's own profile (for the dashboard).
    getMyProvider: builder.query<Provider, void>({
      query: () => ({ endpoint: endpoints.myProvider, method: 'get' }),
      transformResponse: (res: ApiEnvelope<Provider>) => res.data,
      providesTags: ['MyProvider'],
    }),

    // Upload business gallery images (multipart/form-data).
    uploadProviderImages: builder.mutation<Provider, FormData>({
      query: (formData) => ({
        endpoint: endpoints.myProviderImages,
        method: 'post',
        data: formData,
      }),
      transformResponse: (res: ApiEnvelope<Provider>) => res.data,
      invalidatesTags: ['MyProvider'],
    }),
  }),
});

export const {
  useGetProvidersQuery,
  useLazyGetProvidersQuery,
  useGetProviderByIdQuery,
  useCreateProviderMutation,
  useGetMyProviderQuery,
  useUploadProviderImagesMutation,
} = providerApi;
