import { useState, useCallback, useEffect } from 'react';

import { skipToken } from '@reduxjs/toolkit/query/react';

import {
  useGetAllCouponsQuery,
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} from '@/redux/api/provider/providerApi';
import { BusinessType, Coupon, CouponInput, CouponScope, DiscountType } from '@/redux/api/provider/types';

export interface CouponForm {
  /** Owning business — only chosen in the form in all-businesses mode. */
  businessId: string;
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
  businessId: '',
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

/**
 * State + handlers for discount coupons. With a `providerId` it manages that
 * one business; without one it manages every coupon across all the owner's
 * businesses, and each action targets the coupon's own business.
 */
export function useCouponsManager(providerId: string | undefined, businessType: BusinessType) {
  const allMode = !providerId;
  const one = useGetCouponsQuery(providerId ?? skipToken);
  const all = useGetAllCouponsQuery(undefined, { skip: !allMode });
  const { data: coupons = [], isLoading } = allMode ? all : one;
  const [createCoupon, { isLoading: creating }] = useCreateCouponMutation();
  const [updateCoupon, { isLoading: updating }] = useUpdateCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();

  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  // A message about a problem goes away as soon as the form is edited, not only on the next save.
  useEffect(() => {
    setError(null);
  }, [form]);

  const startAdd = useCallback((businessId = '') => {
    setForm({ ...EMPTY, businessId });
    setError(null);
    setEditing('new');
  }, []);

  const startEdit = useCallback((c: Coupon) => {
    setForm({
      businessId: providerId ?? c.provider?.id ?? '',
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
  }, [providerId]);

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

  // A different business has different services/products (and maybe a
  // different type), so its scope target can't carry over.
  const setBusiness = useCallback((businessId: string, type: BusinessType = 'SERVICE') => {
    setForm((prev) => ({
      ...prev,
      businessId,
      scope: prev.scope === 'ORDER' ? 'ORDER' : type === 'STORE' ? 'PRODUCT' : 'SERVICE',
      serviceId: '',
      productId: '',
    }));
  }, []);

  const toggleActive = useCallback(
    () => setForm((prev) => ({ ...prev, isActive: !prev.isActive })),
    [],
  );

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const targetId = providerId ?? form.businessId;
      if (!targetId) return setError('Pick which business this offer is for');
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
        // Create rejects null; only an update may send null (to clear a previous expiry).
        expiresAt: form.expiresAt
          ? new Date(`${form.expiresAt}T23:59:59`).toISOString()
          : editing === 'new'
            ? undefined
            : null,
        usageLimit: form.usageLimit.trim() ? Number(form.usageLimit) : undefined,
        isActive: form.isActive,
      };

      try {
        if (editing === 'new') {
          await createCoupon({ providerId: targetId, data }).unwrap();
        } else if (editing) {
          await updateCoupon({ providerId: targetId, couponId: editing, data }).unwrap();
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
    async (c: Coupon) => {
      const target = providerId ?? c.provider?.id;
      if (!target || !window.confirm('Delete this coupon?')) return;
      await deleteCoupon({ providerId: target, couponId: c.id })
        .unwrap()
        .catch(() => undefined);
    },
    [providerId, deleteCoupon],
  );

  const toggleCouponActive = useCallback(
    async (c: Coupon) => {
      const target = providerId ?? c.provider?.id;
      if (!target) return;
      await updateCoupon({ providerId: target, couponId: c.id, data: { isActive: !c.isActive } })
        .unwrap()
        .catch(() => undefined);
    },
    [providerId, updateCoupon],
  );

  return {
    allMode,
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
    setBusiness,
    toggleActive,
    submit,
    remove,
    toggleCouponActive,
  };
}
