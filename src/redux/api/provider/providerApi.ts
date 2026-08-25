import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/api/apiConfig';
import { endpoints } from '@/api/endpoints';
import {
  BusinessHour,
  BusinessReview,
  BookingStatus,
  CreateProviderRequest,
  DashboardBooking,
  DateHour,
  DateHourInput,
  ListProvidersParams,
  OrderStatus,
  PaymentStatus,
  Product,
  ProductInput,
  Provider,
  ProviderBooking,
  ProviderOrder,
  Service,
  ServiceInput,
} from './types';
import { ApiEnvelope, Paginated } from '../types';

export const providerApi = createApi({
  reducerPath: 'providerApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    'Providers',
    'Provider',
    'MyBusinesses',
    'MyBusiness',
    'MyBusinessBookings',
    'AllBookings',
    'MyOrders',
    'BusinessReviews',
    'DateHours',
  ],
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

    // Bookings for one owned business (provider dashboard).
    getBusinessBookings: builder.query<ProviderBooking[], string>({
      query: (id) => ({ endpoint: endpoints.myProviderBookings(id), method: 'get' }),
      transformResponse: (res: ApiEnvelope<ProviderBooking[]>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'MyBusinessBookings', id }],
    }),

    // Every booking across all owned businesses (home dashboard).
    getAllMyBookings: builder.query<DashboardBooking[], void>({
      query: () => ({ endpoint: endpoints.myAllBookings, method: 'get' }),
      transformResponse: (res: ApiEnvelope<DashboardBooking[]>) => res.data,
      providesTags: ['AllBookings'],
    }),

    // ── Store orders (provider management) ────────────────────────────────────
    getMyOrders: builder.query<ProviderOrder[], void>({
      query: () => ({ endpoint: endpoints.myOrders, method: 'get' }),
      transformResponse: (res: ApiEnvelope<ProviderOrder[]>) => res.data,
      providesTags: ['MyOrders'],
    }),

    updateOrderStatus: builder.mutation<
      ProviderOrder,
      { orderId: string; providerId: string; status: OrderStatus; reason?: string }
    >({
      query: ({ orderId, status, reason }) => ({
        endpoint: endpoints.myOrder(orderId),
        method: 'patch',
        data: { status, reason },
      }),
      transformResponse: (res: ApiEnvelope<ProviderOrder>) => res.data,
      // Cancelling restores stock, so refresh the business too.
      invalidatesTags: (_r, _e, { providerId }) => ['MyOrders', { type: 'MyBusiness', id: providerId }],
    }),

    collectOrderPayment: builder.mutation<ProviderOrder, { orderId: string; providerId: string }>({
      query: ({ orderId }) => ({ endpoint: endpoints.myOrderCollect(orderId), method: 'post' }),
      transformResponse: (res: ApiEnvelope<ProviderOrder>) => res.data,
      invalidatesTags: ['MyOrders'],
    }),

    // Provider changes a booking's status (confirm / complete / cancel + reason).
    updateBookingStatus: builder.mutation<
      ProviderBooking,
      { id: string; bookingId: string; status: BookingStatus; reason?: string }
    >({
      query: ({ id, bookingId, status, reason }) => ({
        endpoint: endpoints.myProviderBooking(id, bookingId),
        method: 'patch',
        data: { status, reason },
      }),
      transformResponse: (res: ApiEnvelope<ProviderBooking>) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'MyBusinessBookings', id }, 'AllBookings'],
    }),

    // Provider marks the outstanding cash balance as collected (cash / partial-remaining).
    collectBookingPayment: builder.mutation<
      { bookingId: string; paymentStatus: PaymentStatus; amountPaidMinor: number },
      { id: string; bookingId: string }
    >({
      query: ({ id, bookingId }) => ({
        endpoint: endpoints.myProviderBookingCollect(id, bookingId),
        method: 'post',
      }),
      transformResponse: (
        res: ApiEnvelope<{ bookingId: string; paymentStatus: PaymentStatus; amountPaidMinor: number }>,
      ) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'MyBusinessBookings', id }, 'AllBookings'],
    }),

    // Reviews for one owned business.
    getBusinessReviews: builder.query<BusinessReview[], string>({
      query: (id) => ({ endpoint: endpoints.myProviderReviews(id), method: 'get' }),
      transformResponse: (res: ApiEnvelope<BusinessReview[]>) => res.data,
      providesTags: (_r, _e, id) => [{ type: 'BusinessReviews', id }],
    }),

    // Update an owned business.
    updateBusiness: builder.mutation<Provider, { id: string; data: Partial<CreateProviderRequest> }>({
      query: ({ id, data }) => ({ endpoint: endpoints.myProviderById(id), method: 'patch', data }),
      transformResponse: (res: ApiEnvelope<Provider>) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'MyBusiness', id }, 'MyBusinesses'],
    }),

    // Permanently delete an owned business (and all its bookings/reviews/etc).
    deleteBusiness: builder.mutation<{ id: string }, string>({
      query: (id) => ({ endpoint: endpoints.myProviderById(id), method: 'delete' }),
      transformResponse: (res: ApiEnvelope<{ id: string }>) => res.data,
      invalidatesTags: ['MyBusinesses', 'AllBookings'],
    }),

    // Upload a single image (e.g. a product photo) and get its hosted URL.
    uploadImage: builder.mutation<{ url: string }, FormData>({
      query: (formData) => ({ endpoint: endpoints.uploadImage, method: 'post', data: formData }),
      transformResponse: (res: ApiEnvelope<{ url: string }>) => res.data,
    }),

    // Replace the ordered gallery (set cover / remove / reorder photos).
    setBusinessImages: builder.mutation<Provider, { id: string; images: string[] }>({
      query: ({ id, images }) => ({
        endpoint: endpoints.myProviderImages(id),
        method: 'put',
        data: { images },
      }),
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

    // ── Products (STORE catalog) ──────────────────────────────────────────────
    createProduct: builder.mutation<Product, { providerId: string; data: ProductInput }>({
      query: ({ providerId, data }) => ({
        endpoint: endpoints.providerProducts(providerId),
        method: 'post',
        data,
      }),
      transformResponse: (res: ApiEnvelope<Product>) => res.data,
      invalidatesTags: (_r, _e, { providerId }) => [{ type: 'MyBusiness', id: providerId }],
    }),

    updateProduct: builder.mutation<
      Product,
      { providerId: string; productId: string; data: Partial<ProductInput> & { isActive?: boolean } }
    >({
      query: ({ providerId, productId, data }) => ({
        endpoint: endpoints.providerProduct(providerId, productId),
        method: 'patch',
        data,
      }),
      transformResponse: (res: ApiEnvelope<Product>) => res.data,
      invalidatesTags: (_r, _e, { providerId }) => [{ type: 'MyBusiness', id: providerId }],
    }),

    deleteProduct: builder.mutation<null, { providerId: string; productId: string }>({
      query: ({ providerId, productId }) => ({
        endpoint: endpoints.providerProduct(providerId, productId),
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

    // ── Date-specific hour overrides ─────────────────────────────────────────
    getDateHours: builder.query<DateHour[], { id: string; from: string; to: string }>({
      query: ({ id, from, to }) => ({
        endpoint: endpoints.myProviderDateHours(id),
        method: 'get',
        params: { from, to },
      }),
      transformResponse: (res: ApiEnvelope<DateHour[]>) => res.data,
      providesTags: (_r, _e, { id }) => [{ type: 'DateHours', id }],
    }),

    setDateHour: builder.mutation<DateHour, { id: string; data: DateHourInput }>({
      query: ({ id, data }) => ({
        endpoint: endpoints.myProviderDateHours(id),
        method: 'put',
        data,
      }),
      transformResponse: (res: ApiEnvelope<DateHour>) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'DateHours', id }],
    }),

    deleteDateHour: builder.mutation<{ date: string }, { id: string; date: string }>({
      query: ({ id, date }) => ({
        endpoint: `${endpoints.myProviderDateHours(id)}/${date}`,
        method: 'delete',
      }),
      transformResponse: (res: ApiEnvelope<{ date: string }>) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: 'DateHours', id }],
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
  useGetBusinessBookingsQuery,
  useGetAllMyBookingsQuery,
  useGetMyOrdersQuery,
  useUpdateOrderStatusMutation,
  useCollectOrderPaymentMutation,
  useUpdateBookingStatusMutation,
  useCollectBookingPaymentMutation,
  useGetBusinessReviewsQuery,
  useUpdateBusinessMutation,
  useDeleteBusinessMutation,
  useSetBusinessImagesMutation,
  useUploadImageMutation,
  useUploadBusinessImagesMutation,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useSetBusinessHoursMutation,
  useGetDateHoursQuery,
  useSetDateHourMutation,
  useDeleteDateHourMutation,
} = providerApi;
