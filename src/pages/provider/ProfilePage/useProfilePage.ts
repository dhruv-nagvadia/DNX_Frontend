import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useUpdateMeMutation } from '@/redux/api/auth/authApi';
import { useGetMyBusinessesQuery } from '@/redux/api/provider/providerApi';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrentUser } from '@/redux/slices/userSlice';

/** Account details + aggregate stats across all the provider's businesses. */
export function useProfilePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.user.currentUser);
  const { data: businesses = [], isLoading } = useGetMyBusinessesQuery();
  const [updateMe, { isLoading: saving }] = useUpdateMeMutation();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '' });
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const services = businesses.reduce((sum, b) => sum + b.services.length, 0);
    const photos = businesses.reduce((sum, b) => sum + b.images.length, 0);
    const rated = businesses.filter((b) => b.ratingCount > 0);
    const avgRating = rated.length
      ? rated.reduce((sum, b) => sum + b.ratingAvg, 0) / rated.length
      : 0;
    return { businesses: businesses.length, services, photos, avgRating };
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
      dispatch(
        setCurrentUser({
          id: updated.id,
          email: updated.email,
          fullName: updated.fullName,
          role: updated.role,
        }),
      );
      setEditing(false);
    } catch {
      setError('Could not save. That email may already be in use.');
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
    openBusiness: (id: string) => navigate(`/businesses/${id}`),
  };
}
