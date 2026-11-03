import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Ban,
  Box,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  Clock,
  Copy,
  Layers,
  Package,
  Pencil,
  Percent,
  Plus,
  Power,
  Scissors,
  Search,
  ShoppingCart,
  Store,
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
import { BusinessType, Coupon, Product, Service } from '@/redux/api/provider/types';
import { useCouponsManager } from './useCouponsManager';
import styles from '@/components/ServicesManager/ServicesManager.module.css';
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
      icon: <Scissors size={16} />,
      text: `On ${c.service?.name ?? 'a specific service'} (service)`,
    };
  }
  if (c.scope === 'PRODUCT') {
    return {
      icon: <Box size={16} />,
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

  // ── List filters ────────────────────────────────────────────────────
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
        c.code.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q)
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

  return (
    <div className={ui.root}>
      {isLoading ? (
        <Skeleton height={220} radius="var(--m-radius-card)" />
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
                placeholder="Search by code or description..."
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
                const limited = c.usageLimit != null && c.usageLimit > 0;
                const pct = limited
                  ? Math.min(100, (c.usedCount / (c.usageLimit as number)) * 100)
                  : 0;
                const faded = status === 'expired' || status === 'usedUp';
                const copied = copiedId === c.id;
                return (
                  <article
                    key={c.id}
                    className={`${ui.ticket} ${faded ? ui.ticketFaded : ''}`}
                  >
                    <div className={ui.ticketBody}>
                      <div className={ui.ticketTop}>
                        <div className={ui.headline}>
                          <span className={ui.amount}>{discountHeadline(c)}</span>
                          {c.discountType === 'PERCENT' && c.maxDiscountMinor ? (
                            <span className={ui.upTo}>up to {money(c.maxDiscountMinor)}</span>
                          ) : null}
                        </div>
                        <div className={ui.pills}>
                          <StatusPill status={status} />
                          {expiringSoon && (
                            <Pill tone="orange">
                              <Clock size={14} aria-hidden="true" /> Expiring soon
                            </Pill>
                          )}
                        </div>
                      </div>

                      {c.provider?.businessName && (
                        <span className={ui.bizTag}>
                          <Store size={12} aria-hidden="true" />
                          {c.provider.businessName}
                        </span>
                      )}

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
                          {scope.text}
                        </li>
                        <li>
                          <span className={ui.factIcon} aria-hidden="true">
                            <CalendarDays size={16} />
                          </span>
                          {expiryText(c, status)}
                        </li>
                        <li>
                          <span className={ui.factIcon} aria-hidden="true">
                            <Users size={16} />
                          </span>
                          {limited ? (
                            `${c.usedCount} / ${c.usageLimit} used`
                          ) : (
                            <>
                              {c.usedCount} used <span className={ui.dot}>•</span> Unlimited
                            </>
                          )}
                        </li>
                      </ul>

                      {limited && (
                        <div
                          className={ui.progress}
                          role="progressbar"
                          aria-label={`${c.code} usage`}
                          aria-valuemin={0}
                          aria-valuemax={c.usageLimit ?? 0}
                          aria-valuenow={c.usedCount}
                        >
                          <span className={ui.progressFill} style={{ width: `${pct}%` }} />
                        </div>
                      )}
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
                        >
                          <Pencil size={17} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={`${ui.iconBtn} ${ui.iconBtnDanger}`}
                          onClick={() => remove(c.id)}
                          aria-label={`Delete ${c.code}`}
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
            No coupons yet. Create a discount code to run an offer on your business.
          </p>
          <button type="button" className={ui.primaryBtn} onClick={startAdd}>
            <Plus size={18} aria-hidden="true" />
            Create Offer
          </button>
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
    </div>
  );
}
