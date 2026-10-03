import { configureStore } from '@reduxjs/toolkit';

import userReducer from './slices/userSlice';
import { authApi } from './api/auth/authApi';
import { categoryApi } from './api/category/categoryApi';
import { providerApi } from './api/provider/providerApi';
import { notificationApi } from './api/notification/notificationApi';
import { adminApi } from './api/admin/adminApi';
import { productTypeApi } from './api/productType/productTypeApi';

const store = configureStore({
  reducer: {
    user: userReducer,
    [authApi.reducerPath]: authApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [providerApi.reducerPath]: providerApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [productTypeApi.reducerPath]: productTypeApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      categoryApi.middleware,
      providerApi.middleware,
      notificationApi.middleware,
      adminApi.middleware,
      productTypeApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
