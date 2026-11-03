import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Command,
  CreditCard,
  FileText,
  Flame,
  House,
  MapPin,
  Pencil,
  Percent,
  Plus,
  Search,
  Tag,
  Timer,
  Trash2,
} from 'lucide-react';

import { Combobox } from '@/components/Combobox';
import { FormDialog } from '@/components/FormDialog';
import { FormSection } from '@/components/FormSection';
import { OptionSection } from '@/components/OptionSection';
import { Select } from '@/components/Select';
import { Service } from '@/redux/api/provider/types';
import { SERVICE_SUGGESTIONS } from '@/data/serviceSuggestions';
import { serviceIcon } from '@/utils/serviceIcon';
import { ServicesManagerProps } from './types';
import { useServicesManager } from './useServicesManager';
import { ServiceStat, lastBookedText, statKey, useServiceStats } from './useServiceStats';
// Form-field styles (shared with other managers — keep as is)…
import styles from './ServicesManager.module.css';
// …plus the mockup-matched list (tiles / toolbar / table).
import ui from './ServicesList.module.css';

const PAGE_SIZE = 10;

type StatusFilter = 'all' | 'active' | 'inactive';
type SortKey = 'booked' | 'priceDesc' | 'priceAsc' | 'duration' | 'name';

const EMPTY_STAT: ServiceStat = { count: 0, revenueMinor: 0, lastBookedAt: null };

function formatPrice(minor: number, currency: string) {
  const amount = (minor / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return currency === 'INR' ? `₹${amount}` : `${amount} ${currency}`;
}

/** Turns 90 into "1 hr 30 min" — clearer than a raw minute count. */
function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} min`;
  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
}

const HOUR_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function SummaryTile({
  tone,
  icon,
  label,
  children,
}: {
  tone: 'blue' | 'mint' | 'lavender' | 'peach';
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={`${ui.tile} ${ui[`tile_${tone}`]}`}>
      <span className={ui.tileIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={ui.tileText}>
        <span className={ui.tileLabel}>{label}</span>
        {children}
      </div>
    </div>
  );
}

/** "Home visit · ₹99 + ₹10/km" — only the fee parts that are set. */
function homeVisitText(s: Service) {
  const fees: string[] = [];
  if (s.travelBaseFeeMinor) fees.push(formatPrice(s.travelBaseFeeMinor, s.currency));
  if (s.travelPerKmMinor) fees.push(`${formatPrice(s.travelPerKmMinor, s.currency)}/km`);
  return fees.length ? `Home visit · ${fees.join(' + ')}` : 'Home visit';
}

/** Add / edit / delete the services offered by a business. */
export function ServicesManager({
  providerId,
  services,
  subcategorySlug,
  businessPartialPayEnabled,
}: ServicesManagerProps) {
  const {
    editing,
    form,
    error,
    saving,
    startAdd,
    startEdit,
    cancel,
    onChange,
    toggleTravelRequired,
    togglePartialPayEnabled,
    applySuggestion,
    submit,
    remove,
    toggleActive,
  } = useServicesManager(providerId, businessPartialPayEnabled);
  const { stats } = useServiceStats(providerId);

  const suggestions = (subcategorySlug && SERVICE_SUGGESTIONS[subcategorySlug]) || [];
  const comboItems = suggestions.map((s) => ({ label: s.name, meta: s.durationMin }));

  const isNew = editing === 'new';

  // The form is split into tabs; it always opens on the first one.
  const [tab, setTab] = useState('details');
  useEffect(() => {
    if (editing !== null) setTab('details');
  }, [editing]);
  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'pricing', label: 'Price & time' },
    { id: 'options', label: 'Options' },
  ];

  // ── Summary, filters, sorting and client-side paging ───────────────
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('booked');
  const [page, setPage] = useState(1);

  const statOf = (s: Service) => stats.get(statKey(s.name)) ?? EMPTY_STAT;

  const summary = useMemo(() => {
    const active = services.filter((s) => s.isActive !== false);
    const priced = active.length ? active : services;
    const avgMinor = priced.length
      ? priced.reduce((sum, s) => sum + s.priceMinor, 0) / priced.length
      : null;
    let top: { name: string; count: number } | null = null;
    for (const s of services) {
      const count = (stats.get(statKey(s.name)) ?? EMPTY_STAT).count;
      if (count > 0 && (!top || count > top.count)) top = { name: s.name, count };
    }
    return {
      total: services.length,
      active: active.length,
      top,
      avg: avgMinor === null ? null : formatPrice(Math.round(avgMinor / 100) * 100, priced[0].currency),
    };
  }, [services, stats]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const count = (s: Service) => (stats.get(statKey(s.name)) ?? EMPTY_STAT).count;
    const rows = services.filter((s) => {
      if (
        q &&
        !s.name.toLowerCase().includes(q) &&
        !(s.description ?? '').toLowerCase().includes(q)
      )
        return false;
      if (statusFilter === 'active' && s.isActive === false) return false;
      if (statusFilter === 'inactive' && s.isActive !== false) return false;
      return true;
    });
    const byName = (a: Service, b: Service) => a.name.localeCompare(b.name);
    const cmp: Record<SortKey, (a: Service, b: Service) => number> = {
      booked: (a, b) => count(b) - count(a) || byName(a, b),
      priceDesc: (a, b) => b.priceMinor - a.priceMinor || byName(a, b),
      priceAsc: (a, b) => a.priceMinor - b.priceMinor || byName(a, b),
      duration: (a, b) => a.durationMin - b.durationMin || byName(a, b),
      name: byName,
    };
    return [...rows].sort(cmp[sort]);
  }, [services, stats, query, statusFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  // Any filter/search/sort change starts over on page 1.
  const withPageReset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };
  const onQuery = withPageReset(setQuery);
  const onStatus = withPageReset(setStatusFilter);
  const onSort = withPageReset(setSort);

  const hasServices = services.length > 0 || editing === 'new';

  return (
    <div className={ui.root}>
      {hasServices ? (
        <>
          <div className={ui.tiles}>
            <SummaryTile tone="blue" icon={<Command size={26} />} label="Total Services">
              <span className={ui.tileValue}>{summary.total}</span>
            </SummaryTile>
            <SummaryTile tone="mint" icon={<Check size={28} />} label="Active">
              <span className={ui.tileValue}>{summary.active}</span>
            </SummaryTile>
            <SummaryTile tone="lavender" icon={<Flame size={26} />} label="Most Booked">
              {summary.top ? (
                <span className={ui.tileSub} title={summary.top.name}>
                  <span className={ui.tileSubName}>{summary.top.name}</span>
                  <span aria-hidden="true">•</span>
                  <span>{summary.top.count.toLocaleString('en-IN')}</span>
                </span>
              ) : (
                <span className={ui.tileValue}>—</span>
              )}
            </SummaryTile>
            <SummaryTile tone="peach" icon={<Tag size={26} />} label="Avg. Price">
              <span className={ui.tileValue}>{summary.avg ?? '—'}</span>
            </SummaryTile>
          </div>

          <div className={ui.toolbar}>
            <label className={ui.search}>
              <Search size={18} aria-hidden="true" />
              <span className={ui.srOnly}>Search services</span>
              <input
                type="search"
                placeholder="Search services..."
                value={query}
                onChange={(e) => onQuery(e.target.value)}
              />
            </label>
            <label className={ui.filterWrap}>
              <span className={ui.srOnly}>Filter by status</span>
              <select
                className={ui.filter}
                value={statusFilter}
                onChange={(e) => onStatus(e.target.value as StatusFilter)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown size={16} className={ui.filterChevron} aria-hidden="true" />
            </label>
            <label className={ui.filterWrap}>
              <span className={ui.srOnly}>Sort services</span>
              <select
                className={`${ui.filter} ${ui.sortFilter}`}
                value={sort}
                onChange={(e) => onSort(e.target.value as SortKey)}
              >
                <option value="booked">Sort: Most booked</option>
                <option value="priceDesc">Sort: Price: high to low</option>
                <option value="priceAsc">Sort: Price: low to high</option>
                <option value="duration">Sort: Duration</option>
                <option value="name">Sort: Name</option>
              </select>
              <ChevronDown size={16} className={ui.filterChevron} aria-hidden="true" />
            </label>
            <button type="button" className={ui.primaryBtn} onClick={startAdd}>
              <Plus size={18} aria-hidden="true" />
              Add Service
            </button>
          </div>

          <div className={ui.tableCard}>
            <div className={ui.tableScroll}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Duration</th>
                    <th>Price</th>
                    <th>Bookings</th>
                    <th>Revenue</th>
                    <th>Options</th>
                    <th className={ui.center}>Status</th>
                    <th className={ui.center}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={ui.noMatch}>
                        No services match your filters.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((s) => {
                      const active = s.isActive !== false;
                      const stat = statOf(s);
                      const Icon = serviceIcon(s.name);
                      const desc = s.description?.trim();
                      // Partial pay only applies when the business itself allows it.
                      const partial =
                        s.partialPayEnabled === true && businessPartialPayEnabled !== false;
                      return (
                        <tr key={s.id}>
                          <td>
                            <div className={ui.serviceCell}>
                              <span className={ui.iconBox} aria-hidden="true">
                                <Icon size={22} />
                              </span>
                              <div className={ui.cellMain}>
                                <span className={ui.cellTitle}>{s.name}</span>
                                {desc && (
                                  <span className={ui.cellSub} title={desc}>
                                    {desc}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={ui.duration}>
                              <Clock size={17} aria-hidden="true" />
                              {formatDuration(s.durationMin)}
                            </span>
                          </td>
                          <td className={ui.strong}>{formatPrice(s.priceMinor, s.currency)}</td>
                          <td>
                            <div className={ui.bookings}>
                              <span className={ui.strong}>{stat.count.toLocaleString('en-IN')}</span>
                              <span className={ui.cellSubPlain}>
                                last booked {lastBookedText(stat.lastBookedAt)}
                              </span>
                            </div>
                          </td>
                          <td className={ui.strong}>{formatPrice(stat.revenueMinor, s.currency)}</td>
                          <td>
                            {s.travelRequired || partial ? (
                              <div className={ui.chips}>
                                {s.travelRequired && (
                                  <span className={`${ui.chip} ${ui.chipBlue}`}>
                                    <House size={15} aria-hidden="true" />
                                    {homeVisitText(s)}
                                  </span>
                                )}
                                {partial && (
                                  <span className={`${ui.chip} ${ui.chipGrey}`}>
                                    <CreditCard size={15} aria-hidden="true" />
                                    Partial pay
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className={ui.dash}>—</span>
                            )}
                          </td>
                          <td className={ui.center}>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={active}
                              aria-label={`${active ? 'Deactivate' : 'Activate'} ${s.name}`}
                              title={active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                              className={`${ui.switch} ${active ? ui.switchOn : ''}`}
                              onClick={() => toggleActive(s)}
                            >
                              <span className={ui.switchKnob} aria-hidden="true" />
                            </button>
                          </td>
                          <td>
                            <div className={ui.actions}>
                              <button
                                type="button"
                                className={ui.iconBtn}
                                onClick={() => startEdit(s)}
                                aria-label={`Edit ${s.name}`}
                              >
                                <Pencil size={18} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className={`${ui.iconBtn} ${ui.iconBtnDanger}`}
                                onClick={() => remove(s.id)}
                                aria-label={`Delete ${s.name}`}
                              >
                                <Trash2 size={18} aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filtered.length > 0 && (
              <div className={ui.pager}>
                <span className={ui.pagerInfo}>
                  Showing {pageStart + 1}–{pageStart + pageRows.length} of {filtered.length}{' '}
                  {filtered.length === 1 ? 'service' : 'services'}
                </span>
                {pageCount > 1 && (
                  <nav className={ui.pagerNav} aria-label="Services pages">
                    <button
                      type="button"
                      className={ui.pageArrow}
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={18} aria-hidden="true" />
                    </button>
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`${ui.pageNum} ${n === currentPage ? ui.pageNumActive : ''}`}
                        onClick={() => setPage(n)}
                        aria-current={n === currentPage ? 'page' : undefined}
                        aria-label={`Page ${n}`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={ui.pageArrow}
                      onClick={() => setPage(currentPage + 1)}
                      disabled={currentPage >= pageCount}
                      aria-label="Next page"
                    >
                      <ChevronRight size={18} aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className={ui.emptyCard}>
          <span className={ui.emptyIcon} aria-hidden="true">
            <Command size={28} />
          </span>
          <p className={ui.emptyText}>
            No services yet. Add the services you offer so customers know what they can book.
          </p>
          <button type="button" className={ui.primaryBtn} onClick={startAdd}>
            <Plus size={18} aria-hidden="true" />
            Add Service
          </button>
        </div>
      )}

      <FormDialog
        open={editing !== null}
        title={isNew ? 'Add a service' : 'Edit service'}
        subtitle="What customers can book, with its price and how long it takes."
        onClose={cancel}
        onSubmit={submit}
        tabs={tabs}
        activeTab={tab}
        onTabChange={setTab}
        error={error}
        submitLabel={isNew ? 'Add service' : 'Save changes'}
        submitting={saving}
      >
        {tab === 'details' && (
          <FormSection
            icon={<FileText size={16} />}
            title="Service details"
          >
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">
                Service name
              </label>
              <Combobox
                id="name"
                name="name"
                placeholder="e.g. Root Canal Treatment, or search common services"
                value={form.name}
                items={isNew ? comboItems : []}
                onChange={onChange}
                onSelect={(item) => applySuggestion(item.label, item.meta)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="description">
                Description <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                className={styles.textarea}
                placeholder="What's included in this service?"
                value={form.description}
                onChange={onChange}
              />
            </div>
          </FormSection>
        )}

        {tab === 'pricing' && (
          <FormSection
            icon={<Tag size={16} />}
            title="Price & duration"
            description="How much it costs and how long it takes. Duration blocks out the calendar."
          >
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="price">
                  Price
                </label>
                <div className={styles.inputPrefix}>
                  <span className={styles.prefix}>₹</span>
                  <input
                    id="price"
                    name="price"
                    className={styles.input}
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    placeholder="500"
                    value={form.price}
                    onChange={onChange}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="hours">
                  Duration
                </label>
                <div className={styles.durationSelects}>
                  <Select id="hours" name="hours" value={form.hours} onChange={onChange}>
                    {HOUR_OPTIONS.map((h) => (
                      <option key={h} value={h}>
                        {h} hr
                      </option>
                    ))}
                  </Select>
                  <Select
                    name="minutes"
                    value={form.minutes}
                    onChange={onChange}
                    aria-label="Duration minutes"
                  >
                    {MINUTE_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m} min
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
            <p className={styles.formHint}>
              <Timer size={14} aria-hidden="true" /> Customers book a{' '}
              <strong>{formatDuration(Number(form.hours) * 60 + Number(form.minutes) || 0)}</strong>{' '}
              slot
              {form.price ? (
                <>
                  {' '}
                  for <strong>₹{Number(form.price).toLocaleString('en-IN')}</strong>
                </>
              ) : null}
              .
            </p>
          </FormSection>
        )}

        {tab === 'options' && (
          <>
            <OptionSection
              name="travelRequired"
              icon={<MapPin size={16} />}
              label="On-location service"
              description="You travel to the customer instead of them visiting you."
              checked={form.travelRequired}
              onChange={toggleTravelRequired}
              settingsTitle="Travel charges"
            >
              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="travelBaseFee">
                    Base travel fee
                  </label>
                  <div className={styles.inputPrefix}>
                    <span className={styles.prefix}>₹</span>
                    <input
                      id="travelBaseFee"
                      name="travelBaseFee"
                      className={styles.input}
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      placeholder="0"
                      value={form.travelBaseFee}
                      onChange={onChange}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="travelPerKm">
                    Fee per km
                  </label>
                  <div className={styles.inputPrefix}>
                    <span className={styles.prefix}>₹</span>
                    <input
                      id="travelPerKm"
                      name="travelPerKm"
                      className={styles.input}
                      type="number"
                      min="0"
                      step="any"
                      inputMode="decimal"
                      placeholder="0"
                      value={form.travelPerKm}
                      onChange={onChange}
                    />
                  </div>
                </div>
              </div>
              <p className={styles.formHint}>
                The customer pays the base fee plus the per-km fee for the distance from your
                business to their address, on top of the service price.
              </p>
            </OptionSection>

            <OptionSection
              name="partialPayEnabled"
              icon={<Percent size={16} />}
              label="Accept partial payment for this service"
              description={
                businessPartialPayEnabled === false
                  ? 'Partial payment is turned off for the whole business. Turn it on under Edit business → Payments.'
                  : 'Customers can pay a deposit now to confirm, and the rest at the appointment.'
              }
              checked={form.partialPayEnabled && businessPartialPayEnabled !== false}
              disabled={businessPartialPayEnabled === false}
              onChange={togglePartialPayEnabled}
              settingsTitle="Deposit"
            >
              <p className={styles.formHint}>
                The deposit percentage is set once for your whole business, under Edit business →
                Payments.
              </p>
            </OptionSection>
          </>
        )}
      </FormDialog>
    </div>
  );
}
