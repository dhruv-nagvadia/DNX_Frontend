import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useGetMyBusinessesQuery } from '@/redux/api/provider/providerApi';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { clearCurrentUser } from '@/redux/slices/userSlice';
import { tokenStorage } from '@/utils/tokenStorage';

/** Loads the provider's businesses and exposes navigation + logout. */
export function useBusinessesPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const userName = useAppSelector((s) => s.user.currentUser?.fullName ?? '');

  const { data: businesses = [], isLoading } = useGetMyBusinessesQuery();

  const addBusiness = useCallback(() => navigate('/businesses/new'), [navigate]);
  const openBusiness = useCallback((id: string) => navigate(`/businesses/${id}`), [navigate]);
  const editBusiness = useCallback((id: string) => navigate(`/businesses/${id}/edit`), [navigate]);

  const logout = useCallback(() => {
    tokenStorage.clear();
    dispatch(clearCurrentUser());
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  return { userName, businesses, isLoading, addBusiness, openBusiness, editBusiness, logout };
}
