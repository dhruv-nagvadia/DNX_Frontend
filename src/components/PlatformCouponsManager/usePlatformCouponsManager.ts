import { useState, useCallback } from 'react';

import {
  useGetPlatformCouponsQuery,
  useCreatePlatformCouponMutation,
  useUpdatePlatformCouponMutation,
  useDeletePlatformCouponMutation,
} from '@/redux/api/admin/adminApi';
import { DiscountType, PlatformCoupon, PlatformCouponAppliesTo, PlatformCouponInput } from '@/redux/api/admin/types';
import { PlatformCouponForm } from './types';

const EMPTY: PlatformCouponForm = {
  code: '',
  description: '',
  appliesTo: 'ANY',
  discountType: 'PERCENT',
  discountValue: '',
  minOrder: '',
  maxDiscount: '',
  categoryId: '',
  expiresAt: '',
  usageLimit: '',
  isActive: true,
};

const toRupees = (minor?: number | null) => (minor ? String(minor / 100) : '');
const toMinor = (rupees: string) => Math.round(Number(rupees) * 100);
const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');

/** State + handlers for platform-wide (admin-managed) discount coupons. */
export function usePlatformCouponsManager() {
  const { data: coupons = [], isLoading } = useGetPlatformCouponsQuery();
  const [createCoupon, { isLoading: creating }] = useCreatePlatformCouponMutation();
  const [updateCoupon, { isLoading: updating }] = useUpdatePlatformCouponMutation();
  const [deleteCoupon] = useDeletePlatformCouponMutation();

  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<PlatformCouponForm>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const startAdd = useCallback(() => {
    setForm(EMPTY);
    setError(null);
    setEditing('new');
  }, []);

  const startEdit = useCallback((c: PlatformCoupon) => {
    setForm({
      code: c.code,
      description: c.description ?? '',
      appliesTo: c.appliesTo,
      discountType: c.discountType,
      discountValue: c.discountType === 'FLAT' ? toRupees(c.discountValue) : String(c.discountValue),
      minOrder: toRupees(c.minOrderMinor),
      maxDiscount: toRupees(c.maxDiscountMinor),
      categoryId: c.categoryId ?? '',
      expiresAt: toDateInput(c.expiresAt),
      usageLimit: c.usageLimit ? String(c.usageLimit) : '',
      isActive: c.isActive,
    });
    setError(null);
    setEditing(c.id);
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

  const setType = useCallback((discountType: DiscountType) => {
    setForm((prev) => ({ ...prev, discountType }));
  }, []);

  const setAppliesTo = useCallback((appliesTo: PlatformCouponAppliesTo) => {
    setForm((prev) => ({ ...prev, appliesTo }));
  }, []);

  const toggleActive = useCallback(
    () => setForm((prev) => ({ ...prev, isActive: !prev.isActive })),
    [],
  );

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const code = form.code.trim();
      const value = Number(form.discountValue);
      if (code.length < 2) return setError('Enter a coupon code');
      if (!/^[A-Za-z0-9_-]+$/.test(code)) return setError('Code can use letters, numbers, - or _');
      if (Number.isNaN(value) || value <= 0) return setError('Enter a valid discount');
      if (form.discountType === 'PERCENT' && value > 100)
        return setError('A percentage can’t be over 100');

      const data: PlatformCouponInput = {
        code,
        description: form.description.trim() || undefined,
        appliesTo: form.appliesTo,
        discountType: form.discountType,
        discountValue: form.discountType === 'FLAT' ? toMinor(form.discountValue) : Math.round(value),
        minOrderMinor: form.minOrder.trim() ? toMinor(form.minOrder) : 0,
        maxDiscountMinor:
          form.discountType === 'PERCENT' && form.maxDiscount.trim()
            ? toMinor(form.maxDiscount)
            : undefined,
        categoryId: form.categoryId || null,
        expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
        usageLimit: form.usageLimit.trim() ? Number(form.usageLimit) : undefined,
        isActive: form.isActive,
      };

      try {
        if (editing === 'new') {
          await createCoupon(data).unwrap();
        } else if (editing) {
          await updateCoupon({ couponId: editing, data }).unwrap();
        }
        setEditing(null);
      } catch (err) {
        const msg = (err as { data?: { message?: string } })?.data?.message;
        setError(msg || 'Could not save the coupon. Please try again.');
      }
    },
    [editing, form, createCoupon, updateCoupon],
  );

  const remove = useCallback(
    async (couponId: string) => {
      if (!window.confirm('Delete this coupon?')) return;
      await deleteCoupon(couponId)
        .unwrap()
        .catch(() => undefined);
    },
    [deleteCoupon],
  );

  const toggleCouponActive = useCallback(
    async (c: PlatformCoupon) => {
      await updateCoupon({ couponId: c.id, data: { isActive: !c.isActive } })
        .unwrap()
        .catch(() => undefined);
    },
    [updateCoupon],
  );

  return {
    coupons,
    isLoading,
    editing,
    form,
    error,
    saving: creating || updating,
    startAdd,
    startEdit,
    cancel,
    onChange,
    setType,
    setAppliesTo,
    toggleActive,
    submit,
    remove,
    toggleCouponActive,
  };
}
