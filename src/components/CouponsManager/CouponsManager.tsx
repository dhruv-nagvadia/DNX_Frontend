import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ban,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  Clock,
  Command,
  Copy,
  Layers,
  Package,
  Pencil,
  Plus,
  Power,
  Search,
  ShoppingCart,
  Store,
  Tag,
  Ticket,
  Trash2,
  Users,
} from 'lucide-react';

import { Pill } from '@/components/Pill';
import { Skeleton } from '@/components/Skeleton';
import { useGetMyBusinessesQuery } from '@/redux/api/provider/providerApi';
import { BusinessType, Coupon, Product, Service } from '@/redux/api/provider/types';
import { OfferPanel } from './OfferPanel';
import { useCouponsManager } from './useCouponsManager';
import ui from './CouponsManager.module.css';

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRING_SOON_DAYS = 7;

const money = (minor: number) => `₹${(minor / 100).toLocaleString('en-IN')}`;

const dateFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

type CouponStatus = 'active' | 'off' | 'expired' | 'usedUp';
type StatusFilter = 'all' | CouponStatus;
type TypeFilter = 'all' | 'PERCENT' | 'FLAT';

interface CouponView {
  coupon: Coupon;
  status: CouponStatus;
  expiringSoon: boolean;
}

/** Derive a coupon's single display status (expired wins over used up). */
function describe(c: Coupon, now: number): CouponView {
  const expiresAt = c.expiresAt ? new Date(c.expiresAt).getTime() : null;
  const expired = expiresAt !== null && expiresAt < now;
  const usedUp = c.usageLimit != null && c.usedCount >= c.usageLimit;
  const status: CouponStatus = expired
    ? 'expired'
    : usedUp
      ? 'usedUp'
      : c.isActive
        ? 'active'
        : 'off';
  const expiringSoon =
    status === 'active' && expiresAt !== null && expiresAt - now <= EXPIRING_SOON_DAYS * DAY_MS;
  return { coupon: c, status, expiringSoon };
}

const STATUS_LABEL: Record<CouponStatus, string> = {
  active: 'Active',
  off: 'Off',
  expired: 'Expired',
  usedUp: 'Used up',
};

function StatusPill({ status }: { status: CouponStatus }) {
  switch (status) {
    case 'active':
      return (
        <Pill tone="green">
          <Check size={15} aria-hidden="true" /> Active
        </Pill>
      );
    case 'off':
      return (
        <Pill tone="grey">
          <Power size={14} aria-hidden="true" /> Off
        </Pill>
      );
    case 'expired':
      return (
        <Pill tone="red">
          <Ban size={14} aria-hidden="true" /> Expired
        </Pill>
      );
    default:
      return (
        <Pill tone="orange">
          <Layers size={14} aria-hidden="true" /> Used up
        </Pill>
      );
  }
}

function discountHeadline(c: Coupon): string {
  return c.discountType === 'PERCENT' ? `${c.discountValue}% OFF` : `${money(c.discountValue)} OFF`;
}

/** Icon + text for what a coupon applies to. */
function scopeRow(c: Coupon): { icon: ReactNode; text: string } {
  if (c.scope === 'SERVICE') {
    return {
      icon: <Command size={16} />,
      text: `On ${c.service?.name ?? 'a specific service'} (service)`,
    };
  }
  if (c.scope === 'PRODUCT') {
    return {
      icon: <Layers size={16} />,
      text: `On ${c.product?.name ?? 'a specific product'} (product)`,
    };
  }
  return {
    icon: <ShoppingCart size={16} />,
    text: c.minOrderMinor > 0 ? `On orders above ${money(c.minOrderMinor)}` : 'On any order',
  };
}

function expiryText(c: Coupon, status: CouponStatus): string {
  if (!c.expiresAt) return 'No expiry';
  const date = dateFmt.format(new Date(c.expiresAt));
  return status === 'expired' ? `Expired on ${date}` : `Expires ${date}`;
}

/** Grey sub-line under the headline: the cap for a %, the threshold for a flat ₹. */
function discountSubline(c: Coupon): string | null {
  if (c.discountType === 'PERCENT' && c.maxDiscountMinor) return `up to ${money(c.maxDiscountMinor)}`;
  if (c.discountType === 'FLAT' && c.scope === 'ORDER' && c.minOrderMinor > 0)
    return `above ${money(c.minOrderMinor)}`;
  return null;
}

const BUSINESS_TONES = ['lavender', 'blue', 'green', 'orange', 'teal', 'red'] as const;
/** Deterministic dot colour per business, so cards stay scannable. */
function businessDotClass(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return ui[`dot_${BUSINESS_TONES[hash % BUSINESS_TONES.length]}`];
}

/** Coloured dot + business name. */
function BusinessName({ id, name, className }: { id: string; name: string; className?: string }) {
  return (
    <span className={`${ui.bizName} ${className ?? ''}`} title={name}>
      <span className={`${ui.bizDot} ${businessDotClass(id)}`} aria-hidden="true" />
      <span className={ui.bizNameText}>{name}</span>
    </span>
  );
}

/** Small "Service" / "Store" type pill next to a business name. */
function TypePill({ type = 'SERVICE' }: { type?: BusinessType }) {
  return (
    <span className={ui.typePill}>
      {type === 'STORE' ? <Package size={14} aria-hidden="true" /> : <Command size={14} aria-hidden="true" />}
      {type === 'STORE' ? 'Store' : 'Service'}
    </span>
  );
}

/** Two-option segmented control (Percentage | Flat ₹, Any order | Specific …). */
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabledValues = [],
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  disabledValues?: T[];
}) {
  return (
    <div className={ui.segmented} role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`${ui.segment} ${selected ? ui.segmentOn : ''}`}
            disabled={disabledValues.includes(o.value)}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SummaryTile({
  tone,
  icon,
  label,
  value,
  note,
}: {
  tone: 'blue' | 'mint' | 'peach' | 'lavender';
  icon: ReactNode;
  label: string;
  value: number;
  note?: string;
}) {
  return (
    <div className={`${ui.tile} ${ui[`tile_${tone}`]}`}>
      <span className={ui.tileIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={ui.tileText}>
        <span className={ui.tileLabel}>{label}</span>
        <span className={ui.tileValueRow}>
          <span className={ui.tileValue}>{value}</span>
          {note && <span className={ui.tileNote}>{note}</span>}
        </span>
      </div>
    </div>
  );
}

interface CouponsManagerProps {
  /** Omit to manage every offer across all of the owner's businesses. */
  providerId?: string;
  businessType?: BusinessType;
  services?: Service[];
  products?: Product[];
}

/**
 * Create / edit / delete discount coupons — for one business (`providerId`),
 * or, with no `providerId`, for all of the owner's businesses at once.
 */
export function CouponsManager({
  providerId,
  businessType: propType = 'SERVICE',
  services: propServices = [],
  products: propProducts = [],
}: CouponsManagerProps) {
  const {
    allMode,
    coupons,
    isLoading,
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
    setBusiness,
    toggleActive,
    submit,
    remove,
    toggleCouponActive,
  } = useCouponsManager(providerId, propType);

  // All-businesses mode: the form's scope pickers follow the chosen business.
  const { data: businesses = [], isLoading: loadingBusinesses } = useGetMyBusinessesQuery(
    undefined,
    { skip: !allMode },
  );
  const formBusiness = allMode ? businesses.find((b) => b.id === form.businessId) : undefined;
  const businessType: BusinessType = allMode ? (formBusiness?.type ?? 'SERVICE') : propType;
  const services = allMode ? (formBusiness?.services ?? []) : propServices;
  const products = allMode ? (formBusiness?.products ?? []) : propProducts;
  const editingCoupon = editing && editing !== 'new' ? coupons.find((c) => c.id === editing) : undefined;

  const itemLabel = businessType === 'STORE' ? 'product' : 'service';
  const items = businessType === 'STORE' ? products : services;

  const isNew = editing === 'new';
  const expiresRef = useRef<HTMLInputElement>(null);
  const openDatePicker = () => {
    const el = expiresRef.current;
    if (!el) return;
    el.focus();
    try {
      el.showPicker?.();
    } catch {
      // showPicker can throw outside a user gesture / in older browsers — focus is enough.
    }
  };

  // ── List filters ────────────────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [businessFilter, setBusinessFilter] = useState('all');

  // The business filter scopes the tiles too; search / status / type only narrow the cards.
  const views = useMemo(() => {
    const now = Date.now();
    return coupons
      .filter((c) => businessFilter === 'all' || c.provider?.id === businessFilter)
      .map((c) => describe(c, now));
  }, [coupons, businessFilter]);

  const counts = useMemo(
    () => ({
      total: views.length,
      active: views.filter((v) => v.status === 'active').length,
      expiringSoon: views.filter((v) => v.expiringSoon).length,
      used: views.reduce((sum, v) => sum + v.coupon.usedCount, 0),
    }),
    [views],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return views.filter(({ coupon: c, status }) => {
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (typeFilter !== 'all' && c.discountType !== typeFilter) return false;
      if (!q) return true;
      return (
        c.code.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q) ||
        (c.provider?.businessName ?? '').toLowerCase().includes(q)
      );
    });
  }, [views, query, statusFilter, typeFilter]);

  // ── Copy-code feedback ──────────────────────────────────────────────
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(copyTimer.current), []);
  const copyCode = (c: Coupon) => {
    navigator.clipboard
      ?.writeText(c.code)
      .then(() => {
        setCopiedId(c.id);
        window.clearTimeout(copyTimer.current);
        copyTimer.current = window.setTimeout(() => setCopiedId(null), 1500);
      })
      .catch(() => undefined);
  };

  const hasCoupons = coupons.length > 0 || isNew;
  const loading = isLoading || (allMode && loadingBusinesses);
  const noBusinesses = allMode && !loadingBusinesses && businesses.length === 0;

  // New offers default to the only business, or the one being filtered to.
  const create = () => {
    if (!allMode) return startAdd();
    if (businesses.length === 1) return startAdd(businesses[0].id);
    startAdd(businessFilter !== 'all' ? businessFilter : '');
  };

  return (
    <div className={ui.root}>
      {loading ? (
        <Skeleton height={220} radius="var(--m-radius-card)" />
      ) : noBusinesses && !hasCoupons ? (
        <div className={ui.emptyCard}>
          <span className={ui.emptyIcon} aria-hidden="true">
            <Store size={28} />
          </span>
          <p className={ui.emptyText}>
            You don’t have a business yet. Add one in{' '}
            <Link to="/businesses" className={ui.emptyLink}>
              My Businesses
            </Link>{' '}
            to start running offers.
          </p>
        </div>
      ) : hasCoupons ? (
        <>
          <div className={ui.tiles}>
            <SummaryTile tone="blue" icon={<Tag size={26} />} label="Total Offers" value={counts.total} />
            <SummaryTile tone="mint" icon={<CircleCheck size={26} />} label="Active" value={counts.active} />
            <SummaryTile
              tone="peach"
              icon={<Clock size={26} />}
              label="Expiring Soon"
              value={counts.expiringSoon}
              note={`(within ${EXPIRING_SOON_DAYS} days)`}
            />
            <SummaryTile tone="lavender" icon={<Users size={26} />} label="Times Used" value={counts.used} />
          </div>

          <div className={ui.toolbar}>
            <label className={ui.search}>
              <Search size={18} aria-hidden="true" />
              <span className={ui.srOnly}>Search offers</span>
              <input
                type="search"
                placeholder={
                  allMode ? 'Search by code, description or business...' : 'Search by code or description...'
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            {allMode && (
              <label className={ui.filterWrap}>
                <span className={ui.srOnly}>Filter by business</span>
                <select
                  className={ui.filter}
                  value={businessFilter}
                  onChange={(e) => setBusinessFilter(e.target.value)}
                >
                  <option value="all">All Businesses</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.businessName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className={ui.filterChevron} aria-hidden="true" />
              </label>
            )}
            <label className={ui.filterWrap}>
              <span className={ui.srOnly}>Filter by status</span>
              <select
                className={ui.filter}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="off">Off</option>
                <option value="expired">Expired</option>
                <option value="usedUp">Used up</option>
              </select>
              <ChevronDown size={16} className={ui.filterChevron} aria-hidden="true" />
            </label>
            <label className={ui.filterWrap}>
              <span className={ui.srOnly}>Filter by discount type</span>
              <select
                className={ui.filter}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              >
                <option value="all">All Types</option>
                <option value="PERCENT">Percentage</option>
                <option value="FLAT">Flat amount</option>
              </select>
              <ChevronDown size={16} className={ui.filterChevron} aria-hidden="true" />
            </label>
            <div className={ui.toolbarActions}>
              <button type="button" className={ui.primaryBtn} onClick={create}>
                <Plus size={18} aria-hidden="true" />
                Create Offer
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className={ui.noMatch}>No offers match your filters.</div>
          ) : (
            <div className={ui.grid}>
              {filtered.map(({ coupon: c, status, expiringSoon }) => {
                const scope = scopeRow(c);
                const sub = discountSubline(c);
                const limited = c.usageLimit != null && c.usageLimit > 0;
                const pct = limited
                  ? Math.min(100, (c.usedCount / (c.usageLimit as number)) * 100)
                  : 0;
                const copied = copiedId === c.id;
                return (
                  <article key={c.id} className={ui.ticket}>
                    <div className={ui.ticketBody}>
                      <div className={ui.ticketTop}>
                        <div className={ui.discountBlock}>
                          <span className={ui.amount}>{discountHeadline(c)}</span>
                          {sub && <span className={ui.upTo}>{sub}</span>}
                          {allMode && c.provider?.businessName && (
                            <BusinessName
                              id={c.provider.id}
                              name={c.provider.businessName}
                              className={ui.blockBiz}
                            />
                          )}
                        </div>
                        <div className={ui.pills}>
                          <StatusPill status={status} />
                          {expiringSoon && (
                            <Pill tone="orange" className={ui.smallPill}>
                              <Clock size={13} aria-hidden="true" /> Expiring soon
                            </Pill>
                          )}
                        </div>
                      </div>

                      <div className={ui.codeChip}>
                        <span className={ui.codeText}>{c.code}</span>
                        <button
                          type="button"
                          className={`${ui.copyBtn} ${copied ? ui.copyBtnDone : ''}`}
                          onClick={() => copyCode(c)}
                          aria-label={copied ? `Copied ${c.code}` : `Copy ${c.code}`}
                          title={copied ? 'Copied' : 'Copy code'}
                        >
                          {copied ? (
                            <Check size={16} aria-hidden="true" />
                          ) : (
                            <Copy size={16} aria-hidden="true" />
                          )}
                        </button>
                        {copied && (
                          <span className={ui.copiedTip} role="status">
                            Copied
                          </span>
                        )}
                      </div>

                      {c.description?.trim() && <p className={ui.desc}>{c.description}</p>}

                      <ul className={ui.facts}>
                        <li>
                          <span className={ui.factIcon} aria-hidden="true">
                            {scope.icon}
                          </span>
                          <span className={ui.factText}>{scope.text}</span>
                        </li>
                        <li className={status === 'expired' && c.expiresAt ? ui.factDanger : undefined}>
                          <span className={ui.factIcon} aria-hidden="true">
                            <CalendarDays size={16} />
                          </span>
                          <span className={ui.factText}>{expiryText(c, status)}</span>
                        </li>
                        <li>
                          <span className={ui.factIcon} aria-hidden="true">
                            <Users size={16} />
                          </span>
                          {limited ? (
                            <>
                              <span className={ui.usedText}>
                                {c.usedCount} / {c.usageLimit} used
                              </span>
                              <span
                                className={ui.progress}
                                role="progressbar"
                                aria-label={`${c.code} usage`}
                                aria-valuemin={0}
                                aria-valuemax={c.usageLimit ?? 0}
                                aria-valuenow={c.usedCount}
                              >
                                <span className={ui.progressFill} style={{ width: `${pct}%` }} />
                              </span>
                            </>
                          ) : (
                            <span className={ui.factText}>
                              {c.usedCount} used <span className={ui.dot}>•</span> Unlimited
                            </span>
                          )}
                        </li>
                      </ul>
                    </div>

                    <div className={ui.ticketFooter}>
                      <div className={ui.switchRow}>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={c.isActive}
                          aria-label={`${c.isActive ? 'Pause' : 'Activate'} ${c.code}`}
                          title={c.isActive ? 'On — click to pause' : 'Off — click to activate'}
                          className={`${ui.switch} ${c.isActive ? ui.switchOn : ''}`}
                          onClick={() => toggleCouponActive(c)}
                        >
                          <span className={ui.switchKnob} aria-hidden="true" />
                        </button>
                        <span className={ui.switchLabel}>{STATUS_LABEL[status]}</span>
                      </div>
                      <div className={ui.actions}>
                        <button
                          type="button"
                          className={ui.iconBtn}
                          onClick={() => startEdit(c)}
                          aria-label={`Edit ${c.code}`}
                          title="Edit"
                        >
                          <Pencil size={17} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={`${ui.iconBtn} ${ui.iconBtnDanger}`}
                          onClick={() => remove(c)}
                          aria-label={`Delete ${c.code}`}
                          title="Delete"
                        >
                          <Trash2 size={17} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className={ui.emptyCard}>
          <span className={ui.emptyIcon} aria-hidden="true">
            <Ticket size={28} />
          </span>
          <p className={ui.emptyText}>
            {allMode
              ? 'No offers yet. Create a discount code to run an offer on any of your businesses.'
              : 'No coupons yet. Create a discount code to run an offer on your business.'}
          </p>
          <button type="button" className={ui.primaryBtn} onClick={create}>
            <Plus size={18} aria-hidden="true" />
            {allMode ? 'Create your first offer' : 'Create Offer'}
          </button>
        </div>
      )}

      <OfferPanel
        open={editing !== null}
        title={isNew ? 'Create offer' : 'Edit offer'}
        subtitle={
          allMode && isNew ? 'Pick the business, then set up the discount.' : 'Set up the discount.'
        }
        onClose={cancel}
        onSubmit={submit}
        error={error}
        submitLabel={isNew ? 'Create offer' : 'Save changes'}
        saving={saving}
      >
        {allMode && (
          <div className={ui.field}>
            <label className={ui.label} htmlFor="couponBusiness">
              Business <span className={ui.required}>*</span>
            </label>
            {isNew ? (
              <div className={ui.bizSelect}>
                <div className={ui.bizSelectFace} aria-hidden="true">
                  {formBusiness ? (
                    <>
                      <BusinessName id={formBusiness.id} name={formBusiness.businessName} />
                      <TypePill type={formBusiness.type} />
                    </>
                  ) : (
                    <span className={ui.placeholder}>Select a business…</span>
                  )}
                  <ChevronDown size={18} className={ui.bizSelectChevron} />
                </div>
                <select
                  id="couponBusiness"
                  className={ui.bizSelectNative}
                  value={form.businessId}
                  onChange={(e) => {
                    const b = businesses.find((x) => x.id === e.target.value);
                    setBusiness(e.target.value, b?.type);
                  }}
                >
                  <option value="">Select a business…</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.businessName} ({b.type === 'STORE' ? 'Store' : 'Service'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div id="couponBusiness" className={`${ui.bizSelectFace} ${ui.readonlyField}`}>
                {formBusiness ? (
                  <>
                    <BusinessName id={formBusiness.id} name={formBusiness.businessName} />
                    <TypePill type={formBusiness.type} />
                  </>
                ) : editingCoupon?.provider ? (
                  <BusinessName
                    id={editingCoupon.provider.id}
                    name={editingCoupon.provider.businessName}
                  />
                ) : (
                  '—'
                )}
              </div>
            )}
          </div>
        )}

        <div className={ui.formGrid}>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="code">
              Code <span className={ui.required}>*</span>
            </label>
            <input
              id="code"
              name="code"
              className={ui.input}
              placeholder="e.g. SAVE20"
              value={form.code}
              onChange={onChange}
              autoCapitalize="characters"
              autoComplete="off"
            />
          </div>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className={`${ui.input} ${ui.textarea}`}
              placeholder="e.g. 20% off your first order"
              rows={2}
              value={form.description}
              onChange={onChange}
            />
          </div>

          <div className={ui.field}>
            <span className={ui.label} id="discountTypeLabel">
              Discount type
            </span>
            <Segmented
              label="Discount type"
              value={form.discountType}
              options={[
                { value: 'PERCENT', label: 'Percentage' },
                { value: 'FLAT', label: 'Flat ₹' },
              ]}
              onChange={setType}
            />
          </div>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="discountValue">
              Value <span className={ui.required}>*</span>
            </label>
            <div className={ui.affix}>
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
              <span className={ui.suffix}>{form.discountType === 'PERCENT' ? '%' : '₹'}</span>
            </div>
          </div>

          {form.discountType === 'PERCENT' && (
            <div className={ui.field}>
              <label className={ui.label} htmlFor="maxDiscount">
                Max discount
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
                  placeholder="No cap"
                  value={form.maxDiscount}
                  onChange={onChange}
                />
              </div>
            </div>
          )}
          <div className={`${ui.field} ${ui.col2}`}>
            <span className={ui.label}>Applies to</span>
            <Segmented
              label="Applies to"
              value={form.scope === 'ORDER' ? 'ORDER' : 'ITEM'}
              options={[
                { value: 'ORDER', label: 'Any order' },
                { value: 'ITEM', label: `Specific ${itemLabel}` },
              ]}
              disabledValues={allMode && !formBusiness ? ['ITEM'] : []}
              onChange={(v) => {
                if (v === 'ORDER') {
                  if (form.scope !== 'ORDER') setScope('ORDER');
                } else if (form.scope === 'ORDER') {
                  setScope(businessType === 'STORE' ? 'PRODUCT' : 'SERVICE');
                }
              }}
            />
            {allMode && !formBusiness && (
              <p className={ui.hint}>Pick a business to target one of its {itemLabel}s.</p>
            )}
            {form.scope !== 'ORDER' &&
              (items.length === 0 ? (
                <p className={ui.noItems}>
                  You don’t have any {itemLabel}s yet. Add one first to scope an offer to it.
                </p>
              ) : (
                <div className={ui.selectWrap}>
                  <label className={ui.srOnly} htmlFor={businessType === 'STORE' ? 'productId' : 'serviceId'}>
                    {businessType === 'STORE' ? 'Product' : 'Service'}
                  </label>
                  <select
                    id={businessType === 'STORE' ? 'productId' : 'serviceId'}
                    name={businessType === 'STORE' ? 'productId' : 'serviceId'}
                    className={`${ui.input} ${ui.select}`}
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
                  <ChevronDown size={18} className={ui.selectChevron} aria-hidden="true" />
                </div>
              ))}
          </div>

          <div className={ui.field}>
            <label className={ui.label} htmlFor="minOrder">
              Minimum order
            </label>
            <div
              className={`${ui.affix} ${form.scope !== 'ORDER' ? ui.affixDisabled : ''}`}
              title={form.scope !== 'ORDER' ? `Not used for a specific ${itemLabel}` : undefined}
            >
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
                disabled={form.scope !== 'ORDER'}
              />
            </div>
          </div>
          <div className={ui.field}>
            <label className={ui.label} htmlFor="expiresAt">
              Expires on
            </label>
            <div className={ui.affix}>
              <input
                ref={expiresRef}
                id="expiresAt"
                name="expiresAt"
                className={ui.dateInput}
                type="date"
                value={form.expiresAt}
                onChange={onChange}
              />
              <button
                type="button"
                className={ui.affixBtn}
                onClick={openDatePicker}
                aria-label="Pick expiry date"
                tabIndex={-1}
              >
                <CalendarDays size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className={ui.field}>
            <label className={ui.label} htmlFor="usageLimit">
              Usage limit
            </label>
            <input
              id="usageLimit"
              name="usageLimit"
              className={ui.input}
              type="number"
              min="1"
              inputMode="numeric"
              placeholder="Unlimited"
              value={form.usageLimit}
              onChange={onChange}
            />
          </div>
        </div>

        <div className={ui.activeRow}>
          <button
            type="button"
            role="switch"
            aria-checked={form.isActive}
            aria-labelledby="couponActiveLabel"
            className={`${ui.switch} ${form.isActive ? ui.switchOn : ''}`}
            onClick={() => toggleActive()}
          >
            <span className={ui.switchKnob} aria-hidden="true" />
          </button>
          <span id="couponActiveLabel" className={ui.switchLabel}>
            Active — customers can use this code
          </span>
        </div>
      </OfferPanel>
    </div>
  );
}
