import { KeyboardEvent, ReactNode, useMemo, useState } from 'react';
import {
  Bell,
  CalendarClock,
  CalendarDays,
  CalendarX2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Command,
  Search,
  Wallet,
} from 'lucide-react';

import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { Skeleton } from '@/components/Skeleton';
import {
  useCollectBookingPaymentMutation,
  useGetBusinessBookingsQuery,
  useUpdateBookingStatusMutation,
} from '@/redux/api/provider/providerApi';
import { BookingStatus, ProviderBooking } from '@/redux/api/provider/types';

import { BookingDetails } from './BookingDetails';
import { ServiceIconBox } from './ServiceIconBox';
import {
  DATE_FILTERS,
  DateFilter,
  STATUS,
  StatusTab,
  TABS,
  bookedAgo,
  clock,
  dayLabel,
  durationMin,
  isCancelled,
  isToday,
  matchesDate,
  matchesTab,
  money,
  needsCollect,
  outstandingOf,
  payBadge,
  shortId,
  timeRange,
} from './bookingUtils';
import { BusinessBookingsProps } from './types';
import styles from './BusinessBookings.module.css';

const PAGE_SIZE = 6;

type TileTone = 'lavender' | 'blue' | 'teal' | 'peach';

function SummaryTile({
  tone,
  icon,
  label,
  value,
  sub,
}: {
  tone: TileTone;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  return (
    <div className={`${styles.tile} ${styles[`tile_${tone}`]}`}>
      <span className={styles.tileIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={styles.tileText}>
        <span className={styles.tileLabel}>{label}</span>
        <span className={styles.tileValue}>{value}</span>
        {sub && <span className={styles.tileSub}>{sub}</span>}
      </div>
    </div>
  );
}

/** Page numbers with ellipses once there are more than 7 pages. */
function pageList(page: number, count: number): (number | 'gap')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const out: (number | 'gap')[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(count - 1, page + 1);
  if (from > 2) out.push('gap');
  for (let p = from; p <= to; p++) out.push(p);
  if (to < count - 1) out.push('gap');
  out.push(count);
  return out;
}

const errorMessage = (err: unknown, fallback: string) =>
  (err as { data?: { message?: string } })?.data?.message ?? fallback;

/** A business's bookings: summary tiles, filterable table and a details panel
 * for moving the selected booking New → Confirmed → In progress → Completed. */
export function BusinessBookings({ providerId }: BusinessBookingsProps) {
  // Bookings come from the customer app (a separate client), so refetch on
  // open / focus and poll while the tab is visible.
  const { data, isLoading } = useGetBusinessBookingsQuery(providerId, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    pollingInterval: 30_000,
  });
  const [updateStatus, { isLoading: updating }] = useUpdateBookingStatusMutation();
  const [collectPayment, { isLoading: collecting }] = useCollectBookingPaymentMutation();
  const busy = updating || collecting;

  const bookings = useMemo(
    // Most recently booked first (falls back to appointment time when createdAt is missing).
    () =>
      [...(data ?? [])].sort(
        (a, b) => new Date(b.createdAt ?? b.startTime).getTime() - new Date(a.createdAt ?? a.startTime).getTime(),
      ),
    [data],
  );

  // ── Filters / paging / selection ────────────────────────────────────
  const [tab, setTab] = useState<StatusTab>('ALL');
  // null = not chosen yet: default to Today when there's something today.
  const [dateChoice, setDateChoice] = useState<DateFilter | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Cancel-with-reason modal.
  const [cancelling, setCancelling] = useState<ProviderBooking | null>(null);
  const [reason, setReason] = useState('');
  // Collect-cash confirmation modal.
  const [settling, setSettling] = useState<ProviderBooking | null>(null);

  const hasToday = bookings.some(isToday);
  const dateFilter: DateFilter = dateChoice ?? (hasToday ? 'TODAY' : 'ALL');

  const tiles = useMemo(
    () => ({
      pending: bookings.filter((b) => b.status === 'PENDING').length,
      today: bookings.filter((b) => isToday(b) && !isCancelled(b)).length,
      inProgress: bookings.filter((b) => b.status === 'IN_PROGRESS').length,
      cash: bookings.filter(needsCollect).reduce((sum, b) => sum + outstandingOf(b), 0),
    }),
    [bookings],
  );
  const currency = bookings[0]?.currency ?? 'INR';

  // Tab counts follow the date filter so they match what each tab shows.
  const inDate = useMemo(() => bookings.filter((b) => matchesDate(b, dateFilter)), [bookings, dateFilter]);
  const tabCounts = useMemo(
    () =>
      Object.fromEntries(TABS.map((t) => [t.key, inDate.filter((b) => matchesTab(b, t.key)).length])) as Record<
        StatusTab,
        number
      >,
    [inDate],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qId = q.replace(/^#/, '');
    const qDigits = q.replace(/\D/g, '');
    return inDate.filter((b) => {
      if (!matchesTab(b, tab)) return false;
      if (!q) return true;
      return (
        shortId(b).toLowerCase().includes(qId) ||
        b.id.toLowerCase().includes(qId) ||
        b.user.fullName.toLowerCase().includes(q) ||
        b.service.name.toLowerCase().includes(q) ||
        (qDigits.length > 0 && (b.user.phone ?? '').replace(/\D/g, '').includes(qDigits))
      );
    });
  }, [inDate, tab, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);
  // Keep the clicked booking selected; otherwise fall back to the page's first row.
  const selected = pageRows.find((b) => b.id === selectedId) ?? pageRows[0] ?? null;

  const changeTab = (t: StatusTab) => {
    setTab(t);
    setPage(1);
  };
  const changeDate = (d: DateFilter) => {
    setDateChoice(d);
    setPage(1);
  };
  const changeQuery = (q: string) => {
    setQuery(q);
    setPage(1);
  };
  const select = (id: string) => {
    setSelectedId(id);
    setActionError(null);
  };

  // ── Actions ─────────────────────────────────────────────────────────
  const setStatus = async (b: ProviderBooking, status: BookingStatus) => {
    setActionError(null);
    try {
      await updateStatus({ id: providerId, bookingId: b.id, status }).unwrap();
    } catch (err) {
      // e.g. the server rejects NO_SHOW before the start time.
      setActionError(errorMessage(err, 'Could not update this booking. Please try again.'));
    }
  };
  const openCancel = (b: ProviderBooking) => {
    setReason('');
    setCancelling(b);
  };
  const confirmCancel = async () => {
    if (!cancelling) return;
    setActionError(null);
    try {
      await updateStatus({
        id: providerId,
        bookingId: cancelling.id,
        status: 'CANCELLED',
        reason: reason.trim() || undefined,
      }).unwrap();
      setCancelling(null);
      setReason('');
    } catch (err) {
      setCancelling(null);
      setActionError(errorMessage(err, 'Could not cancel this booking. Please try again.'));
    }
  };
  const confirmCollect = async () => {
    if (!settling) return;
    setActionError(null);
    try {
      await collectPayment({ id: providerId, bookingId: settling.id }).unwrap();
      setSettling(null);
    } catch (err) {
      setSettling(null);
      setActionError(errorMessage(err, 'Could not record the payment. Please try again.'));
    }
  };

  const onRowKey = (e: KeyboardEvent<HTMLTableRowElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      select(id);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.root}>
        <div className={styles.tiles}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={84} radius="var(--m-radius-box)" />
          ))}
        </div>
        <Skeleton height={360} radius="var(--m-radius-card)" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className={styles.emptyCard}>
        <span className={styles.emptyIcon} aria-hidden="true">
          <CalendarX2 size={28} />
        </span>
        <h3 className={styles.emptyTitle}>No bookings yet</h3>
        <p className={styles.emptyText}>
          When customers book this business from the app, their appointments show up here.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.tiles}>
        <SummaryTile
          tone="lavender"
          icon={<Bell size={26} />}
          label="New Requests"
          value={tiles.pending}
          sub="Waiting to be accepted"
        />
        <SummaryTile tone="blue" icon={<CalendarClock size={26} />} label="Today's Appointments" value={tiles.today} />
        <SummaryTile tone="teal" icon={<Command size={26} />} label="In Progress" value={tiles.inProgress} />
        <SummaryTile tone="peach" icon={<Wallet size={26} />} label="Cash to Collect" value={money(tiles.cash, currency)} />
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="Filter by status">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${styles.tab} ${active ? styles.tabActive : ''}`}
                onClick={() => changeTab(t.key)}
              >
                {t.label}
                <span className={styles.tabCount}>{tabCounts[t.key]}</span>
              </button>
            );
          })}
        </div>
        <div className={styles.toolbarRight}>
          <label className={styles.filterWrap}>
            <span className={styles.srOnly}>Filter by date</span>
            <CalendarDays size={18} className={styles.filterIcon} aria-hidden="true" />
            <select
              className={styles.filter}
              value={dateFilter}
              onChange={(e) => changeDate(e.target.value as DateFilter)}
            >
              {DATE_FILTERS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className={styles.filterChevron} aria-hidden="true" />
          </label>
          <label className={styles.search}>
            <Search size={18} aria-hidden="true" />
            <span className={styles.srOnly}>Search bookings</span>
            <input
              type="search"
              placeholder="Search by booking ID, customer or service..."
              value={query}
              onChange={(e) => changeQuery(e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className={styles.columns}>
        <section className={styles.tableCard} aria-label="Bookings">
          {filtered.length === 0 ? (
            <div className={styles.noMatch}>
              No bookings match.
              {dateFilter !== 'ALL' && (
                <button type="button" className={styles.linkBtn} onClick={() => changeDate('ALL')}>
                  Show all dates
                </button>
              )}
            </div>
          ) : (
            <>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Booking</th>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Date &amp; Time</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th aria-label="Open" />
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((b) => {
                      const st = STATUS[b.status];
                      const pay = payBadge(b);
                      const isSel = selected?.id === b.id;
                      const mins = durationMin(b);
                      return (
                        <tr
                          key={b.id}
                          tabIndex={0}
                          aria-selected={isSel}
                          aria-label={`Booking ${shortId(b)}, ${b.user.fullName}, ${b.service.name}`}
                          className={`${styles.row} ${isSel ? styles.rowSelected : ''}`}
                          onClick={() => select(b.id)}
                          onKeyDown={(e) => onRowKey(e, b.id)}
                        >
                          <td>
                            <div className={styles.cellStack}>
                              <span className={styles.strong}>{shortId(b)}</span>
                              {b.createdAt && (
                                <span className={styles.mutedSm}>Booked {bookedAgo(b.createdAt)}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className={styles.cellStack}>
                              <span className={styles.strong}>{b.user.fullName}</span>
                              {b.user.phone && <span className={styles.mutedSm}>{b.user.phone}</span>}
                            </div>
                          </td>
                          <td>
                            <div className={styles.serviceCell}>
                              <ServiceIconBox name={b.service.name} />
                              <div className={styles.serviceText}>
                                <span className={styles.strong}>{b.service.name}</span>
                                {mins > 0 && <span className={styles.mutedSm}>{mins} min</span>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.cellStack}>
                              <span className={styles.strong}>{dayLabel(b.startTime)}</span>
                              <span className={styles.mutedSm}>{timeRange(b.startTime, b.endTime)}</span>
                            </div>
                          </td>
                          <td className={styles.amount}>{money(b.amountMinor, b.currency)}</td>
                          <td>
                            <Pill tone={pay.tone} className={styles.smallPill}>
                              {pay.label}
                            </Pill>
                          </td>
                          <td>
                            <div className={styles.statusCell}>
                              <Pill tone={st.tone} className={styles.smallPill}>
                                {b.status === 'IN_PROGRESS' && <span className={styles.liveDot} aria-hidden="true" />}
                                {st.label}
                              </Pill>
                              {b.status === 'IN_PROGRESS' && b.startedAt && (
                                <span className={styles.mutedSm}>started {clock(b.startedAt)}</span>
                              )}
                            </div>
                          </td>
                          <td className={styles.chevCell}>
                            <ChevronRight size={18} aria-hidden="true" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={styles.pager}>
                <span className={styles.pagerInfo}>
                  Showing {start + 1}–{start + pageRows.length} of {filtered.length}{' '}
                  {filtered.length === 1 ? 'booking' : 'bookings'}
                </span>
                {pageCount > 1 && (
                  <nav className={styles.pagerNav} aria-label="Pagination">
                    <button
                      type="button"
                      className={styles.pageBtn}
                      onClick={() => setPage(safePage - 1)}
                      disabled={safePage === 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} aria-hidden="true" />
                    </button>
                    {pageList(safePage, pageCount).map((p, i) =>
                      p === 'gap' ? (
                        <span key={`gap${i}`} className={styles.pageGap}>
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          type="button"
                          className={`${styles.pageBtn} ${p === safePage ? styles.pageActive : ''}`}
                          onClick={() => setPage(p)}
                          aria-current={p === safePage ? 'page' : undefined}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      className={styles.pageBtn}
                      onClick={() => setPage(safePage + 1)}
                      disabled={safePage === pageCount}
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </div>
            </>
          )}
        </section>

        {selected && (
          <BookingDetails
            booking={selected}
            busy={busy}
            error={actionError}
            onStatus={setStatus}
            onCollect={setSettling}
            onCancel={openCancel}
          />
        )}
      </div>

      {cancelling && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="bookingCancelTitle">
          <div className={styles.modal}>
            <h3 className={styles.modalTitle} id="bookingCancelTitle">
              {cancelling.status === 'PENDING' ? 'Decline this booking?' : 'Cancel this booking?'}
            </h3>
            <p className={styles.modalSub}>
              {shortId(cancelling)} · {cancelling.user.fullName} · {cancelling.service.name}
            </p>
            <label className={styles.modalLabel} htmlFor="bookingCancelReason">
              Reason for the customer <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="bookingCancelReason"
              className={styles.textarea}
              placeholder="e.g. Sorry, we're fully booked at that time."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
            />
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setCancelling(null)} disabled={busy}>
                Keep booking
              </Button>
              <Button onClick={confirmCancel} loading={updating} loadingText="Cancelling…">
                {cancelling.status === 'PENDING' ? 'Decline booking' : 'Cancel booking'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {settling && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="bookingCollectTitle">
          <div className={styles.modal}>
            <h3 className={styles.modalTitle} id="bookingCollectTitle">
              Collect {money(outstandingOf(settling), settling.currency)} in cash?
            </h3>
            <p className={styles.modalSub}>
              {shortId(settling)} · {settling.user.fullName} · {settling.service.name}
              {settling.paymentMethod === 'PARTIAL' && ' · balance after the online deposit'}
            </p>
            <p className={styles.modalSub}>
              This marks the booking fully paid. Only confirm once you’ve received the cash.
            </p>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setSettling(null)} disabled={collecting}>
                Not yet
              </Button>
              <Button onClick={confirmCollect} loading={collecting} loadingText="Saving…">
                Mark paid
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
