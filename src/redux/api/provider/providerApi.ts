import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/api/apiConfig';
import { endpoints } from '@/api/endpoints';
import {
  BusinessHour,
  CreateProviderRequest,
  ListProvidersParams,
  Provider,
  Service,
  ServiceInput,
} from './types';
import { ApiEnvelope, Paginated } from '../types';

export const providerApi = createApi({
  reducerPath: 'providerApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Providers', 'Provider', 'MyBusinesses', 'MyBusiness'],
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

    // Create a new business (a provider can own many).
    createProvider: builder.mutation<Provider, CreateProviderRequest>({
      query: (data) => ({ endpoint: endpoints.myProviders, method: 'post', data }),
      transformResponse: (res: ApiEnvelope<Provider>) => res.data,
      invalidatesTags: ['Providers', 'MyBusinesses'],
    }),

    // All businesses owned by the logged-in provider (businesses list).
    getMyBusinesses: builder.query<Provider[], void>({
      query: () => ({ endpoint: endpoints.myProviders, method: 'get' }),
      transformResponse: (res: ApiEnvelope<Provider[]>) => res.data,
      providesTags: ['MyBusinesses'],
    }),

    // One owned business (detail / edit).
    getMyBusiness: builder.query<Provider, string>({
      query: (id) => ({ endpoint: endpoints.myProviderById(id), method: 'get' }),
      transformResponse: (res: ApiEnvelope<Provider>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'MyBusiness', id }],
    }),

    // Update an owned business.
    updateBusiness: builder.mutation<Provider, { id: string; data: Partial<CreateProviderRequest> }>({
      query: ({ id, data }) => ({ endpoint: endpoints.myProviderById(id), method: 'patch', data }),
      transformResponse: (res: ApiEnvelope<Provider>) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'MyBusiness', id }, 'MyBusinesses'],
    }),

    // Upload gallery images to a specific owned business (multipart/form-data).
    uploadBusinessImages: builder.mutation<Provider, { id: string; formData: FormData }>({
      query: ({ id, formData }) => ({
        endpoint: endpoints.myProviderImages(id),
        method: 'post',
        data: formData,
      }),
      transformResponse: (res: ApiEnvelope<Provider>) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'MyBusiness', id }, 'MyBusinesses'],
    }),

    // ── Services ────────────────────────────────────────────────────────────
    createService: builder.mutation<Service, { providerId: string; data: ServiceInput }>({
      query: ({ providerId, data }) => ({
        endpoint: endpoints.providerServices(providerId),
        method: 'post',
        data,
      }),
      transformResponse: (res: ApiEnvelope<Service>) => res.data,
      invalidatesTags: (_r, _e, { providerId }) => [{ type: 'MyBusiness', id: providerId }],
    }),

    updateService: builder.mutation<
      Service,
      { providerId: string; serviceId: string; data: Partial<ServiceInput> & { isActive?: boolean } }
    >({
      query: ({ providerId, serviceId, data }) => ({
        endpoint: endpoints.providerService(providerId, serviceId),
        method: 'patch',
        data,
      }),
      transformResponse: (res: ApiEnvelope<Service>) => res.data,
      invalidatesTags: (_r, _e, { providerId }) => [{ type: 'MyBusiness', id: providerId }],
    }),

    deleteService: builder.mutation<null, { providerId: string; serviceId: string }>({
      query: ({ providerId, serviceId }) => ({
        endpoint: endpoints.providerService(providerId, serviceId),
        method: 'delete',
      }),
      invalidatesTags: (_r, _e, { providerId }) => [{ type: 'MyBusiness', id: providerId }],
    }),

    // Replace the weekly business hours.
    setBusinessHours: builder.mutation<Provider, { id: string; hours: BusinessHour[] }>({
      query: ({ id, hours }) => ({
        endpoint: endpoints.myProviderHours(id),
        method: 'put',
        data: { hours },
      }),
      transformResponse: (res: ApiEnvelope<Provider>) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'MyBusiness', id }],
    }),
  }),
});

export const {
  useGetProvidersQuery,
  useLazyGetProvidersQuery,
  useGetProviderByIdQuery,
  useCreateProviderMutation,
  useGetMyBusinessesQuery,
  useGetMyBusinessQuery,
  useUpdateBusinessMutation,
  useUploadBusinessImagesMutation,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useSetBusinessHoursMutation,
} = providerApi;
