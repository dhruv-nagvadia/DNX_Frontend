import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/api/apiConfig';
import { endpoints } from '@/api/endpoints';
import { AppNotification } from './types';
import { ApiEnvelope } from '../types';

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Notifications', 'UnreadCount'],
  endpoints: (builder) => ({
    getNotifications: builder.query<AppNotification[], void>({
      query: () => ({ endpoint: endpoints.notifications, method: 'get' }),
      transformResponse: (res: ApiEnvelope<AppNotification[]>) => res.data,
      providesTags: ['Notifications'],
    }),
    getUnreadCount: builder.query<number, void>({
      query: () => ({ endpoint: endpoints.notificationsUnreadCount, method: 'get' }),
      transformResponse: (res: ApiEnvelope<{ count: number }>) => res.data.count,
      providesTags: ['UnreadCount'],
    }),
    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({ endpoint: endpoints.notificationRead(id), method: 'patch' }),
      invalidatesTags: ['Notifications', 'UnreadCount'],
    }),
    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({ endpoint: endpoints.notificationsReadAll, method: 'patch' }),
      invalidatesTags: ['Notifications', 'UnreadCount'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationApi;
