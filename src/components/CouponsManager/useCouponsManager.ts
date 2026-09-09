import { useState, useCallback } from 'react';

import {
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} from '@/redux/api/provider/providerApi';
import { BusinessType, Coupon, CouponInput, CouponScope, DiscountType } from '@/redux/api/provider/types';

export interface CouponForm {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: string; // percent (PERCENT) or rupees (FLAT)
  scope: CouponScope;
  serviceId: string;
  productId: string;
  minOrder: string; // rupees — only meaningful when scope is ORDER
  maxDiscount: string; // rupees (PERCENT only)
  expiresAt: string; // YYYY-MM-DD
  usageLimit: string;
  isActive: boolean;
}

const EMPTY: CouponForm = {
  code: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: '',
  scope: 'ORDER',
  serviceId: '',
  productId: '',
  minOrder: '',
  maxDiscount: '',
  expiresAt: '',
  usageLimit: '',
  isActive: true,
};

const toRupees = (minor?: number | null) => (minor ? String(minor / 100) : '');
const toMinor = (rupees: string) => Math.round(Number(rupees) * 100);
const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');

/** State + handlers for a business's discount coupons. */
export function useCouponsManager(providerId: string, businessType: BusinessType) {
  const { data: coupons = [], isLoading } = useGetCouponsQuery(providerId);
  const [createCoupon, { isLoading: creating }] = useCreateCouponMutation();
  const [updateCoupon, { isLoading: updating }] = useUpdateCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();

  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const startAdd = useCallback(() => {
    setForm(EMPTY);
    setError(null);
    setEditing('new');
  }, []);

  const startEdit = useCallback((c: Coupon) => {
    setForm({
      code: c.code,
      description: c.description ?? '',
      discountType: c.discountType,
      discountValue: c.discountType === 'FLAT' ? toRupees(c.discountValue) : String(c.discountValue),
      scope: c.scope,
      serviceId: c.serviceId ?? '',
      productId: c.productId ?? '',
      minOrder: toRupees(c.minOrderMinor),
      maxDiscount: toRupees(c.maxDiscountMinor),
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

  // Scope choices are mutually exclusive: switching clears the other's picks.
  const setScope = useCallback((scope: CouponScope) => {
    setForm((prev) => ({ ...prev, scope, serviceId: '', productId: '', minOrder: '' }));
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
      if (form.scope === 'SERVICE' && !form.serviceId) return setError('Pick which service this applies to');
      if (form.scope === 'PRODUCT' && !form.productId) return setError('Pick which product this applies to');

      const data: CouponInput = {
        code,
        description: form.description.trim() || undefined,
        discountType: form.discountType,
        discountValue: form.discountType === 'FLAT' ? toMinor(form.discountValue) : Math.round(value),
        scope: form.scope,
        serviceId: form.scope === 'SERVICE' ? form.serviceId : undefined,
        productId: form.scope === 'PRODUCT' ? form.productId : undefined,
        minOrderMinor: form.scope === 'ORDER' && form.minOrder.trim() ? toMinor(form.minOrder) : 0,
        maxDiscountMinor:
          form.discountType === 'PERCENT' && form.maxDiscount.trim()
            ? toMinor(form.maxDiscount)
            : undefined,
        expiresAt: form.expiresAt
          ? new Date(`${form.expiresAt}T23:59:59`).toISOString()
          : null,
        usageLimit: form.usageLimit.trim() ? Number(form.usageLimit) : undefined,
        isActive: form.isActive,
      };

      try {
        if (editing === 'new') {
          await createCoupon({ providerId, data }).unwrap();
        } else if (editing) {
          await updateCoupon({ providerId, couponId: editing, data }).unwrap();
        }
        setEditing(null);
      } catch (err) {
        const msg = (err as { data?: { message?: string } })?.data?.message;
        setError(msg || 'Could not save the coupon. Please try again.');
      }
    },
    [editing, form, providerId, createCoupon, updateCoupon],
  );

  const remove = useCallback(
    async (couponId: string) => {
      if (!window.confirm('Delete this coupon?')) return;
      await deleteCoupon({ providerId, couponId })
        .unwrap()
        .catch(() => undefined);
    },
    [providerId, deleteCoupon],
  );

  const toggleCouponActive = useCallback(
    async (c: Coupon) => {
      await updateCoupon({ providerId, couponId: c.id, data: { isActive: !c.isActive } })
        .unwrap()
        .catch(() => undefined);
    },
    [providerId, updateCoupon],
  );

  return {
    coupons,
    isLoading,
    editing,
    form,
    error,
    saving: creating || updating,
    businessType,
    startAdd,
    startEdit,
    cancel,
    onChange,
    setType,
    setScope,
    toggleActive,
    submit,
    remove,
    toggleCouponActive,
  };
}
