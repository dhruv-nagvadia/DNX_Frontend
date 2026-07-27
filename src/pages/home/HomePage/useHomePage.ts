import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { useGetCategoriesQuery } from '@/redux/api/category/categoryApi';
import { useAppSelector } from '@/redux/hooks';
import { Category } from '@/redux/api/category/types';
import { HomePageState } from './types';

/** All state, data-fetching, and handlers for HomePage. */
export function useHomePage(): HomePageState {
  const navigate = useNavigate();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const { data: categories = [], isLoading } = useGetCategoriesQuery();

  const onCategoryClick = useCallback(
    (category: Category) => {
      navigate(`/providers?category=${category.slug}`);
    },
    [navigate],
  );

  return {
    userName: currentUser?.fullName ?? 'there',
    categories,
    isLoading,
    onCategoryClick,
  };
}
