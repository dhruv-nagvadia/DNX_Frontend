import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Ban,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  Clock,
  Copy,
  Layers,
  LayoutGrid,
  Pencil,
  Percent,
  Plus,
  Power,
  Search,
  ShoppingCart,
  Tag,
  Target,
  Ticket,
  Trash2,
  Users,
} from 'lucide-react';

import { FormDialog } from '@/components/FormDialog';
import { FormSection } from '@/components/FormSection';
import { OptionSection } from '@/components/OptionSection';
import { Pill } from '@/components/Pill';
import { Select } from '@/components/Select';
import { Skeleton } from '@/components/Skeleton';
import { useGetCategoriesQuery } from '@/redux/api/category/categoryApi';
import { PlatformCoupon, PlatformCouponAppliesTo } from '@/redux/api/admin/types';
import { usePlatformCouponsManager } from './usePlatformCouponsManager';
// Generic field/label styling shared across provider/admin forms.
import styles from '@/components/ServicesManager/ServicesManager.module.css';
// Own copy of the provider offers look — CouponsManager.module.css belongs to the provider page.
import ui from './PlatformCouponsManager.module.css';

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRING_SOON_DAYS = 7;

const money = (minor: number) => `₹${(minor / 100).toLocaleString('en-IN')}`;

const APPLIES_TO_LABEL: Record<PlatformCouponAppliesTo, string> = {
  ANY: 'Bookings & orders',
  BOOKING: 'Bookings only',
  ORDER: 'Store orders only',
};

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

type CouponStatus = 'active' | 'off' | 'expired' | 'usedUp';
type StatusFilter = 'all' | CouponStatus;
type TypeFilter = 'all' | 'PERCENT' | 'FLAT';

interface CouponView {
  coupon: PlatformCoupon;
  status: CouponStatus;
  expiringSoon: boolean;
}

/** Single display status for a coupon (expired wins over used up). */
function describe(c: PlatformCoupon, now: number): CouponView {
  const expiresAt = c.expiresAt ? new Date(c.expiresAt).getTime() : null;
  const expired = expiresAt !== null && expiresAt < now;
  const usedUp = c.usageLimit != null && c.usageLimit > 0 && c.usedCount >= c.usageLimit;
  const status: CouponStatus = expired ? 'expired' : usedUp ? 'usedUp' : c.isActive ? 'active' : 'off';
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

function discountHeadline(c: PlatformCoupon): string {
  return c.discountType === 'PERCENT' ? `${c.discountValue}% OFF` : `${money(c.discountValue)} OFF`;
}

/** Grey sub-line under the headline: the cap for a %, the threshold otherwise. */
function discountSubline(c: PlatformCoupon): string | null {
  if (c.discountType === 'PERCENT' && c.maxDiscountMinor) return `up to ${money(c.maxDiscountMinor)}`;
  if (c.discountType === 'FLAT' && c.minOrderMinor > 0) return `above ${money(c.minOrderMinor)}`;
  return null;
}

function appliesToText(c: PlatformCoupon): string {
  const base = APPLIES_TO_LABEL[c.appliesTo];
  return c.minOrderMinor > 0 ? `${base} above ${money(c.minOrderMinor)}` : base;
}

function expiryText(c: PlatformCoupon, status: CouponStatus): string {
  if (!c.expiresAt) return 'No expiry';
  const date = dateFmt.format(new Date(c.expiresAt));
  return status === 'expired' ? `Expired on ${date}` : `Expires ${date}`;
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

/** Create / edit / delete platform-wide discount codes, usable across any business. */
export function PlatformCouponsManager() {
  const {
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

  // ── List filters (view only) ────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const views = useMemo(() => {
    const now = Date.now();
    return coupons.map((c) => describe(c, now));
  }, [coupons]);

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
        (c.category?.name ?? '').toLowerCase().includes(q)
      );
    });
  }, [views, query, statusFilter, typeFilter]);

  // ── Copy-code feedback ──────────────────────────────────────────────
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(copyTimer.current), []);
  const copyCode = (c: PlatformCoupon) => {
    navigator.clipboard
      ?.writeText(c.code)
      .then(() => {
        setCopiedId(c.id);
        window.clearTimeout(copyTimer.current);
        copyTimer.current = window.setTimeout(() => setCopiedId(null), 1500);
      })
      .catch(() => undefined);
  };

  return (
    <div className={ui.root}>
      {isLoading ? (
        <Skeleton height={220} radius="var(--m-radius-card)" />
      ) : coupons.length === 0 ? (
        <div className={ui.emptyCard}>
          <span className={ui.emptyIcon} aria-hidden="true">
            <Ticket size={24} />
          </span>
          <p className={ui.emptyText}>
            No platform coupons yet. Create one to run a site-wide promo across all businesses.
          </p>
          <button type="button" className={ui.primaryBtn} onClick={startAdd}>
            <Plus size={18} aria-hidden="true" />
            Add coupon
          </button>
        </div>
      ) : (
        <>
          <div className={ui.tiles}>
            <SummaryTile tone="blue" icon={<Tag size={20} />} label="Total coupons" value={counts.total} />
            <SummaryTile tone="mint" icon={<CircleCheck size={20} />} label="Active" value={counts.active} />
            <SummaryTile
              tone="peach"
              icon={<Clock size={20} />}
              label="Expiring soon"
              value={counts.expiringSoon}
              note={`(within ${EXPIRING_SOON_DAYS} days)`}
            />
            <SummaryTile tone="lavender" icon={<Users size={20} />} label="Times used" value={counts.used} />
          </div>

          <div className={ui.toolbar}>
            <label className={ui.search}>
              <Search size={18} aria-hidden="true" />
              <span className={ui.srOnly}>Search coupons</span>
              <input
                type="search"
                placeholder="Search by code, description or category..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
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
              <button type="button" className={ui.primaryBtn} onClick={startAdd}>
                <Plus size={18} aria-hidden="true" />
                Add coupon
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className={ui.noMatch}>No coupons match your filters.</div>
          ) : (
            <div className={ui.grid}>
              {filtered.map(({ coupon: c, status, expiringSoon }) => {
                const sub = discountSubline(c);
                const limited = c.usageLimit != null && c.usageLimit > 0;
                const pct = limited ? Math.min(100, (c.usedCount / (c.usageLimit as number)) * 100) : 0;
                const copied = copiedId === c.id;
                return (
                  <article key={c.id} className={ui.ticket}>
                    <div className={ui.ticketBody}>
                      <div className={ui.ticketTop}>
                        <div className={ui.discountBlock}>
                          <span className={ui.amount}>{discountHeadline(c)}</span>
                          {sub && <span className={ui.upTo}>{sub}</span>}
                          <span className={ui.blockTag} title={c.category?.name ?? 'Every category'}>
                            <LayoutGrid size={13} aria-hidden="true" />
                            {c.category ? c.category.name : 'All categories'}
                          </span>
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
                          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
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
                            <ShoppingCart size={16} />
                          </span>
                          <span className={ui.factText}>{appliesToText(c)}</span>
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
                          onClick={() => remove(c.id)}
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
    </div>
  );
}
