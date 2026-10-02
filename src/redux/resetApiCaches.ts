import { AppDispatch } from './store';
import { authApi } from './api/auth/authApi';
import { categoryApi } from './api/category/categoryApi';
import { providerApi } from './api/provider/providerApi';
import { notificationApi } from './api/notification/notificationApi';
import { adminApi } from './api/admin/adminApi';

/**
 * Wipes every RTK Query cache. Each `createApi` instance keeps its own cache
 * keyed by endpoint+args, with no per-user scoping — a query with no args
 * (e.g. "my businesses") reuses the exact same cache entry across accounts,
 * so switching accounts without this would keep showing the previous
 * account's data until a hard refresh wipes all client-side JS state.
 * Call this right after a successful login AND on logout, since either one
 * can leave a stale, still-warm cache from the other account.
 */
export function resetAllApiCaches(dispatch: AppDispatch): void {
  dispatch(authApi.util.resetApiState());
  dispatch(categoryApi.util.resetApiState());
  dispatch(providerApi.util.resetApiState());
  dispatch(notificationApi.util.resetApiState());
  dispatch(adminApi.util.resetApiState());
}
