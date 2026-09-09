import { CalendarClock, Package, Pencil, Plus, Tag, Ticket, Trash2, Users } from 'lucide-react';

import { AlertBanner } from '@/components/AlertBanner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { BusinessType, Coupon, Product, Service } from '@/redux/api/provider/types';
import { useCouponsManager } from './useCouponsManager';
import styles from '@/components/ServicesManager/ServicesManager.module.css';
import ui from './CouponsManager.module.css';

const money = (minor: number) => `₹${(minor / 100).toLocaleString('en-IN')}`;

function discountLabel(c: Coupon): string {
  if (c.discountType === 'PERCENT') {
    return `${c.discountValue}% off${c.maxDiscountMinor ? ` (max ${money(c.maxDiscountMinor)})` : ''}`;
  }
  return `${money(c.discountValue)} off`;
}

/** What a coupon row shows for its eligibility rule. */
function eligibilityLabel(c: Coupon): string {
  if (c.scope === 'SERVICE') return `On ${c.service?.name ?? 'a specific service'}`;
  if (c.scope === 'PRODUCT') return `On ${c.product?.name ?? 'a specific product'}`;
  return c.minOrderMinor > 0 ? `Min order ${money(c.minOrderMinor)}` : 'Any order';
}

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const isExpired = (iso?: string | null) => !!iso && new Date(iso).getTime() < Date.now();

interface CouponsManagerProps {
  providerId: string;
  businessType: BusinessType;
  services?: Service[];
  products?: Product[];
}

/** Create / edit / delete a business's discount coupons. */
export function CouponsManager({ providerId, businessType, services = [], products = [] }: CouponsManagerProps) {
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
    setScope,
    toggleActive,
    submit,
    remove,
    toggleCouponActive,
  } = useCouponsManager(providerId, businessType);

  const itemLabel = businessType === 'STORE' ? 'product' : 'service';
  const items = businessType === 'STORE' ? products : services;

  const renderForm = (isNew: boolean) => (
    <form className={styles.form} onSubmit={submit}>
      <p className={styles.formTitle}>{isNew ? 'New coupon' : 'Edit coupon'}</p>

      <div className={ui.grid2}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="code">
            Code
          </label>
          <input
            id="code"
            name="code"
            className={styles.input}
            placeholder="e.g. SAVE20"
            value={form.code}
            onChange={onChange}
            autoCapitalize="characters"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="discountType">
            Discount type
          </label>
          <select
            id="discountType"
            className={ui.select}
            value={form.discountType}
            onChange={(e) => setType(e.target.value as 'PERCENT' | 'FLAT')}
          >
            <option value="PERCENT">Percentage (%)</option>
            <option value="FLAT">Flat amount (₹)</option>
          </select>
        </div>
      </div>

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

      {/* Eligibility: a minimum amount, or one specific service/product. */}
      <div className={styles.field}>
        <label className={styles.label}>Applies to</label>
        <div className={ui.scopeRow}>
          <button
            type="button"
            className={`${ui.scopeBtn} ${form.scope === 'ORDER' ? ui.scopeBtnActive : ''}`}
            onClick={() => setScope('ORDER')}
          >
            <Tag size={14} aria-hidden="true" />
            Minimum order amount
          </button>
          <button
            type="button"
            className={`${ui.scopeBtn} ${form.scope !== 'ORDER' ? ui.scopeBtnActive : ''}`}
            onClick={() => setScope(businessType === 'STORE' ? 'PRODUCT' : 'SERVICE')}
          >
            <Package size={14} aria-hidden="true" />
            A specific {itemLabel}
          </button>
        </div>
      </div>

      {form.scope === 'ORDER' ? (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="minOrder">
            Min order <span className={styles.optional}>(optional — leave blank for any order)</span>
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
      ) : (
        <div className={styles.field}>
          <label className={styles.label} htmlFor={businessType === 'STORE' ? 'productId' : 'serviceId'}>
            {businessType === 'STORE' ? 'Product' : 'Service'}
          </label>
          {items.length === 0 ? (
            <p className={ui.noItems}>
              You don’t have any {itemLabel}s yet — add one first to scope a coupon to it.
            </p>
          ) : (
            <select
              id={businessType === 'STORE' ? 'productId' : 'serviceId'}
              name={businessType === 'STORE' ? 'productId' : 'serviceId'}
              className={ui.select}
              value={businessType === 'STORE' ? form.productId : form.serviceId}
              onChange={onChange}
            >
              <option value="">Select a {itemLabel}…</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

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
          placeholder="e.g. 20% off your first order"
          value={form.description}
          onChange={onChange}
        />
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
      title="Offers & coupons"
      subtitle="Discount codes customers can apply at checkout."
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
          No coupons yet. Create a discount code to run an offer on your business.
        </p>
      ) : (
        <div className={styles.list}>
          {coupons.map((c) =>
            editing === c.id ? (
              <div key={c.id}>{renderForm(false)}</div>
            ) : (
              <div
                key={c.id}
                className={`${styles.row} ${!c.isActive ? styles.rowInactive : ''}`}
              >
                <div className={styles.rowMain}>
                  <div className={`${styles.rowName} ${ui.rowNameRow}`}>
                    <span className={ui.code}>{c.code}</span>
                    {c.scope !== 'ORDER' && (
                      <span className={ui.scopeTag}>
                        <Ticket size={12} aria-hidden="true" />
                        {c.scope === 'SERVICE' ? 'Service offer' : 'Product offer'}
                      </span>
                    )}
                  </div>
                  {c.description && <div className={styles.rowDesc}>{c.description}</div>}
                  <div className={styles.rowMeta}>
                    <span className={ui.discount}>
                      <Tag size={13} aria-hidden="true" /> {discountLabel(c)}
                    </span>
                    <span className={styles.metaItem}>{eligibilityLabel(c)}</span>
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
