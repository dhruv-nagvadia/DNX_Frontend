import { useState, useCallback } from 'react';

import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadImageMutation,
} from '@/redux/api/provider/providerApi';
import { Product } from '@/redux/api/provider/types';
import { ProductForm } from './types';

const EMPTY: ProductForm = {
  name: '',
  price: '',
  unit: 'kg',
  section: '',
  stockQty: '0',
  imageUrl: '',
  description: '',
};

/** All state + handlers for adding, editing, and deleting a store's products. */
export function useProductsManager(providerId: string) {
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [uploadImage, { isLoading: uploadingImage }] = useUploadImageMutation();

  // null = not editing, 'new' = adding, otherwise the productId being edited.
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const startAdd = useCallback(() => {
    setForm(EMPTY);
    setError(null);
    setEditing('new');
  }, []);

  const startEdit = useCallback((p: Product) => {
    setForm({
      name: p.name,
      price: String(p.priceMinor / 100),
      unit: p.unit,
      section: p.section ?? '',
      stockQty: String(p.stockQty),
      imageUrl: p.imageUrl ?? '',
      description: p.description ?? '',
    });
    setError(null);
    setEditing(p.id);
  }, []);

  const cancel = useCallback(() => {
    setEditing(null);
    setError(null);
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  // Upload a device image and store its hosted URL on the form.
  const pickImage = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      setError(null);
      const fd = new FormData();
      fd.append('image', file);
      try {
        const { url } = await uploadImage(fd).unwrap();
        setForm((prev) => ({ ...prev, imageUrl: url }));
      } catch {
        setError('Could not upload the image. Please try again.');
      }
    },
    [uploadImage],
  );

  const clearImage = useCallback(() => setForm((prev) => ({ ...prev, imageUrl: '' })), []);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const price = Number(form.price);
      const stockQty = Number(form.stockQty);
      if (form.name.trim().length < 2) return setError('Enter a product name');
      if (Number.isNaN(price) || price < 0) return setError('Enter a valid price');
      if (Number.isNaN(stockQty) || stockQty < 0) return setError('Enter a valid stock quantity');

      const data = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price,
        unit: form.unit || 'kg',
        section: form.section.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        stockQty,
      };

      try {
        if (editing === 'new') {
          await createProduct({ providerId, data }).unwrap();
        } else if (editing) {
          await updateProduct({ providerId, productId: editing, data }).unwrap();
        }
        setEditing(null);
      } catch {
        setError('Could not save the product. Please try again.');
      }
    },
    [editing, form, providerId, createProduct, updateProduct],
  );

  const remove = useCallback(
    async (productId: string) => {
      if (!window.confirm('Delete this product?')) return;
      await deleteProduct({ providerId, productId })
        .unwrap()
        .catch(() => undefined);
    },
    [providerId, deleteProduct],
  );

  const toggleActive = useCallback(
    async (p: Product) => {
      await updateProduct({
        providerId,
        productId: p.id,
        data: { isActive: !(p.isActive ?? true) },
      })
        .unwrap()
        .catch(() => undefined);
    },
    [providerId, updateProduct],
  );

  return {
    editing,
    form,
    error,
    saving: creating || updating,
    uploadingImage,
    startAdd,
    startEdit,
    cancel,
    onChange,
    pickImage,
    clearImage,
    submit,
    remove,
    toggleActive,
  };
}
