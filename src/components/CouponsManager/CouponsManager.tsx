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
import { Select } from '@/components/Select';
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
        <div className={ui.tableWrap}>
          <table className={ui.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Applies to</th>
                <th>Expires</th>
                <th>Used</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className={!c.isActive ? ui.rowInactive : ''}>
                  <td>
                    <div className={ui.rowNameRow}>
                      <span className={ui.code}>{c.code}</span>
                      {c.scope !== 'ORDER' && (
                        <span className={ui.scopeTag}>
                          <Ticket size={11} aria-hidden="true" />
                          {c.scope === 'SERVICE' ? 'Service' : 'Product'}
                        </span>
                      )}
                    </div>
                    {c.description && <div className={ui.cellSub}>{c.description}</div>}
                  </td>
                  <td>
                    <span className={ui.discount}>
                      <Tag size={13} aria-hidden="true" /> {discountLabel(c)}
                    </span>
                  </td>
                  <td className={ui.cellText}>{eligibilityLabel(c)}</td>
                  <td>
                    {c.expiresAt ? (
                      <span
                        className={`${ui.cellText} ${isExpired(c.expiresAt) ? ui.expired : ''}`}
                      >
                        {isExpired(c.expiresAt)
                          ? 'Expired'
                          : dateFmt.format(new Date(c.expiresAt))}
                      </span>
                    ) : (
                      <span className={ui.cellText}>No expiry</span>
                    )}
                  </td>
                  <td className={ui.used}>
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${styles.statusChip} ${c.isActive ? styles.active : styles.inactive}`}
                      onClick={() => toggleCouponActive(c)}
                      aria-pressed={c.isActive}
                    >
                      <span className={styles.statusDot} aria-hidden="true" />
                      {c.isActive ? 'Active' : 'Off'}
                    </button>
                  </td>
                  <td>
                    <div className={ui.actionsCell}>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            >
              <div className={ui.grid2}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="discountType">
                    Discount type
                  </label>
                  <Select
                    id="discountType"
                    value={form.discountType}
                    onChange={(e) => setType(e.target.value as 'PERCENT' | 'FLAT')}
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FLAT">Flat amount (₹)</option>
                  </Select>
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
                      (optional, caps how much one order can save)
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
                  <span className={styles.optional}>(optional, leave blank for any order)</span>
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
                    You don’t have any {itemLabel}s yet. Add one first to scope a coupon to it.
                  </p>
                ) : (
                  <Select
                    id={businessType === 'STORE' ? 'productId' : 'serviceId'}
                    name={businessType === 'STORE' ? 'productId' : 'serviceId'}
                    value={businessType === 'STORE' ? form.productId : form.serviceId}
                    onChange={onChange}
                  >
                    <option value="">Select a {itemLabel}…</option>
                    {items.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name}
                      </option>
                    ))}
                  </Select>
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
              label="Active, customers can use this coupon"
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
