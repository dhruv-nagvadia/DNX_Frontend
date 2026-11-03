import { useCallback, useMemo, useState } from 'react';

import {
  useAdjustProductStockMutation,
  useGetStockAdjustmentsQuery,
  useSetProductStockStatusMutation,
} from '@/redux/api/provider/providerApi';
import { Product } from '@/redux/api/provider/types';
import { measureUnits, splitAmount, stockLevel, toBase } from '@/utils/units';
import { StockAdjustForm, StockFilter } from './types';

const EMPTY_FORM: StockAdjustForm = {
  direction: 'add',
  amount: '',
  unit: 'piece',
  reason: '',
  note: '',
};

/** How many recent changes show before "View All". */
export const RECENT_LIMIT = 5;
const ALL_LIMIT = 50;

const serverMessage = (err: unknown, fallback: string) =>
  (err as { data?: { message?: string } })?.data?.message ?? fallback;

/** Same rules as the summary tiles: made-to-order only counts as "out" when switched off. */
export const isOut = (p: Product) =>
  p.unlimitedStock ? p.stockQty <= 0 : stockLevel(p.stockQty, p.stepQty) === 'out';
export const isLow = (p: Product) => !p.unlimitedStock && stockLevel(p.stockQty, p.stepQty) === 'low';

/** The unit a fresh form starts in for this product (kg once there's ≥ 1 kg, etc.). */
const defaultUnit = (p: Product) => splitAmount(p.stockQty, p.measure).unit;

/**
 * Search-first stock adjustment: filter this business's products by name (or
 * low / out of stock), pick one from the list, then add/remove stock right
 * there — no need to open each product's own edit form. The first matching
 * product is selected automatically so the adjust panel is never empty.
 */
export function useStockManager(providerId: string, products: Product[]) {
  const [adjustStock, { isLoading: saving }] = useAdjustProductStockMutation();
  const [setStockStatus, { isLoading: settingStatus }] = useSetProductStockStatusMutation();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<StockAdjustForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const history = useGetStockAdjustmentsQuery({
    providerId,
    limit: showAllHistory ? ALL_LIMIT : RECENT_LIMIT,
  });

  const counts = useMemo(() => {
    const out = products.filter(isOut).length;
    const low = products.filter(isLow).length;
    return { total: products.length, low, out, in: products.length - low - out };
  }, [products]);

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === 'low' && !isLow(p)) return false;
      if (filter === 'out' && !isOut(p)) return false;
      return !q || p.name.toLowerCase().includes(q);
    });
  }, [products, query, filter]);

  // Resolved from the live `products` prop (not a snapshot), so the current
  // stock refreshes as soon as the business refetches after a save.
  const selectedProduct =
    products.find((p) => p.id === selectedId) ?? visibleProducts[0] ?? products[0] ?? null;

  // A unit that doesn't belong to this product's measure (e.g. right after the
  // auto-selection moved to another product) falls back to its default.
  const unit =
    selectedProduct && measureUnits(selectedProduct.measure).some((u) => u.value === form.unit)
      ? form.unit
      : selectedProduct
        ? defaultUnit(selectedProduct)
        : form.unit;

  const amountNum = Number(form.amount);
  const amountBase =
    selectedProduct && form.amount !== '' && !Number.isNaN(amountNum) && amountNum > 0
      ? toBase(amountNum, selectedProduct.measure, unit)
      : 0;
  const newStock = selectedProduct
    ? selectedProduct.stockQty + (form.direction === 'remove' ? -amountBase : amountBase)
    : 0;
  const removingTooMuch = !!selectedProduct && form.direction === 'remove' && newStock < 0;

  const resetMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const onQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const onSelectProduct = useCallback((product: Product) => {
    setSelectedId(product.id);
    setForm({ ...EMPTY_FORM, unit: defaultUnit(product) });
    resetMessages();
  }, [resetMessages]);

  const onFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  /** Stepper − / + : moves the amount by 1 in the chosen unit, never below 0. */
  const stepAmount = useCallback((by: number) => {
    setForm((prev) => {
      const current = Number(prev.amount);
      const next = Math.max(0, (Number.isNaN(current) ? 0 : current) + by);
      return { ...prev, amount: next === 0 ? '' : `${parseFloat(next.toFixed(3))}` };
    });
  }, []);

  const setDirection = useCallback((direction: 'add' | 'remove') => {
    setForm((prev) => ({ ...prev, direction }));
  }, []);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedProduct) return;
      resetMessages();

      if (amountBase <= 0) {
        setError('Enter a quantity greater than 0');
        return;
      }
      if (removingTooMuch) {
        setError("You can't remove more than what's in stock.");
        return;
      }
      if (!form.reason) {
        setError('Choose a reason for this change');
        return;
      }
      const delta = form.direction === 'remove' ? -amountBase : amountBase;

      try {
        await adjustStock({
          providerId,
          productId: selectedProduct.id,
          data: { delta, reason: form.reason, note: form.note.trim() || undefined },
        }).unwrap();
        setSuccessMessage(`Updated ${selectedProduct.name}.`);
        setSelectedId(selectedProduct.id);
        setForm({ ...EMPTY_FORM, unit });
      } catch (err) {
        setError(serverMessage(err, 'Could not update stock. Please try again.'));
      }
    },
    [selectedProduct, amountBase, removingTooMuch, form, unit, providerId, adjustStock, resetMessages],
  );

  // Mark out of stock (any product), or the made-to-order available /
  // unavailable flip.
  const setAvailability = useCallback(
    async (inStock: boolean) => {
      if (!selectedProduct) return;
      resetMessages();
      try {
        await setStockStatus({ providerId, productId: selectedProduct.id, inStock }).unwrap();
        setSuccessMessage(`Marked ${selectedProduct.name} ${inStock ? 'in stock' : 'out of stock'}.`);
        setSelectedId(selectedProduct.id);
        setForm({ ...EMPTY_FORM, unit });
      } catch (err) {
        setError(serverMessage(err, 'Could not update availability. Please try again.'));
      }
    },
    [selectedProduct, unit, providerId, setStockStatus, resetMessages],
  );

  return {
    counts,
    query,
    filter,
    setFilter,
    visibleProducts,
    selectedProduct,
    form: { ...form, unit },
    newStock,
    amountBase,
    removingTooMuch,
    error,
    successMessage,
    saving: saving || settingStatus,
    onQueryChange,
    onSelectProduct,
    onFieldChange,
    stepAmount,
    setDirection,
    submit,
    setAvailability,
    history: {
      items: history.data ?? [],
      loading: history.isLoading || (history.isFetching && !history.data),
      isError: history.isError,
      showAll: showAllHistory,
      toggleShowAll: () => setShowAllHistory((v) => !v),
    },
  };
}
