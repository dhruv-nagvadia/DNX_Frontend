import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useGetMyBusinessesQuery } from '@/redux/api/provider/providerApi';
import { useAppSelector } from '@/redux/hooks';

/** Account details + aggregate stats across all the provider's businesses. */
export function useProfilePage() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.user.currentUser);
  const { data: businesses = [], isLoading } = useGetMyBusinessesQuery();

  const stats = useMemo(() => {
    const services = businesses.reduce((sum, b) => sum + b.services.length, 0);
    const photos = businesses.reduce((sum, b) => sum + b.images.length, 0);
    const rated = businesses.filter((b) => b.ratingCount > 0);
    const avgRating = rated.length
      ? rated.reduce((sum, b) => sum + b.ratingAvg, 0) / rated.length
      : 0;
    return { businesses: businesses.length, services, photos, avgRating };
  }, [businesses]);

  return {
    user,
    businesses,
    isLoading,
    stats,
    openBusiness: (id: string) => navigate(`/businesses/${id}`),
  };
}
