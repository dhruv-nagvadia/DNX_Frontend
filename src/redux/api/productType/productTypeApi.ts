import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/api/apiConfig';
import { endpoints } from '@/api/endpoints';
import { ProductType } from './types';
import { ApiEnvelope } from '../types';

export const productTypeApi = createApi({
  reducerPath: 'productTypeApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    getProductTypes: builder.query<ProductType[], void>({
      query: () => ({ endpoint: endpoints.productTypes, method: 'get' }),
      transformResponse: (res: ApiEnvelope<ProductType[]>) => res.data,
      keepUnusedDataFor: 600,
    }),
  }),
});

export const { useGetProductTypesQuery } = productTypeApi;
