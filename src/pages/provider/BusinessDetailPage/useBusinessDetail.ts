import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  useDeleteBusinessMutation,
  useGetBusinessBookingsQuery,
  useGetMyBusinessQuery,
  useSetBusinessImagesMutation,
  useUploadBusinessImagesMutation,
} from '@/redux/api/provider/providerApi';
import { isRasterImage, IMAGE_REJECT_MSG } from '@/utils/imageValidation';

export type BusinessTab =
  | 'overview'
  | 'services'
  | 'products'
  | 'bookings'
  | 'photos'
  | 'calendar';

/** Loads one owned business and exposes image-upload + navigation actions. */
export function useBusinessDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id = '' } = useParams<{ id: string }>();

  const { data: business, isLoading, error } = useGetMyBusinessQuery(id, { skip: !id });
  const { data: bookings } = useGetBusinessBookingsQuery(id, { skip: !id });
  const [uploadImages, { isLoading: uploading }] = useUploadBusinessImagesMutation();
  const [setImages, { isLoading: savingImages }] = useSetBusinessImagesMutation();
  const [deleteBusiness, { isLoading: deleting }] = useDeleteBusinessMutation();
  // Allow deep-linking to a specific tab (e.g. dashboard → an order opens Orders).
  const initialTab = (location.state as { tab?: BusinessTab } | null)?.tab ?? 'overview';
  const [activeTab, setActiveTab] = useState<BusinessTab>(initialTab);

  const notFound = !!error && (error as { status?: number }).status === 404;
  // Any other load failure (e.g. server down / not restarted after a schema change).
  const loadFailed = !!error && !notFound;
  const bookingCount = bookings?.length ?? 0;

  const addImages = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0 || !id) return;
      const files = Array.from(fileList).filter(isRasterImage);
      if (files.length !== fileList.length) window.alert(IMAGE_REJECT_MSG);
      if (files.length === 0) return;
      const fd = new FormData();
      files.forEach((file) => fd.append('images', file));
      try {
        await uploadImages({ id, formData: fd }).unwrap();
      } catch {
        // surfaced via mutation state; keep UI resilient
      }
    },
    [id, uploadImages],
  );

  // Move a photo to the front so it becomes the cover.
  const setCover = useCallback(
    async (url: string) => {
      if (!id || !business) return;
      const images = [url, ...business.images.filter((u) => u !== url)];
      try {
        await setImages({ id, images }).unwrap();
      } catch {
        // surfaced via mutation state
      }
    },
    [id, business, setImages],
  );

  // Drop a photo from the gallery.
  const removeImage = useCallback(
    async (url: string) => {
      if (!id || !business) return;
      const images = business.images.filter((u) => u !== url);
      try {
        await setImages({ id, images }).unwrap();
      } catch {
        // surfaced via mutation state
      }
    },
    [id, business, setImages],
  );

  // Permanently delete this business, then return to the list.
  const remove = useCallback(async () => {
    if (!id) return;
    try {
      await deleteBusiness(id).unwrap();
      navigate('/businesses', { replace: true });
    } catch {
      // surfaced via mutation state
    }
  }, [id, deleteBusiness, navigate]);

  return {
    business,
    isLoading,
    notFound,
    loadFailed,
    uploading,
    savingImages,
    deleting,
    bookingCount,
    activeTab,
    setActiveTab,
    addImages,
    setCover,
    removeImage,
    remove,
    goToEdit: () => navigate(`/businesses/${id}/edit`),
    goToReviews: () => navigate(`/businesses/${id}/reviews`),
    goBack: () => navigate('/businesses'),
  };
}
