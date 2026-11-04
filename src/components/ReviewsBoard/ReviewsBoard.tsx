import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  MessageSquareDashed,
  Reply,
  Search,
  SearchX,
  Star,
  Store,
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { NotificationBell } from '@/components/NotificationBell';
import { Skeleton } from '@/components/Skeleton';
import {
  useGetAllProductReviewsQuery,
  useGetAllReviewsQuery,
  useGetMyBusinessesQuery,
} from '@/redux/api/provider/providerApi';
import { useAppSelector } from '@/redux/hooks';

import { Dropdown } from './Dropdown';
import { ReviewCard } from './ReviewCard';
import {
  BoardReview,
  SORT_OPTIONS,
  SortKey,
  fromBusinessReview,
  fromProductReview,
  initialsOf,
  monthCounts,
  sortReviews,
} from './reviewsUtil';
import { Stars } from './Stars';
import styles from './ReviewsBoard.module.css';

const PAGE_SIZE = 8;

type StatusTab = 'all' | 'needs' | 'replied';
type KindTab = 'business' | 'products';

interface ReviewsBoardProps {
  /**
   * When set (the per-business route), the board opens scoped to this
   * business, the per-business strip is hidden and the top-bar picker
   * calls `onBusinessChange` instead of filtering locally.
   */
  lockedBusinessId?: string;
  onBusinessChange?: (businessId: string) => void;
}

/**
 * Provider "Reviews" dashboard (mockup "DNX Marketplace Reviews Dashboard.png"):
 * rating summary + KPI tiles, a per-business strip, filters, a 2-column list of
 * business & product reviews with inline replies, and pagination.
 */
export function ReviewsBoard({ lockedBusinessId, onBusinessChange }: ReviewsBoardProps) {
  const user = useAppSelector((s) => s.user.currentUser);
  const bizQ = useGetAllReviewsQuery();
  const prodQ = useGetAllProductReviewsQuery();
  const businessesQ = useGetMyBusinessesQuery();

  const [businessId, setBusinessId] = useState(lockedBusinessId ?? '');
  const [status, setStatus] = useState<StatusTab>('all');
  const [star, setStar] = useState<number | null>(null);
  const [kind, setKind] = useState<KindTab>('business');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);

  /** Every filter change goes back to page 1. */
  const withReset =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPage(1);
    };

  const businesses = useMemo(() => businessesQ.data ?? [], [businessesQ.data]);

  const all = useMemo<BoardReview[]>(
    () => [
      ...(bizQ.data ?? []).map(fromBusinessReview),
      ...(prodQ.data ?? []).map(fromProductReview),
    ],
    [bizQ.data, prodQ.data],
  );

  // ── Business scope (top-bar picker / strip / route) ──
  const scoped = useMemo(
    () => (businessId ? all.filter((r) => r.businessId === businessId) : all),
    [all, businessId],
  );

  // Headline rating: business reviews only, matching the public rating.
  const summary = useMemo(() => {
    const biz = scoped.filter((r) => r.kind === 'business');
    const count = biz.length;
    const avg = count ? biz.reduce((s, r) => s + r.rating, 0) / count : 0;
    const dist = [5, 4, 3, 2, 1].map((s) => {
      const n = biz.filter((r) => r.rating === s).length;
      return { star: s, n, pct: count ? Math.round((n / count) * 100) : 0 };
    });
    return { count, avg, dist };
  }, [scoped]);

  // Tiles: business + product reviews in scope.
  const tiles = useMemo(() => {
    const replied = scoped.filter((r) => !!r.reply).length;
    return {
      total: scoped.length,
      replied,
      needs: scoped.length - replied,
      ...monthCounts(scoped),
    };
  }, [scoped]);

  const strip = useMemo(
    () =>
      businesses.map((b) => {
        const mine = all.filter((r) => r.businessId === b.id);
        const replied = mine.filter((r) => !!r.reply).length;
        return {
          biz: b,
          total: mine.length,
          repliedPct: mine.length ? Math.round((replied / mine.length) * 100) : 0,
        };
      }),
    [businesses, all],
  );

  // ── Business / Products toggle ──
  const scopeBusinesses = businessId ? businesses.filter((b) => b.id === businessId) : businesses;
  const hasProductReviews = scoped.some((r) => r.kind === 'product');
  const showKindToggle = hasProductReviews || scopeBusinesses.some((b) => b.type === 'STORE');
  const effectiveKind: KindTab = showKindToggle ? kind : 'business';

  // ── List filters ──
  const preStatus = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((r) => {
      if ((effectiveKind === 'products') !== (r.kind === 'product')) return false;
      if (star !== null && r.rating !== star) return false;
      if (
        q &&
        !r.customer.toLowerCase().includes(q) &&
        !r.comment.toLowerCase().includes(q) &&
        !(r.product?.name.toLowerCase().includes(q) ?? false)
      )
        return false;
      return true;
    });
  }, [scoped, effectiveKind, star, search]);

  const tabCounts = useMemo(() => {
    const replied = preStatus.filter((r) => !!r.reply).length;
    return { all: preStatus.length, replied, needs: preStatus.length - replied };
  }, [preStatus]);

  const filtered = useMemo(() => {
    const byStatus = preStatus.filter((r) =>
      status === 'all' ? true : status === 'replied' ? !!r.reply : !r.reply,
    );
    return sortReviews(byStatus, sort);
  }, [preStatus, status, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
  const firstBtn = Math.max(1, Math.min(curPage - 2, pageCount - 4));
  const pageBtns = Array.from({ length: Math.min(5, pageCount) }, (_, i) => firstBtn + i);

  const anyFilter = status !== 'all' || star !== null || search.trim() !== '';
  const clearFilters = () => {
    setStatus('all');
    setStar(null);
    setSearch('');
    setPage(1);
  };

  const onPickBusiness = (id: string) => {
    if (lockedBusinessId && onBusinessChange) {
      onBusinessChange(id);
      return;
    }
    setBusinessId(id);
    setPage(1);
  };

  const isLoading = bizQ.isLoading || prodQ.isLoading || businessesQ.isLoading;
  const isError = (bizQ.isError && !bizQ.data) || (prodQ.isError && !prodQ.data);

  const bizLabel = businesses.find((b) => b.id === businessId)?.businessName ?? 'All businesses';
  const fullName = user?.fullName ?? '';

  const header = (
    <div className={styles.topBar}>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>Reviews</h1>
        <p className={styles.subtitle}>
          What customers say about your businesses — reply to build trust.
        </p>
      </div>
      <div className={styles.topControls}>
        <Dropdown
          label={bizLabel}
          ariaLabel="Business"
          value={businessId}
          options={[
            { value: '', label: 'All businesses' },
            ...businesses.map((b) => ({ value: b.id, label: b.businessName })),
          ]}
          onChange={onPickBusiness}
        />
        <div className={styles.bellWrap}>
          <NotificationBell />
        </div>
        <Link className={styles.profileChip} to="/profile">
          {user?.avatarUrl ? (
            <img className={styles.profileAvatarImg} src={user.avatarUrl} alt="" aria-hidden="true" />
          ) : (
            <span className={styles.profileAvatar} aria-hidden="true">
              {initialsOf(fullName || 'DNX')}
            </span>
          )}
          <span className={styles.profileName}>{fullName || 'Your account'}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <AppShell header={header}>
        <div className={styles.page} aria-busy="true">
          <div className={styles.hero}>
            <Skeleton height={190} radius="var(--m-radius-card)" />
            <div className={styles.heroRight}>
              <div className={styles.tiles}>
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} height={84} radius="var(--m-radius-card)" />
                ))}
              </div>
              {!lockedBusinessId && <Skeleton height={90} radius="var(--m-radius-card)" />}
            </div>
          </div>
          <Skeleton height={56} radius="var(--m-radius-card)" />
          <div className={styles.grid}>
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} height={170} radius="var(--m-radius-card)" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell header={header}>
        <div className={styles.page}>
          <div className={styles.errorCard} role="alert">
            <AlertCircle size={20} aria-hidden="true" />
            <span>We couldn&rsquo;t load your reviews.</span>
            <button
              type="button"
              className={styles.outlineBtn}
              onClick={() => {
                void bizQ.refetch();
                void prodQ.refetch();
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const monthDiff = tiles.thisMonth - tiles.lastMonth;
  const showMonthTrend = tiles.thisMonth > 0 || tiles.lastMonth > 0;

  return (
    <AppShell header={header}>
      <div className={styles.page}>
        {/* ── Hero: rating summary + tiles (+ per-business strip) ── */}
        <div className={`${styles.hero} ${lockedBusinessId ? styles.heroLocked : ''}`}>
          <section className={styles.summaryCard} aria-label="Rating summary">
            <div className={styles.summaryTop}>
              <span className={styles.avgNum}>{summary.count ? summary.avg.toFixed(1) : '—'}</span>
              <div className={styles.avgMeta}>
                <Stars rating={summary.avg} size={26} />
                <span className={styles.basedOn}>
                  Based on {summary.count.toLocaleString()} review{summary.count === 1 ? '' : 's'}
                </span>
              </div>
            </div>
            <div className={styles.dist}>
              {summary.dist.map((d) => (
                <div key={d.star} className={styles.distRow}>
                  <span className={styles.distStar}>
                    {d.star}
                    <Star size={14} className={styles.starFull} aria-hidden="true" />
                  </span>
                  <span className={styles.distTrack}>
                    {d.pct > 0 && <span className={styles.distFill} style={{ width: `${d.pct}%` }} />}
                  </span>
                  <span className={styles.distN}>
                    {d.n.toLocaleString()} ({d.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className={styles.heroRight}>
            <div className={styles.tiles}>
              <div className={`${styles.tile} ${styles.tileBlue}`}>
                <span className={styles.tileIcon}>
                  <MessageSquare size={30} aria-hidden="true" />
                </span>
                <div className={styles.tileText}>
                  <span className={styles.tileLabel}>Total reviews</span>
                  <span className={styles.tileValue}>{tiles.total.toLocaleString()}</span>
                </div>
              </div>
              <div className={`${styles.tile} ${styles.tilePeach}`}>
                <span className={styles.tileIcon}>
                  <Reply size={30} aria-hidden="true" />
                </span>
                <div className={styles.tileText}>
                  <span className={styles.tileLabel}>Needs reply</span>
                  <span className={styles.tileValue}>{tiles.needs.toLocaleString()}</span>
                </div>
              </div>
              <div className={`${styles.tile} ${styles.tileMint}`}>
                <span className={styles.tileIcon}>
                  <CheckCircle2 size={30} aria-hidden="true" />
                </span>
                <div className={styles.tileText}>
                  <span className={styles.tileLabel}>Replied</span>
                  <span className={styles.tileValue}>{tiles.replied.toLocaleString()}</span>
                </div>
              </div>
              <div className={`${styles.tile} ${styles.tileLavender}`}>
                <span className={styles.tileIcon}>
                  <CalendarDays size={30} aria-hidden="true" />
                </span>
                <div className={styles.tileText}>
                  <span className={styles.tileLabel}>This month</span>
                  <span className={styles.tileValue}>{tiles.thisMonth.toLocaleString()}</span>
                  {showMonthTrend && (
                    <span
                      className={`${styles.tileTrend} ${
                        monthDiff > 0 ? styles.trendUp : monthDiff < 0 ? styles.trendDown : ''
                      }`}
                    >
                      {monthDiff > 0 && <ArrowUp size={13} aria-hidden="true" />}
                      {monthDiff < 0 && <ArrowDown size={13} aria-hidden="true" />}
                      {monthDiff === 0 ? 'Same as last month' : `${Math.abs(monthDiff)}`}
                      {monthDiff !== 0 && <span className={styles.trendMuted}>vs last month</span>}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!lockedBusinessId && strip.length > 0 && (
              <div className={styles.strip}>
                {strip.map(({ biz, total, repliedPct }) => {
                  const active = biz.id === businessId;
                  return (
                    <button
                      key={biz.id}
                      type="button"
                      className={`${styles.bizCard} ${active ? styles.bizCardActive : ''}`}
                      aria-pressed={active}
                      title={active ? 'Show all businesses' : `Show ${biz.businessName} only`}
                      onClick={() => onPickBusiness(active ? '' : biz.id)}
                    >
                      {biz.images?.[0] ? (
                        <img className={styles.bizImg} src={biz.images[0]} alt="" loading="lazy" />
                      ) : (
                        <span className={styles.bizImgEmpty} aria-hidden="true">
                          <Store size={24} />
                        </span>
                      )}
                      <span className={styles.bizInfo}>
                        <span className={styles.bizName}>{biz.businessName}</span>
                        <span className={styles.bizRating}>
                          <Star size={15} className={styles.starFull} aria-hidden="true" />
                          {biz.ratingCount ? biz.ratingAvg.toFixed(1) : '—'}
                          <span className={styles.bizRatingCount}>
                            ({biz.ratingCount.toLocaleString()})
                          </span>
                        </span>
                        <span className={styles.bizReplyRow}>
                          <span className={styles.bizTrack}>
                            <span className={styles.bizFill} style={{ width: `${repliedPct}%` }} />
                          </span>
                          <span className={styles.bizPct}>
                            {total ? `${repliedPct}% replied` : 'No reviews'}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className={styles.filterBar}>
          <div className={styles.tabs} role="tablist" aria-label="Reply status">
            {(
              [
                ['all', 'All', tabCounts.all],
                ['needs', 'Needs reply', tabCounts.needs],
                ['replied', 'Replied', tabCounts.replied],
              ] as const
            ).map(([value, label, n]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={status === value}
                className={`${styles.tab} ${status === value ? styles.tabActive : ''}`}
                onClick={() => withReset(setStatus)(value)}
              >
                {label}
                <span className={styles.tabCount}>{n.toLocaleString()}</span>
              </button>
            ))}
          </div>

          <span className={styles.vDivider} aria-hidden="true" />

          <div className={styles.starChips} role="group" aria-label="Filter by rating">
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={star === s}
                aria-label={`${s} star reviews`}
                className={`${styles.starChip} ${star === s ? styles.starChipActive : ''}`}
                onClick={() => withReset(setStar)(star === s ? null : s)}
              >
                {s}
                <Star size={14} className={styles.starFull} aria-hidden="true" />
              </button>
            ))}
          </div>

          {showKindToggle && (
            <>
              <span className={styles.vDivider} aria-hidden="true" />
              <div className={styles.segment} role="group" aria-label="Review type">
                {(
                  [
                    ['business', 'Business'],
                    ['products', 'Products'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={effectiveKind === value}
                    className={`${styles.segBtn} ${effectiveKind === value ? styles.segBtnActive : ''}`}
                    onClick={() => withReset(setKind)(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}

          <label className={styles.searchBox}>
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by customer or comment..."
              value={search}
              aria-label="Search reviews"
              onChange={(e) => withReset(setSearch)(e.target.value)}
            />
          </label>

          <Dropdown
            compact
            label={SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Newest'}
            ariaLabel="Sort"
            value={sort}
            options={SORT_OPTIONS}
            onChange={(v) => withReset(setSort)(v as SortKey)}
          />
        </div>

        {/* ── List ── */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            {scoped.length === 0 || (!anyFilter && preStatus.length === 0) ? (
              <>
                <MessageSquareDashed size={36} aria-hidden="true" />
                <h2 className={styles.emptyTitle}>No reviews yet</h2>
                <p className={styles.emptyText}>
                  {effectiveKind === 'products' && scoped.length > 0
                    ? 'No product reviews yet. They appear here when customers rate items from your stores.'
                    : 'When customers review your businesses, they’ll show up here so you can reply.'}
                </p>
              </>
            ) : (
              <>
                <SearchX size={36} aria-hidden="true" />
                <h2 className={styles.emptyTitle}>No reviews match</h2>
                <p className={styles.emptyText}>Try a different rating, status or search.</p>
                <button type="button" className={styles.outlineBtn} onClick={clearFilters}>
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {pageItems.map((r) => (
                <ReviewCard key={r.key} review={r} />
              ))}
            </div>

            <footer className={styles.footer}>
              <span className={styles.showing}>
                Showing {((curPage - 1) * PAGE_SIZE + 1).toLocaleString()}–
                {Math.min(curPage * PAGE_SIZE, filtered.length).toLocaleString()} of{' '}
                {filtered.length.toLocaleString()} review{filtered.length === 1 ? '' : 's'}
              </span>
              {pageCount > 1 && (
                <nav className={styles.pager} aria-label="Pagination">
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={curPage === 1}
                    aria-label="Previous page"
                    onClick={() => setPage(curPage - 1)}
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
                    aria-label="Next page"
                    onClick={() => setPage(curPage + 1)}
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </nav>
              )}
            </footer>
          </>
        )}
      </div>
    </AppShell>
  );
}
