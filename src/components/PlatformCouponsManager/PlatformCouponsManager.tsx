import { useEffect, useState } from 'react';
import { CalendarClock, Pencil, Percent, Plus, Tag, Target, Ticket, Trash2, Users } from 'lucide-react';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FormDialog } from '@/components/FormDialog';
import { FormSection } from '@/components/FormSection';
import { OptionSection } from '@/components/OptionSection';
import { Select } from '@/components/Select';
import { useGetCategoriesQuery } from '@/redux/api/category/categoryApi';
import { PlatformCoupon, PlatformCouponAppliesTo } from '@/redux/api/admin/types';
import { usePlatformCouponsManager } from './usePlatformCouponsManager';
import styles from '@/components/ServicesManager/ServicesManager.module.css';
// Table/form-field styling, shared with the provider's own CouponsManager.
import ui from '@/components/CouponsManager/CouponsManager.module.css';

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

function appliesToLabel(c: PlatformCoupon): string {
  const base = APPLIES_TO_LABEL[c.appliesTo];
  return c.category ? `${base} · ${c.category.name} only` : base;
}

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
      {coupons.length === 0 && editing !== 'new' ? (
        <p className={styles.muted}>
          No platform coupons yet. Create one to run a site-wide promo across all businesses.
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
                    </div>
                    {c.description && <div className={ui.cellSub}>{c.description}</div>}
                  </td>
                  <td>
                    <span className={ui.discount}>
                      <Tag size={13} aria-hidden="true" /> {discountLabel(c)}
                    </span>
                  </td>
                  <td className={ui.cellText}>{appliesToLabel(c)}</td>
                  <td>
                    {c.expiresAt ? (
                      <span className={isExpired(c.expiresAt) ? ui.expired : undefined}>
                        {isExpired(c.expiresAt) ? 'Expired' : dateFmt.format(new Date(c.expiresAt))}
                      </span>
                    ) : (
                      <span className={ui.cellSub}>No expiry</span>
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
        title={isNew ? 'Add a platform coupon' : 'Edit coupon'}
        subtitle="A site-wide discount code, usable across any business on DNX."
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
            <FormSection icon={<Ticket size={16} />} title="Coupon code">
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
            </FormSection>

            <FormSection icon={<Percent size={16} />} title="Discount">
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
                    <span className={styles.optional}>(optional — caps how much one order can save)</span>
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
          <FormSection icon={<Target size={16} />} title="Who it applies to">
            <div className={styles.field}>
              <label className={styles.label} htmlFor="appliesTo">
                Applies to
              </label>
              <Select
                id="appliesTo"
                value={form.appliesTo}
                onChange={(e) => setAppliesTo(e.target.value as PlatformCouponAppliesTo)}
              >
                {(Object.keys(APPLIES_TO_LABEL) as PlatformCouponAppliesTo[]).map((value) => (
                  <option key={value} value={value}>
                    {APPLIES_TO_LABEL[value]}
                  </option>
                ))}
              </Select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="categoryId">
                Category <span className={styles.optional}>(optional — leave blank for every category)</span>
              </label>
              <Select id="categoryId" name="categoryId" value={form.categoryId} onChange={onChange}>
                <option value="">Any category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>

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
          </FormSection>
        )}

        {tab === 'limits' && (
          <>
            <FormSection icon={<CalendarClock size={16} />} title="Limits">
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
