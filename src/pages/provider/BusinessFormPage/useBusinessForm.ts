import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useGetCategoriesQuery } from '@/redux/api/category/categoryApi';
import {
  useCreateProviderMutation,
  useGetMyBusinessQuery,
  useUpdateBusinessMutation,
  useUploadBusinessImagesMutation,
} from '@/redux/api/provider/providerApi';

import { BusinessForm, BusinessFormErrors, PickedImage } from './types';
import { validateBusiness } from './validation';

const EMPTY: BusinessForm = {
  categoryId: '',
  subcategoryId: '',
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

/** Shared create/edit logic. Edit mode is active when a route :id is present. */
export function useBusinessForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: categories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();
  const { data: existing, isLoading: loadingExisting } = useGetMyBusinessQuery(id as string, {
    skip: !isEdit,
  });

  const [createProvider, { isLoading: creating }] = useCreateProviderMutation();
  const [updateBusiness, { isLoading: updating }] = useUpdateBusinessMutation();
  const [uploadImages, { isLoading: uploading }] = useUploadBusinessImagesMutation();

  const [form, setForm] = useState<BusinessForm>(EMPTY);
  const [images, setImages] = useState<PickedImage[]>([]);
  const [errors, setErrors] = useState<BusinessFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Prefill when editing.
  useEffect(() => {
    if (existing) {
      setForm({
        categoryId: existing.category.id,
        subcategoryId: existing.subcategory?.id ?? '',
        businessName: existing.businessName,
        phone: existing.phone,
        email: existing.email ?? '',
        description: existing.description ?? '',
        addressLine: existing.addressLine ?? '',
        city: existing.city ?? '',
        state: existing.state ?? '',
        postalCode: existing.postalCode ?? '',
      });
    }
  }, [existing]);

  // Revoke object URLs on unmount.
  useEffect(() => {
    return () => images.forEach((img) => URL.revokeObjectURL(img.preview));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectCategory = useCallback((categoryId: string) => {
    // Changing the category clears the previously selected business type.
    setForm((prev) => ({ ...prev, categoryId, subcategoryId: '' }));
    setErrors((prev) => ({ ...prev, categoryId: undefined }));
  }, []);

  const selectSubcategory = useCallback((subcategoryId: string) => {
    setForm((prev) => ({ ...prev, subcategoryId }));
    setErrors((prev) => ({ ...prev, subcategoryId: undefined }));
  }, []);

  // Business types available for the currently selected category.
  const subcategories = categories.find((c) => c.id === form.categoryId)?.subcategories ?? [];

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

      const validationErrors = validateBusiness(form);
      setErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) return;

      const payload = {
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId || undefined,
        businessName: form.businessName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        description: form.description.trim() || undefined,
        addressLine: form.addressLine.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        postalCode: form.postalCode.trim() || undefined,
      };

      try {
        if (isEdit && id) {
          await updateBusiness({ id, data: payload }).unwrap();
          navigate(`/businesses/${id}`);
        } else {
          const created = await createProvider(payload).unwrap();
          if (images.length > 0) {
            const fd = new FormData();
            images.forEach((img) => fd.append('images', img.file));
            await uploadImages({ id: created.id, formData: fd }).unwrap();
          }
          navigate(`/businesses/${created.id}`);
        }
      } catch {
        setServerError('Could not save. Please check your details and try again.');
      }
    },
    [form, images, isEdit, id, createProvider, updateBusiness, uploadImages, navigate],
  );

  return {
    isEdit,
    loadingExisting: isEdit && loadingExisting,
    categories,
    subcategories,
    categoriesLoading,
    form,
    images,
    errors,
    serverError,
    submitting: creating || updating || uploading,
    maxImages: MAX_IMAGES,
    selectCategory,
    selectSubcategory,
    onChange,
    addImages,
    removeImage,
    onSubmit,
    goBack: () => navigate(isEdit && id ? `/businesses/${id}` : '/businesses'),
  };
}
