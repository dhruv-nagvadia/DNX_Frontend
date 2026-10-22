import { useEffect, useState } from 'react';
import {
  CalendarClock,
  Package,
  Pencil,
  Percent,
  Plus,
  Tag,
  Target,
  Ticket,
  Trash2,
  Users,
} from 'lucide-react';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FormDialog } from '@/components/FormDialog';
import { FormSection } from '@/components/FormSection';
import { OptionSection } from '@/components/OptionSection';
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

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const isExpired = (iso?: string | null) => !!iso && new Date(iso).getTime() < Date.now();

interface CouponsManagerProps {
  providerId: string;
  businessType: BusinessType;
  services?: Service[];
  products?: Product[];
}

/** Create / edit / delete a business's discount coupons. */
export function CouponsManager({
  providerId,
  businessType,
  services = [],
  products = [],
}: CouponsManagerProps) {
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

  const isNew = editing === 'new';

  // The form is split into tabs; it always opens on the first one.
  const [tab, setTab] = useState('offer');
  useEffect(() => {
    if (editing !== null) setTab('offer');
  }, [editing]);
  const tabs = [
    { id: 'offer', label: 'Offer' },
    { id: 'rules', label: 'Who it applies to' },
    { id: 'limits', label: 'Limits & status' },
  ];

  return (
    <Card
      title="Offers & coupons"
      subtitle="Discount codes customers can apply at checkout."
      action={
        editing === null ? (
          <Button
            variant="secondary"
            onClick={startAdd}
            iconLeft={<Plus size={16} aria-hidden="true" />}
          >
            Add coupon
          </Button>
        ) : undefined
      }
    >
      {coupons.length === 0 && editing !== 'new' ? (
        <p className={styles.muted}>
          No coupons yet. Create a discount code to run an offer on your business.
        </p>
      ) : (
        <div className={styles.list}>
          {coupons.map((c) => (
            <div key={c.id} className={`${styles.row} ${!c.isActive ? styles.rowInactive : ''}`}>
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
                    <span
                      className={`${styles.metaItem} ${isExpired(c.expiresAt) ? ui.expired : ''}`}
                    >
                      <CalendarClock size={13} aria-hidden="true" />
                      {isExpired(c.expiresAt)
                        ? 'Expired'
                        : `till ${dateFmt.format(new Date(c.expiresAt))}`}
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
          ))}
        </div>
      )}

      <FormDialog
        open={editing !== null}
        title={isNew ? 'Add a coupon' : 'Edit coupon'}
        subtitle="A discount code customers can apply at checkout."
        onClose={cancel}
        onSubmit={submit}
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
        error={error}
        submitLabel={isNew ? 'Add coupon' : 'Save changes'}
        submitting={saving}
      >
        {tab === 'offer' && (
          <>
            <FormSection
              icon={<Ticket size={16} />}
              title="Coupon code"
              description="What customers type in at checkout."
            >
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
            </FormSection>

            <FormSection
              icon={<Percent size={16} />}
              title="Discount"
              description="How much the customer saves."
            >
              <div className={ui.grid2}>
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
              </div>

              {form.discountType === 'PERCENT' && (
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="maxDiscount">
                    Max discount{' '}
                    <span className={styles.optional}>
                      (optional — caps how much one order can save)
                    </span>
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
            </FormSection>
          </>
        )}

        {tab === 'rules' && (
          <FormSection
            icon={<Target size={16} />}
            title="Who it applies to"
            description="Any order above a minimum, or one specific item."
          >
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
                <Package size={14} aria-hidden="true" />A specific {itemLabel}
              </button>
            </div>

            {form.scope === 'ORDER' ? (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="minOrder">
                  Min order{' '}
                  <span className={styles.optional}>(optional — leave blank for any order)</span>
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
                <label
                  className={styles.label}
                  htmlFor={businessType === 'STORE' ? 'productId' : 'serviceId'}
                >
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
          </FormSection>
        )}

        {tab === 'limits' && (
          <>
            <FormSection
              icon={<CalendarClock size={16} />}
              title="Limits"
              description="Keep an offer from running forever or being used too many times."
            >
              <div className={ui.grid2}>
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
              </div>
            </FormSection>

            <OptionSection
              name="isActive"
              icon={<Users size={16} />}
              label="Active — customers can use this coupon"
              description="Untick to pause it without deleting it."
              checked={form.isActive}
              onChange={() => toggleActive()}
            />
          </>
        )}
      </FormDialog>
    </Card>
  );
}
