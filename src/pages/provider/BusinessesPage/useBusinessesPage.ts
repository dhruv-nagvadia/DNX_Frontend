import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useGetMyBusinessesQuery } from '@/redux/api/provider/providerApi';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { clearCurrentUser } from '@/redux/slices/userSlice';
import { tokenStorage } from '@/utils/tokenStorage';

export type TypeFilter = 'all' | 'service' | 'store';

/** Loads the provider's businesses, plus the page's search / type filter and
 * the summary-tile counts (always over ALL businesses, not the filtered list). */
export function useBusinessesPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.user.currentUser);
  const userName = currentUser?.fullName ?? '';

  const { data: businesses = [], isLoading } = useGetMyBusinessesQuery();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return businesses.filter((b) => {
      const isStore = b.type === 'STORE';
      if (typeFilter === 'service' && isStore) return false;
      if (typeFilter === 'store' && !isStore) return false;
      if (!q) return true;
      return [b.businessName, b.category.name, b.subcategory?.name, b.city]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q));
    });
  }, [businesses, search, typeFilter]);

  const counts = useMemo(
    () => ({
      total: businesses.length,
      verified: businesses.filter((b) => b.isVerified && !b.isBlocked).length,
      pending: businesses.filter((b) => !b.isVerified && !b.isBlocked).length,
      // Restricted by the platform: blocked, or Cash on Delivery turned off.
      attention: businesses.filter((b) => b.isBlocked || b.codDisabledByAdmin).length,
    }),
    [businesses],
  );

  const addBusiness = useCallback(() => navigate('/businesses/new'), [navigate]);
  const openBusiness = useCallback((id: string) => navigate(`/businesses/${id}`), [navigate]);
  const editBusiness = useCallback((id: string) => navigate(`/businesses/${id}/edit`), [navigate]);

  const logout = useCallback(() => {
    tokenStorage.clear();
    dispatch(clearCurrentUser());
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  return {
    userName,
    avatarUrl: currentUser?.avatarUrl ?? null,
    businesses,
    visible,
    counts,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    isLoading,
    addBusiness,
    openBusiness,
    editBusiness,
    logout,
  };
}
