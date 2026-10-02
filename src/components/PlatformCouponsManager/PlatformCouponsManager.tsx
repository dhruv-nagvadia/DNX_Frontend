import { CalendarClock, ChevronDown, Pencil, Plus, Tag, Trash2, Users } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useGetCategoriesQuery } from '@/redux/api/category/categoryApi';
import { PlatformCoupon, PlatformCouponAppliesTo } from '@/redux/api/admin/types';
import { usePlatformCouponsManager } from './usePlatformCouponsManager';
import styles from '@/components/ServicesManager/ServicesManager.module.css';
import ui from '@/components/CouponsManager/CouponsManager.module.css';
import local from './PlatformCouponsManager.module.css';

const money = (minor: number) => `₹${(minor / 100).toLocaleString('en-IN')}`;

function discountLabel(c: PlatformCoupon): string {
  if (c.discountType === 'PERCENT') {
    return `${c.discountValue}% off${c.maxDiscountMinor ? ` (max ${money(c.maxDiscountMinor)})` : ''}`;
  }
  return `${money(c.discountValue)} off`;
}

const APPLIES_TO_LABEL: Record<PlatformCouponAppliesTo, string> = {
  ANY: 'Bookings & orders',
  BOOKING: 'Bookings only',
  ORDER: 'Store orders only',
};

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const isExpired = (iso?: string | null) => !!iso && new Date(iso).getTime() < Date.now();

/** Create / edit / delete platform-wide discount codes, usable across any business. */
export function PlatformCouponsManager() {
  const {
    coupons,
    editing,
    form,
    error,
    saving,
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
  } = usePlatformCouponsManager();

  const { data: categories = [] } = useGetCategoriesQuery();

  const renderForm = (isNew: boolean) => (
    <form className={styles.form} onSubmit={submit}>
      <p className={styles.formTitle}>{isNew ? 'New platform coupon' : 'Edit coupon'}</p>

      <div className={ui.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="code">
            Code
          </label>
          <input
            id="code"
            name="code"
            className={styles.input}
            placeholder="e.g. WELCOME50"
            value={form.code}
            onChange={onChange}
            autoCapitalize="characters"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="discountType">
            Discount type
          </label>
          <div className={local.selectWrap}>
            <select
              id="discountType"
              className={local.select}
              value={form.discountType}
              onChange={(e) => setType(e.target.value as 'PERCENT' | 'FLAT')}
            >
              <option value="PERCENT">Percentage (%)</option>
              <option value="FLAT">Flat amount (₹)</option>
            </select>
            <ChevronDown size={16} className={local.chev} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className={ui.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="discountValue">
            {form.discountType === 'PERCENT' ? 'Percent off' : 'Amount off'}
          </label>
          <div className={ui.affix}>
            {form.discountType === 'FLAT' && <span className={ui.pre}>₹</span>}
            <input
              id="discountValue"
              name="discountValue"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder={form.discountType === 'PERCENT' ? '20' : '50'}
              value={form.discountValue}
              onChange={onChange}
            />
            {form.discountType === 'PERCENT' && <span className={ui.suffix}>%</span>}
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="appliesTo">
            Applies to
          </label>
          <div className={local.selectWrap}>
            <select
              id="appliesTo"
              className={local.select}
              value={form.appliesTo}
              onChange={(e) => setAppliesTo(e.target.value as PlatformCouponAppliesTo)}
            >
              {(Object.keys(APPLIES_TO_LABEL) as PlatformCouponAppliesTo[]).map((value) => (
                <option key={value} value={value}>
                  {APPLIES_TO_LABEL[value]}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className={local.chev} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className={ui.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="categoryId">
            Category <span className={styles.optional}>(optional)</span>
          </label>
          <div className={local.selectWrap}>
            <select
              id="categoryId"
              name="categoryId"
              className={local.select}
              value={form.categoryId}
              onChange={onChange}
            >
              <option value="">Any category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className={local.chev} aria-hidden="true" />
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="minOrder">
            Min order <span className={styles.optional}>(optional)</span>
          </label>
          <div className={ui.affix}>
            <span className={ui.pre}>₹</span>
            <input
              id="minOrder"
              name="minOrder"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              placeholder="0"
              value={form.minOrder}
              onChange={onChange}
            />
          </div>
        </div>
      </div>

      <div className={ui.grid2}>
        {form.discountType === 'PERCENT' && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="maxDiscount">
              Max discount <span className={styles.optional}>(optional)</span>
            </label>
            <div className={ui.affix}>
              <span className={ui.pre}>₹</span>
              <input
                id="maxDiscount"
                name="maxDiscount"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder="e.g. 100"
                value={form.maxDiscount}
                onChange={onChange}
              />
            </div>
          </div>
        )}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="usageLimit">
            Usage limit <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="usageLimit"
            name="usageLimit"
            className={styles.input}
            type="number"
            min="1"
            inputMode="numeric"
            placeholder="Unlimited"
            value={form.usageLimit}
            onChange={onChange}
          />
        </div>
      </div>

      <div className={ui.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="expiresAt">
            Expires <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="expiresAt"
            name="expiresAt"
            className={styles.input}
            type="date"
            value={form.expiresAt}
            onChange={onChange}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="description">
            Description <span className={styles.optional}>(shown to customers)</span>
          </label>
          <input
            id="description"
            name="description"
            className={styles.input}
            placeholder="e.g. Flat 50% off your first booking"
            value={form.description}
            onChange={onChange}
          />
        </div>
      </div>

      <label className={ui.toggleRow}>
        <input type="checkbox" checked={form.isActive} onChange={toggleActive} />
        Active (customers can use it)
      </label>

      {error && <AlertBanner tone="error">{error}</AlertBanner>}

      <div className={styles.formActions}>
        <Button type="button" variant="secondary" onClick={cancel}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} loadingText="Saving…">
          {isNew ? 'Add coupon' : 'Save changes'}
        </Button>
      </div>
    </form>
  );

  return (
    <Card
      title="Platform coupons"
      subtitle="Discount codes usable across any business on DNX — not tied to one provider."
      action={
        editing === null ? (
          <Button variant="secondary" onClick={startAdd} iconLeft={<Plus size={16} aria-hidden="true" />}>
            Add coupon
          </Button>
        ) : undefined
      }
    >
      {editing === 'new' && renderForm(true)}

      {coupons.length === 0 && editing !== 'new' ? (
        <p className={styles.muted}>
          No platform coupons yet. Create one to run a site-wide promo across all businesses.
        </p>
      ) : (
        <div className={styles.list}>
          {coupons.map((c) =>
            editing === c.id ? (
              <div key={c.id}>{renderForm(false)}</div>
            ) : (
              <div key={c.id} className={`${styles.row} ${!c.isActive ? styles.rowInactive : ''}`}>
                <div className={styles.rowMain}>
                  <div className={`${styles.rowName} ${ui.rowNameRow}`}>
                    <span className={ui.code}>{c.code}</span>
                    <span className={ui.scopeTag}>{APPLIES_TO_LABEL[c.appliesTo]}</span>
                    {c.category && <span className={ui.scopeTag}>{c.category.name} only</span>}
                  </div>
                  {c.description && <div className={styles.rowDesc}>{c.description}</div>}
                  <div className={styles.rowMeta}>
                    <span className={ui.discount}>
                      <Tag size={13} aria-hidden="true" /> {discountLabel(c)}
                    </span>
                    <span className={styles.metaItem}>
                      {c.minOrderMinor > 0 ? `Min order ${money(c.minOrderMinor)}` : 'Any order'}
                    </span>
                    {c.expiresAt && (
                      <span className={`${styles.metaItem} ${isExpired(c.expiresAt) ? ui.expired : ''}`}>
                        <CalendarClock size={13} aria-hidden="true" />
                        {isExpired(c.expiresAt) ? 'Expired' : `till ${dateFmt.format(new Date(c.expiresAt))}`}
                      </span>
                    )}
                    <span className={styles.metaItem}>
                      <Users size={13} aria-hidden="true" /> {c.usedCount}
                      {c.usageLimit ? ` / ${c.usageLimit}` : ''} used
                    </span>
                    <button
                      type="button"
                      className={`${styles.statusChip} ${c.isActive ? styles.active : styles.inactive}`}
                      onClick={() => toggleCouponActive(c)}
                      aria-pressed={c.isActive}
                    >
                      <span className={styles.statusDot} aria-hidden="true" />
                      {c.isActive ? 'Active' : 'Off'}
                    </button>
                  </div>
                </div>

                <div className={styles.rowActions}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => startEdit(c)}
                    aria-label={`Edit ${c.code}`}
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    onClick={() => remove(c.id)}
                    aria-label={`Delete ${c.code}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </Card>
  );
}
