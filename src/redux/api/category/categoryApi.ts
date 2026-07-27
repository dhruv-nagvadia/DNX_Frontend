import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/api/apiConfig';
import { endpoints } from '@/api/endpoints';
import { Category } from './types';
import { ApiEnvelope } from '../types';

export const categoryApi = createApi({
  reducerPath: 'categoryApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Categories'],
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], void>({
      query: () => ({ endpoint: endpoints.categories, method: 'get' }),
      transformResponse: (res: ApiEnvelope<Category[]>) => res.data,
      providesTags: ['Categories'],
      keepUnusedDataFor: 600,
    }),
  }),
});

export const { useGetCategoriesQuery } = categoryApi;
