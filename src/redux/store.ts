import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

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

// Enables refetchOnFocus/refetchOnReconnect for every query below — without
// this, a cached result (e.g. "0 orders" fetched before any orders existed)
// never updates until a hard page reload, since nothing else ever
// invalidates it (new orders come from the customer app, a separate client).
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
