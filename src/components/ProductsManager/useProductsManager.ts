import { useState, useCallback } from 'react';

import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadImageMutation,
} from '@/redux/api/provider/providerApi';
import { Measure, Product } from '@/redux/api/provider/types';
import { measureUnits, splitAmount, toBase } from '@/utils/units';
import { isRasterImage, IMAGE_REJECT_MSG } from '@/utils/imageValidation';
import { ProductForm } from './types';

const EMPTY: ProductForm = {
  name: '',
  description: '',
  measure: 'weight',
  price: '',
  priceQty: '1',
  priceUnit: 'kg',
  stock: '0',
  stockUnit: 'kg',
  step: '100',
  stepUnit: 'g',
  section: '',
  imageUrl: '',
};

/** All state + handlers for adding, editing, and deleting a store's products. */
export function useProductsManager(providerId: string) {
  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [uploadImage, { isLoading: uploadingImage }] = useUploadImageMutation();

  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const startAdd = useCallback(() => {
    setForm(EMPTY);
    setError(null);
    setEditing('new');
  }, []);

  const startEdit = useCallback((p: Product) => {
    const price = splitAmount(p.priceQty, p.measure);
    const stock = splitAmount(p.stockQty, p.measure);
    const step = splitAmount(p.stepQty, p.measure);
    setForm({
      name: p.name,
      description: p.description ?? '',
      measure: p.measure,
      price: String(p.priceMinor / 100),
      priceQty: String(price.value),
      priceUnit: price.unit,
      stock: String(stock.value),
      stockUnit: stock.unit,
      step: String(step.value),
      stepUnit: step.unit,
      section: p.section ?? '',
      imageUrl: p.imageUrl ?? '',
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

  // Switching measure resets the unit dropdowns to that measure's units.
  const selectMeasure = useCallback((measure: Measure) => {
    const units = measureUnits(measure);
    const big = units[0].value; // kg / litre / piece
    const small = units[units.length - 1].value; // g / ml / dozen…
    setForm((prev) => ({
      ...prev,
      measure,
      priceUnit: big,
      stockUnit: big,
      stepUnit: measure === 'count' ? big : small,
    }));
  }, []);

  const pickImage = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      if (!isRasterImage(file)) {
        setError(IMAGE_REJECT_MSG);
        return;
      }
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
      const priceQtyBase = toBase(Number(form.priceQty), form.measure, form.priceUnit);
      const stockBase = toBase(Number(form.stock), form.measure, form.stockUnit);
      const stepBase = toBase(Number(form.step), form.measure, form.stepUnit);

      if (form.name.trim().length < 2) return setError('Enter a product name');
      if (Number.isNaN(price) || price < 0) return setError('Enter a valid price');
      if (!priceQtyBase || priceQtyBase <= 0) return setError('Enter the quantity the price is for');
      if (!stepBase || stepBase <= 0) return setError('Enter a valid minimum quantity');
      if (Number.isNaN(stockBase) || stockBase < 0) return setError('Enter a valid stock quantity');

      const data = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        measure: form.measure,
        price,
        priceQty: priceQtyBase,
        stockQty: stockBase,
        stepQty: stepBase,
        section: form.section.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
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
    selectMeasure,
    pickImage,
    clearImage,
    submit,
    remove,
    toggleActive,
  };
}
