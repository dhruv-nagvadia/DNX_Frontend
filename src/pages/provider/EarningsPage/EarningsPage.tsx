import { ReactNode, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Info,
  Percent,
  ReceiptText,
  RefreshCw,
  Search,
  Wallet,
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { NotificationBell } from '@/components/NotificationBell';
import { Pill, PillTone } from '@/components/Pill';
import { Skeleton } from '@/components/Skeleton';
import { Earnings, EarningsSettlement, EarningsTransaction } from '@/redux/api/provider/types';
import { bpsToPercentText, formatMoney } from '@/utils/money';

import { EARNINGS_PRESETS, EarningsPreset } from './earningsRange';
import { EarningsTrendChart, Granularity } from './EarningsTrendChart';
import { HeaderDropdown } from './HeaderDropdown';
import { PaymentDonut } from './PaymentDonut';
import { useEarningsPage } from './useEarningsPage';
import styles from './EarningsPage.module.css';

const PAGE_SIZE = 5;
const PAYOUT_PREVIEW = 2;

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const shortDateYear = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/** "Oct 28", or "Oct 28, 2025" when it isn't this year. */
function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.getFullYear() === new Date().getFullYear()
    ? shortDate.format(d)
    : shortDateYear.format(d);
}

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'DN'
  );
}

const TAG_TONES: PillTone[] = ['lavender', 'blue', 'green', 'orange', 'teal'];
/** Deterministic colour per business, so rows stay scannable. */
function businessTone(id: string): PillTone {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return TAG_TONES[hash % TAG_TONES.length];
}

function PaymentPill({ t }: { t: EarningsTransaction }) {
  if (t.onlineMinor > 0 && t.cashMinor > 0) {
    return (
      <Pill tone="blue" className={styles.payPill}>
        <CreditCard size={14} aria-hidden="true" />
        Partial
      </Pill>
    );
  }
  if (t.onlineMinor > 0) {
    return (
      <Pill tone="green" className={styles.payPill}>
        <CreditCard size={14} aria-hidden="true" />
        Online
      </Pill>
    );
  }
  return (
    <Pill tone="grey" className={styles.payPill}>
      <Banknote size={14} aria-hidden="true" />
      Cash
    </Pill>
  );
}

function signedMoney(minor: number): string {
  return `${minor < 0 ? '−' : '+'}${formatMoney(Math.abs(minor))}`;
}

/* ── Hero: payout balance + 4 tiles ────────────────────────────────────── */

function BalanceCard({ data }: { data: Earnings }) {
  const b = data.balance;
  const owesYou = b.balanceMinor >= 0;
  return (
    <section className={styles.balanceCard} aria-label="Payout balance">
      <div className={styles.balanceMain}>
        <h2 className={styles.balanceTitle}>Payout balance</h2>
        <span className={`${styles.balanceChip} ${owesYou ? '' : styles.balanceChipOwe}`}>
          {b.balanceMinor === 0 ? 'All settled' : owesYou ? 'DNX owes you' : 'You owe DNX'}
        </span>
        <span className={styles.balanceValue}>{formatMoney(Math.abs(b.balanceMinor))}</span>
        <span className={styles.balancePill}>
          <CheckCircle2 size={16} aria-hidden="true" />
          {owesYou ? 'Next payout: manual by DNX' : 'Settled manually with DNX'}
        </span>
      </div>
      <dl className={styles.balanceBreak}>
        <div className={styles.breakRow}>
          <dt>Collected online for you</dt>
          <dd>{formatMoney(b.earnedOnlineMinor)}</dd>
        </div>
        <div className={styles.breakRow}>
          <dt>− DNX commission ({bpsToPercentText(data.defaultCommissionBps)}%)</dt>
          <dd>{formatMoney(b.earnedCommissionMinor)}</dd>
        </div>
        <div className={styles.breakRow}>
          <dt>− Already paid out to you</dt>
          <dd>{formatMoney(b.paidOutMinor)}</dd>
        </div>
        <div className={styles.breakRow}>
          <dt>+ You paid DNX</dt>
          <dd>{formatMoney(b.receivedMinor)}</dd>
        </div>
        <div className={`${styles.breakRow} ${styles.breakTotal}`}>
          <dt>= Balance</dt>
          <dd>
            {b.balanceMinor < 0 ? '−' : ''}
            {formatMoney(Math.abs(b.balanceMinor))}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function Tile({
  tone,
  icon,
  label,
  value,
  note,
}: {
  tone: 'blue' | 'peach' | 'mint' | 'lavender';
  icon: ReactNode;
  label: string;
  value: string;
  note: ReactNode;
}) {
  const toneClass = {
    blue: styles.tileBlue,
    peach: styles.tilePeach,
    mint: styles.tileMint,
    lavender: styles.tileLavender,
  }[tone];
  return (
    <div className={`${styles.tile} ${toneClass}`}>
      <span className={styles.tileIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.tileText}>
        <span className={styles.tileLabel}>{label}</span>
        <span className={styles.tileValue}>{value}</span>
        <span className={styles.tileNote}>{note}</span>
      </span>
    </div>
  );
}

function ChangeNote({ cur, prev, label }: { cur: number; prev: number | null; label: string }) {
  if (prev === null || prev <= 0) return null;
  const pct = Math.round(((cur - prev) / prev) * 100);
  const down = pct < 0;
  return (
    <span className={down ? styles.changeDown : styles.changeUp}>
      {down ? (
        <ArrowDown size={14} strokeWidth={2.4} aria-hidden="true" />
      ) : (
        <ArrowUp size={14} strokeWidth={2.4} aria-hidden="true" />
      )}
      {Math.abs(pct)}% <span className={styles.changeLabel}>{label}</span>
    </span>
  );
}

/* ── Payouts ───────────────────────────────────────────────────────────── */

function PayoutRow({ p }: { p: EarningsSettlement }) {
  const [open, setOpen] = useState(false);
  const toYou = p.direction === 'TO_PROVIDER';
  const meta = [
    formatMoney(p.amountMinor),
    p.method,
    p.reference ? `Ref ${p.reference}` : null,
    fmtDate(p.paidAt),
  ].filter(Boolean);
  return (
    <li className={styles.payoutItem}>
      <button
        type="button"
        className={styles.payoutRow}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className={`${styles.payoutIcon} ${toYou ? styles.payoutIconIn : styles.payoutIconOut}`}
          aria-hidden="true"
        >
          {toYou ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
        </span>
        <span className={styles.payoutText}>
          <span className={styles.payoutTitle}>{toYou ? 'DNX paid you' : 'You paid DNX'}</span>
          <span className={styles.payoutMeta}>{meta.join(' • ')}</span>
        </span>
        <ChevronRight
          size={20}
          aria-hidden="true"
          className={`${styles.payoutChevron} ${open ? styles.payoutChevronOpen : ''}`}
        />
      </button>
      {open && (
        <p className={styles.payoutNote}>{p.note || 'No note was added to this settlement.'}</p>
      )}
    </li>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

type KindFilter = 'ALL' | 'BOOKING' | 'ORDER';

/** What the provider takes home after the platform's commission, and what's owed either way. */
export default function EarningsPage() {
  const e = useEarningsPage();
  const data = e.data;

  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [showAllPayouts, setShowAllPayouts] = useState(false);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('ALL');
  const [page, setPage] = useState(1);

  const photoById = useMemo(
    () => new Map(e.businesses.map((b) => [b.id, b.images?.[0] ?? null])),
    [e.businesses],
  );

  const sales = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.transactions ?? []).filter(
      (t) =>
        (kind === 'ALL' || t.kind === kind) &&
        (!q || t.title.toLowerCase().includes(q) || t.businessName.toLowerCase().includes(q)),
    );
  }, [data, query, kind]);

  const pageCount = Math.max(1, Math.ceil(sales.length / PAGE_SIZE));
  const curPage = Math.min(page, pageCount);
  const pageRows = sales.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
  // A window of up to 5 page buttons around the current page.
  const firstBtn = Math.max(1, Math.min(curPage - 2, pageCount - 4));
  const pageBtns = Array.from({ length: Math.min(5, pageCount) }, (_, i) => firstBtn + i);

  const presetLabel = EARNINGS_PRESETS.find((p) => p.id === e.preset)?.label ?? 'This month';
  const bizLabel =
    e.businesses.find((b) => b.id === e.businessId)?.businessName ?? 'All businesses';

  const header = (
    <div className={styles.topControls}>
      <HeaderDropdown
        icon={<CalendarDays size={18} aria-hidden="true" />}
        label={presetLabel}
        ariaLabel="Period"
        value={e.preset}
        options={EARNINGS_PRESETS.map((p) => ({ value: p.id, label: p.label }))}
        onChange={(v) => {
          e.onPreset(v as EarningsPreset);
          setPage(1);
        }}
      />
      <HeaderDropdown
        label={bizLabel}
        ariaLabel="Business"
        value={e.businessId}
        options={[
          { value: '', label: 'All businesses' },
          ...e.businesses.map((b) => ({ value: b.id, label: b.businessName })),
        ]}
        onChange={(v) => {
          e.onBusiness(v);
          setPage(1);
        }}
      />
      <div className={styles.bellWrap}>
        <NotificationBell />
      </div>
      <Link className={styles.profileChip} to="/profile">
        {e.avatarUrl ? (
          <img className={styles.profileAvatarImg} src={e.avatarUrl} alt="" aria-hidden="true" />
        ) : (
          <span className={styles.profileAvatar} aria-hidden="true">
            {initialsOf(e.fullName || 'DNX')}
          </span>
        )}
        <span className={styles.profileName}>{e.fullName || 'Your account'}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </Link>
    </div>
  );

  const titleBlock = (
    <div className={styles.titleBlock}>
      <h1 className={styles.title}>Earnings</h1>
      <p className={styles.subtitle}>
        What you take home after DNX&rsquo;s commission, and what&rsquo;s owed between you and DNX.
      </p>
    </div>
  );

  if (e.isError && !data) {
    return (
      <AppShell header={header}>
        <div className={styles.page}>
          {titleBlock}
          <div className={styles.errorCard} role="alert">
            <AlertCircle size={28} aria-hidden="true" />
            <p className={styles.errorTitle}>We couldn&rsquo;t load your earnings.</p>
            <p className={styles.errorText}>Check your connection and try again.</p>
            <button type="button" className={styles.retryBtn} onClick={() => e.refetch()}>
              <RefreshCw size={16} aria-hidden="true" />
              Retry
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (e.isLoading || !data) {
    return (
      <AppShell header={header}>
        <div className={styles.page}>
          {titleBlock}
          <div className={styles.heroRow}>
            <Skeleton height={190} radius="var(--m-radius-card)" />
            <div className={styles.tiles}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} height={88} radius="var(--m-radius-card)" />
              ))}
            </div>
          </div>
          <div className={styles.rowTrend}>
            <Skeleton height={320} radius="var(--m-radius-card)" />
            <Skeleton height={320} radius="var(--m-radius-card)" />
          </div>
          <div className={styles.rowBiz}>
            <Skeleton height={260} radius="var(--m-radius-card)" />
            <Skeleton height={260} radius="var(--m-radius-card)" />
          </div>
          <Skeleton height={360} radius="var(--m-radius-card)" />
        </div>
      </AppShell>
    );
  }

  const s = data.summary;
  const commissionShare =
    s.grossMinor > 0 ? Math.round((s.commissionMinor / s.grossMinor) * 1000) / 10 : null;
  const bizRows = e.businessId
    ? data.businesses.filter((b) => b.id === e.businessId)
    : data.businesses;
  const payouts = showAllPayouts ? data.payouts : data.payouts.slice(0, PAYOUT_PREVIEW);

  return (
    <AppShell header={header}>
      <div className={`${styles.page} ${e.isFetching ? styles.refreshing : ''}`}>
        {titleBlock}

        {/* ── Hero ── */}
        <div className={styles.heroRow}>
          <BalanceCard data={data} />
          <div className={styles.tiles}>
            <Tile
              tone="blue"
              icon={<ReceiptText size={26} strokeWidth={1.8} />}
              label="Sales"
              value={formatMoney(s.grossMinor)}
              note={`${s.count} ${s.count === 1 ? 'sale' : 'sales'}`}
            />
            <Tile
              tone="peach"
              icon={<Percent size={26} strokeWidth={2} />}
              label="DNX commission"
              value={formatMoney(s.commissionMinor)}
              note={
                commissionShare === null
                  ? `${bpsToPercentText(data.defaultCommissionBps)}% rate`
                  : `${commissionShare}% of sales`
              }
            />
            <Tile
              tone="mint"
              icon={<Wallet size={26} strokeWidth={1.8} />}
              label="You earn"
              value={formatMoney(s.netMinor)}
              note={<ChangeNote cur={s.netMinor} prev={e.prevNetMinor} label={e.compareLabel} />}
            />
            <Tile
              tone="lavender"
              icon={<Clock size={26} strokeWidth={1.8} />}
              label="Coming up"
              value={formatMoney(data.upcoming.netMinor)}
              note={`${data.upcoming.count} open ${data.upcoming.count === 1 ? 'booking or order' : 'bookings & orders'}`}
            />
          </div>
        </div>

        {/* ── Trend + payment split ── */}
        <div className={styles.rowTrend}>
          <section className={styles.card}>
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Earnings trend</h2>
              <div className={styles.segmented} role="tablist" aria-label="Group by">
                {(['daily', 'weekly', 'monthly'] as Granularity[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    role="tab"
                    aria-selected={granularity === g}
                    className={`${styles.segment} ${granularity === g ? styles.segmentActive : ''}`}
                    onClick={() => setGranularity(g)}
                  >
                    {g[0].toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
            </header>
            <EarningsTrendChart
              transactions={data.transactions}
              range={e.range}
              granularity={granularity}
            />
          </section>

          <section className={styles.card}>
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle}>How you were paid</h2>
            </header>
            <PaymentDonut onlineMinor={s.onlineMinor} cashMinor={s.cashMinor} />
            <p className={styles.infoBox}>
              <Info size={18} aria-hidden="true" />
              <span>
                Online money is held by DNX and paid out to you; cash you keep — DNX&rsquo;s
                commission on it is taken from your balance.
              </span>
            </p>
          </section>
        </div>

        {/* ── By business + payouts ── */}
        <div className={styles.rowBiz}>
          <section className={styles.card}>
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle}>By business</h2>
            </header>
            {bizRows.length === 0 ? (
              <p className={styles.empty}>No businesses yet.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th className={styles.num}>Sales</th>
                      <th className={styles.num}>Commission</th>
                      <th className={styles.num}>You earn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bizRows.map((b) => {
                      const photo = photoById.get(b.id);
                      return (
                        <tr key={b.id}>
                          <td>
                            <span className={styles.bizCell}>
                              {photo ? (
                                <img className={styles.bizThumb} src={photo} alt="" />
                              ) : (
                                <span className={styles.bizThumb} aria-hidden="true">
                                  {initialsOf(b.name)}
                                </span>
                              )}
                              <span className={styles.bizText}>
                                <span className={styles.bizName}>{b.name}</span>
                                {b.isCustomRate ? (
                                  <Pill tone="lavender" className={styles.ratePill}>
                                    Custom {bpsToPercentText(b.commissionBps)}%
                                  </Pill>
                                ) : (
                                  <Pill tone="grey" className={styles.ratePill}>
                                    {bpsToPercentText(b.commissionBps)}% rate
                                  </Pill>
                                )}
                              </span>
                            </span>
                          </td>
                          <td className={styles.num}>{formatMoney(b.grossMinor)}</td>
                          <td className={styles.num}>{formatMoney(b.commissionMinor)}</td>
                          <td className={`${styles.num} ${styles.earn}`}>
                            {formatMoney(b.netMinor)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className={styles.totalRow}>
                      <td>Total</td>
                      <td className={styles.num}>{formatMoney(s.grossMinor)}</td>
                      <td className={styles.num}>{formatMoney(s.commissionMinor)}</td>
                      <td className={`${styles.num} ${styles.earn}`}>{formatMoney(s.netMinor)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className={styles.card}>
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Payouts &amp; settlements</h2>
            </header>
            {data.payouts.length === 0 ? (
              <p className={styles.empty}>No payouts yet — DNX settles your balance manually.</p>
            ) : (
              <ul className={styles.payoutList}>
                {payouts.map((p) => (
                  <PayoutRow key={p.id} p={p} />
                ))}
                {data.payouts.length > PAYOUT_PREVIEW && (
                  <li className={styles.payoutItem}>
                    <button
                      type="button"
                      className={styles.payoutRow}
                      aria-expanded={showAllPayouts}
                      onClick={() => setShowAllPayouts((v) => !v)}
                    >
                      <span
                        className={`${styles.payoutIcon} ${styles.payoutIconDoc}`}
                        aria-hidden="true"
                      >
                        <FileText size={20} />
                      </span>
                      <span className={styles.payoutText}>
                        <span className={styles.payoutTitle}>
                          {showAllPayouts ? 'Show less' : `View all (${data.payouts.length})`}
                        </span>
                      </span>
                      <ChevronRight
                        size={20}
                        aria-hidden="true"
                        className={`${styles.payoutChevron} ${showAllPayouts ? styles.payoutChevronOpen : ''}`}
                      />
                    </button>
                  </li>
                )}
              </ul>
            )}
          </section>
        </div>

        {/* ── Completed sales ── */}
        <section className={styles.card}>
          <header className={`${styles.cardHead} ${styles.salesHead}`}>
            <h2 className={styles.cardTitle}>Completed sales</h2>
            <div className={styles.salesTools}>
              <label className={styles.search}>
                <Search size={18} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search sales..."
                  aria-label="Search sales"
                  value={query}
                  onChange={(ev) => {
                    setQuery(ev.target.value);
                    setPage(1);
                  }}
                />
              </label>
              {(
                [
                  ['ALL', 'All'],
                  ['BOOKING', 'Bookings'],
                  ['ORDER', 'Orders'],
                ] as [KindFilter, string][]
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={kind === k}
                  className={`${styles.chip} ${kind === k ? styles.chipActive : ''}`}
                  onClick={() => {
                    setKind(k);
                    setPage(1);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </header>

          {sales.length === 0 ? (
            <p className={styles.empty}>
              {data.transactions.length === 0
                ? 'No completed sales in this period. Sales appear here once a booking or order is completed.'
                : 'No sales match your search.'}
            </p>
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={`${styles.table} ${styles.salesTable}`}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Sale</th>
                      <th>Business</th>
                      <th>Payment</th>
                      <th className={styles.num}>Sale amount</th>
                      <th className={styles.num}>Commission</th>
                      <th className={styles.num}>You earn</th>
                      <th className={styles.num}>From DNX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((t) => {
                      const tone = businessTone(t.businessId);
                      return (
                        <tr key={`${t.kind}-${t.id}`}>
                          <td>{fmtDate(t.settledAt)}</td>
                          <td className={styles.saleCell} title={t.title}>
                            {t.title}{' '}
                            <span className={styles.muted}>
                              ({t.kind === 'BOOKING' ? 'booking' : 'order'})
                            </span>
                          </td>
                          <td>
                            <span className={styles.bizTag}>
                              <span
                                className={styles.bizTagDot}
                                style={{ background: `var(--m-pill-${tone}-fg)` }}
                                aria-hidden="true"
                              />
                              {t.businessName}
                            </span>
                          </td>
                          <td>
                            <PaymentPill t={t} />
                          </td>
                          <td className={styles.num}>{formatMoney(t.grossMinor)}</td>
                          <td className={styles.num}>−{formatMoney(t.commissionMinor)}</td>
                          <td className={styles.num}>{formatMoney(t.earningMinor)}</td>
                          <td
                            className={`${styles.num} ${styles.strongNum} ${t.payableMinor < 0 ? styles.neg : styles.pos}`}
                          >
                            {signedMoney(t.payableMinor)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <footer className={styles.pager}>
                <span className={styles.muted}>
                  Showing {(curPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(curPage * PAGE_SIZE, sales.length)} of {sales.length}{' '}
                  {sales.length === 1 ? 'sale' : 'sales'}
                </span>
                {pageCount > 1 && (
                  <nav className={styles.pageBtns} aria-label="Pages">
                    <button
                      type="button"
                      className={styles.pageBtn}
                      disabled={curPage === 1}
                      onClick={() => setPage(curPage - 1)}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} aria-hidden="true" />
                    </button>
                    {pageBtns.map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`${styles.pageBtn} ${n === curPage ? styles.pageBtnActive : ''}`}
                        aria-current={n === curPage ? 'page' : undefined}
                        onClick={() => setPage(n)}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={styles.pageBtn}
                      disabled={curPage === pageCount}
                      onClick={() => setPage(curPage + 1)}
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </footer>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
