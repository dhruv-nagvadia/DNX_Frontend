import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useGetCategoriesQuery } from '@/redux/api/category/categoryApi';
import {
  useCreateProviderMutation,
  useUploadProviderImagesMutation,
} from '@/redux/api/provider/providerApi';
import { useAppSelector } from '@/redux/hooks';

import { OnboardingErrors, OnboardingForm, PickedImage } from './types';
import { validateOnboarding } from './validation';

const EMPTY: OnboardingForm = {
  categoryId: '',
  businessName: '',
  phone: '',
  email: '',
  description: '',
  addressLine: '',
  city: '',
  state: '',
  postalCode: '',
};

const MAX_IMAGES = 8;

/** State, category data, image picking, and submit handler for onboarding. */
export function useOnboardingPage() {
  const navigate = useNavigate();
  const userName = useAppSelector((s) => s.user.currentUser?.fullName ?? '');

  const { data: categories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();
  const [createProvider, { isLoading: creating }] = useCreateProviderMutation();
  const [uploadImages, { isLoading: uploading }] = useUploadProviderImagesMutation();

  const [form, setForm] = useState<OnboardingForm>(EMPTY);
  const [images, setImages] = useState<PickedImage[]>([]);
  const [errors, setErrors] = useState<OnboardingErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Revoke object URLs on unmount to avoid memory leaks.
  useEffect(() => {
    return () => images.forEach((img) => URL.revokeObjectURL(img.preview));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectCategory = useCallback((categoryId: string) => {
    setForm((prev) => ({ ...prev, categoryId }));
    setErrors((prev) => ({ ...prev, categoryId: undefined }));
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const addImages = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...incoming].slice(0, MAX_IMAGES));
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);

      const validationErrors = validateOnboarding(form);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;

      try {
        // 1) Create the profile.
        await createProvider({
          categoryId: form.categoryId,
          businessName: form.businessName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          description: form.description.trim() || undefined,
          addressLine: form.addressLine.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          postalCode: form.postalCode.trim() || undefined,
        }).unwrap();

        // 2) Upload images (if any) to the freshly created profile.
        if (images.length > 0) {
          const fd = new FormData();
          images.forEach((img) => fd.append('images', img.file));
          await uploadImages(fd).unwrap();
        }

        setSuccess(true);
      } catch (err) {
        const status = (err as { status?: number })?.status;
        setServerError(
          status === 409
            ? 'You already have a business profile.'
            : 'Could not save your business. Please try again.',
        );
      }
    },
    [form, images, createProvider, uploadImages],
  );

  const goToDashboard = useCallback(() => navigate('/dashboard'), [navigate]);

  return {
    userName,
    categories,
    categoriesLoading,
    form,
    images,
    errors,
    serverError,
    submitting: creating || uploading,
    success,
    maxImages: MAX_IMAGES,
    selectCategory,
    onChange,
    addImages,
    removeImage,
    onSubmit,
    goToDashboard,
  };
}
