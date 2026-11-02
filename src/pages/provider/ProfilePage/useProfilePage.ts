import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useUpdateMeMutation } from '@/redux/api/auth/authApi';
import { useGetMyBusinessesQuery, useUploadImageMutation } from '@/redux/api/provider/providerApi';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentUser } from '@/redux/slices/userSlice';

/** Account details + aggregate stats across all the provider's businesses. */
export function useProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.user.currentUser);
  const { data: businesses = [], isLoading } = useGetMyBusinessesQuery();
  const [updateMe, { isLoading: saving }] = useUpdateMeMutation();
  const [uploadImage, { isLoading: uploadingPhoto }] = useUploadImageMutation();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '' });
  const [error, setError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const services = businesses.reduce((sum, b) => sum + b.services.length, 0);
    const products = businesses.reduce((sum, b) => sum + (b.products?.length ?? 0), 0);
    const rated = businesses.filter((b) => b.ratingCount > 0);
    const avgRating = rated.length
      ? rated.reduce((sum, b) => sum + b.ratingAvg, 0) / rated.length
      : 0;
    return { businesses: businesses.length, services, products, avgRating };
  }, [businesses]);

  const startEdit = () => {
    setForm({ fullName: user?.fullName ?? '', email: user?.email ?? '' });
    setError(null);
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);
  const onField = (key: 'fullName' | 'email', value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const saveProfile = async () => {
    setError(null);
    try {
      const updated = await updateMe({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
      }).unwrap();
      dispatch(setCurrentUser(updated));
      setEditing(false);
    } catch {
      setError('Could not save. That email may already be in use.');
    }
  };

  /** Uploads a new avatar photo, then saves its URL onto the account. */
  const changePhoto = async (file: File) => {
    setPhotoError(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { url } = await uploadImage(fd).unwrap();
      const updated = await updateMe({ avatarUrl: url }).unwrap();
      dispatch(setCurrentUser(updated));
    } catch {
      setPhotoError('Could not upload that photo. Please try again.');
    }
  };

  return {
    user,
    businesses,
    isLoading,
    stats,
    editing,
    form,
    error,
    saving,
    startEdit,
    cancelEdit,
    onField,
    saveProfile,
    photoError,
    uploadingPhoto,
    changePhoto,
    openBusiness: (id: string) => navigate(`/businesses/${id}`),
  };
}
