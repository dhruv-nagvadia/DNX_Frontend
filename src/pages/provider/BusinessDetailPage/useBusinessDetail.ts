import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  useGetBusinessBookingsQuery,
  useGetMyBusinessQuery,
  useUploadBusinessImagesMutation,
} from '@/redux/api/provider/providerApi';

export type BusinessTab = 'overview' | 'services' | 'bookings' | 'photos' | 'hours';

/** Loads one owned business and exposes image-upload + navigation actions. */
export function useBusinessDetail() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();

  const { data: business, isLoading, error } = useGetMyBusinessQuery(id, { skip: !id });
  const { data: bookings } = useGetBusinessBookingsQuery(id, { skip: !id });
  const [uploadImages, { isLoading: uploading }] = useUploadBusinessImagesMutation();
  const [activeTab, setActiveTab] = useState<BusinessTab>('overview');

  const notFound = !!error && (error as { status?: number }).status === 404;
  const bookingCount = bookings?.length ?? 0;

  const addImages = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0 || !id) return;
      const fd = new FormData();
      Array.from(fileList).forEach((file) => fd.append('images', file));
      try {
        await uploadImages({ id, formData: fd }).unwrap();
      } catch {
        // surfaced via mutation state; keep UI resilient
      }
    },
    [id, uploadImages],
  );

  return {
    business,
    isLoading,
    notFound,
    uploading,
    bookingCount,
    activeTab,
    setActiveTab,
    addImages,
    goToEdit: () => navigate(`/businesses/${id}/edit`),
    goToReviews: () => navigate(`/businesses/${id}/reviews`),
    goBack: () => navigate('/businesses'),
  };
}
