import { useCallback, useState } from 'react';

import { useAdjustProductStockMutation } from '@/redux/api/provider/providerApi';
import { Product } from '@/redux/api/provider/types';
import { ComboboxItem } from '@/components/Combobox';
import { splitAmount, toBase } from '@/utils/units';
import { StockAdjustForm } from './types';

const EMPTY_FORM: StockAdjustForm = {
  direction: 'remove',
  amount: '',
  unit: 'piece',
  reason: '',
  note: '',
};

const serverMessage = (err: unknown, fallback: string) =>
  (err as { data?: { message?: string } })?.data?.message ?? fallback;

/**
 * Search-first stock adjustment: pick any product from this business by
 * name, then add/remove stock right there — no need to open each product's
 * own edit form. Resets after a successful save so the next product can be
 * searched immediately.
 */
export function useStockManager(providerId: string) {
  const [adjustStock, { isLoading: saving }] = useAdjustProductStockMutation();

  const [query, setQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<StockAdjustForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const onQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // Typing again means they're looking for something else — a stale
    // selection could otherwise silently stay "active" underneath.
    setSelectedProduct(null);
    setError(null);
    setSuccessMessage(null);
  }, []);

  const onSelectProduct = useCallback((item: ComboboxItem<Product>) => {
    const product = item.meta;
    if (!product) return;
    const { unit } = splitAmount(product.stockQty, product.measure);
    setQuery(item.label);
    setSelectedProduct(product);
    setForm({ ...EMPTY_FORM, unit });
    setError(null);
    setSuccessMessage(null);
  }, []);

  const clearSelection = useCallback(() => {
    setQuery('');
    setSelectedProduct(null);
    setForm(EMPTY_FORM);
    setError(null);
  }, []);

  const onFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const setDirection = useCallback((direction: 'add' | 'remove') => {
    setForm((prev) => ({ ...prev, direction }));
  }, []);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedProduct) return;
      setError(null);
      setSuccessMessage(null);

      const amount = Number(form.amount);
      if (Number.isNaN(amount) || amount <= 0) {
        setError('Enter an amount greater than 0');
        return;
      }
      const base = toBase(amount, selectedProduct.measure, form.unit);
      const delta = form.direction === 'remove' ? -base : base;

      try {
        await adjustStock({
          providerId,
          productId: selectedProduct.id,
          data: { delta, reason: form.reason || undefined, note: form.note.trim() || undefined },
        }).unwrap();
        setSuccessMessage(`Updated ${selectedProduct.name}.`);
        // Reset so the next product can be searched straight away.
        setQuery('');
        setSelectedProduct(null);
        setForm(EMPTY_FORM);
      } catch (err) {
        setError(serverMessage(err, 'Could not update stock. Please try again.'));
      }
    },
    [selectedProduct, form, providerId, adjustStock],
  );

  return {
    query,
    selectedProduct,
    form,
    error,
    successMessage,
    saving,
    onQueryChange,
    onSelectProduct,
    clearSelection,
    onFieldChange,
    setDirection,
    submit,
  };
}
