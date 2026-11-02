import { KeyboardEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Coins,
  Package,
  Plus,
  Store,
  TriangleAlert,
  User,
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { BusinessChecklist } from '@/components/BusinessChecklist';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { NotificationBell } from '@/components/NotificationBell';
import { Pill, PillTone } from '@/components/Pill';
import { Skeleton } from '@/components/Skeleton';
import { OrderStatus, ProviderOrder } from '@/redux/api/provider/types';
import { stockLabel } from '@/utils/units';

import { AttentionItem, LowStockItem, orderOutstanding, useDashboard } from './useDashboard';
import styles from './DashboardPage.module.css';

// "10:00 AM" / "01:00 PM" — fixed-width times so the schedule's time pills line up.
const timeFmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' });

/** Spreads onto a clickable <tr> so it's reachable and activatable by keyboard too. */
function rowActivation(onOpen: () => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick: onOpen,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onOpen();
      }
    },
  };
}

function money(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(minor / 100);
  } catch {
    return `${Math.round(minor / 100)}`;
  }
}

/** Short, display-only order code (no real order-number sequence exists yet). */
function shortOrderId(id: string): string {
  return `#${id.slice(-6).toUpperCase()}`;
}

/** The payment line shown on every order row, even when fully settled. */
function paymentLine(order: ProviderOrder, currency: string): string {
  if (order.paymentMethod === 'ONLINE') {
    return order.paymentStatus === 'PAID' ? 'Paid' : 'Online';
  }
  const label = order.paymentMethod === 'CASH' ? 'COD' : 'Partial';
  return `${label}: ${money(orderOutstanding(order), currency)}`;
}

const TAG_TONES: PillTone[] = ['lavender', 'green', 'blue', 'orange'];
/** Deterministic colour tag per business, purely so rows stay visually scannable. */
function businessTone(id: string): PillTone {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return TAG_TONES[hash % TAG_TONES.length];
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

const ORDER_TONE: Record<OrderStatus, PillTone> = {
  PENDING: 'lavender',
  CONFIRMED: 'blue',
  READY: 'green',
  COMPLETED: 'green',
  CANCELLED: 'grey',
  NO_SHOW: 'grey',
};

const ORDER_LABEL: Record<OrderStatus, string> = {
  PENDING: 'New',
  CONFIRMED: 'Confirmed',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show',
};

const SECTION_ICON_TONE = {
  blue: styles.sectionIconBlue,
  red: styles.sectionIconRed,
  orange: styles.sectionIconOrange,
};

/** One rounded white dashboard card: icon + title (count), View All link, then its table. */
function DashCard({
  icon,
  tone,
  title,
  count,
  viewAllTo,
  children,
}: {
  icon: ReactNode;
  tone: keyof typeof SECTION_ICON_TONE;
  title: ReactNode;
  count: number;
  viewAllTo: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <section className={styles.card}>
      <header className={styles.cardHead}>
        <h2 className={styles.cardTitle}>
          <span className={`${styles.sectionIcon} ${SECTION_ICON_TONE[tone]}`} aria-hidden="true">
            {icon}
          </span>
          <span>
            {title} ({count})
          </span>
        </h2>
        {count > 0 && (
          <button type="button" className={styles.viewAll} onClick={() => navigate(viewAllTo)}>
            View All
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
      </header>
      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}

/** The trailing `>` cell on every clickable row. */
function ChevronCell() {
  return (
    <td className={styles.chevronCell}>
      <ChevronRight size={18} aria-hidden="true" className={styles.chevron} />
    </td>
  );
}

const TODAY_PREVIEW = 5;
const ATTENTION_PREVIEW = 5;
const ORDERS_PREVIEW = 4;
const LOW_STOCK_PREVIEW = 6;
// Purely decorative — a fixed ascending staircase, not real per-period
// revenue data (matches the mockup's look and the mobile app's mini chart).
const CHART_BARS = [22, 45, 70, 100];

/** Home dashboard — a command center across all of the provider's businesses. */
export default function DashboardPage() {
  const {
    fullName,
    avatarUrl,
    isLoading,
    businesses,
    hasBusinesses,
    hasService,
    hasStore,
    todays,
    upcomingCount,
    attention,
    openOrders,
    openOrdersCount,
    needsActionCount,
    collectedThisMonth,
    monthOverMonthPct,
    currency,
    lowStock,
    goToBusiness,
    goToBusinessTab,
    goToBusinessEdit,
    goToBusinessOrders,
    goToBusinessProducts,
    addBusiness,
  } = useDashboard();

  const [bizMenuOpen, setBizMenuOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bizMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setBizMenuOpen(false);
      }
    };
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setBizMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [bizMenuOpen]);

  const displayName = fullName.trim() || 'there';
  const trendDown = monthOverMonthPct !== null && monthOverMonthPct < 0;

  return (
    <AppShell>
      <div className={styles.topRow}>
        <div className={styles.greetBlock}>
          <h1 className={styles.greetTitle}>
            Hello, {displayName}{' '}
            <span className={styles.wave} role="img" aria-label="waving hand">
              👋
            </span>
          </h1>
          <p className={styles.greetSub}>
            Here&rsquo;s what&rsquo;s happening with your businesses today.
          </p>
        </div>
        <div className={styles.topActions}>
          <div className={styles.switcherWrap} ref={switcherRef}>
            <button
              type="button"
              className={styles.switcher}
              title="All businesses"
              onClick={() => setBizMenuOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={bizMenuOpen}
            >
              All Businesses
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            {bizMenuOpen && (
              <div className={styles.switcherMenu} role="listbox">
                {businesses.length === 0 ? (
                  <p className={styles.switcherEmpty}>No businesses yet.</p>
                ) : (
                  businesses.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={styles.switcherItem}
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        setBizMenuOpen(false);
                        goToBusiness(b.id);
                      }}
                    >
                      {b.businessName}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className={styles.bellWrap}>
            <NotificationBell />
          </div>
          <Link className={styles.profileChip} to="/profile">
            {avatarUrl ? (
              <img className={styles.profileAvatarImg} src={avatarUrl} alt="" aria-hidden="true" />
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

      {isLoading ? (
        <>
          <div className={styles.heroRow}>
            <Skeleton height={172} radius="var(--m-radius-card)" />
            <Skeleton height={172} radius="var(--m-radius-card)" />
            <Skeleton height={172} radius="var(--m-radius-card)" />
            <Skeleton height={172} radius="var(--m-radius-card)" />
            <Skeleton height={172} radius="var(--m-radius-card)" />
          </div>
          <div className={styles.grid}>
            <Skeleton height={300} radius="var(--m-radius-card)" />
            <Skeleton height={300} radius="var(--m-radius-card)" />
          </div>
        </>
      ) : !hasBusinesses ? (
        <EmptyState
          icon={<Store size={28} strokeWidth={1.6} aria-hidden="true" />}
          title="Let's set up your first business"
          description="Add a business so customers can discover and book you. Once bookings come in, this dashboard shows your day at a glance."
          action={
            <Button onClick={addBusiness} iconLeft={<Plus size={18} aria-hidden="true" />}>
              Add your first business
            </Button>
          }
        />
      ) : (
        <>
          <div className={styles.heroRow}>
            <div className={styles.revenueCard}>
              <div className={styles.revenueIcon} aria-hidden="true">
                <Coins size={30} strokeWidth={1.8} />
              </div>
              <div className={styles.revenueBody}>
                <span className={styles.revenueLabel}>Money Collected This Month</span>
                <span className={styles.revenueValue}>{money(collectedThisMonth, currency)}</span>
                {monthOverMonthPct !== 0 && (
                  <span className={styles.revenueTrendRow}>
                    <span
                      className={`${styles.revenueTrendPct} ${trendDown ? styles.revenueTrendDown : ''}`}
                    >
                      {trendDown ? (
                        <ArrowDown size={14} strokeWidth={2.6} aria-hidden="true" />
                      ) : (
                        <ArrowUp size={14} strokeWidth={2.6} aria-hidden="true" />
                      )}
                      {monthOverMonthPct === null
                        ? 'New'
                        : `${monthOverMonthPct > 0 ? '+' : ''}${monthOverMonthPct}%`}
                    </span>
                    <span className={styles.revenueTrendLabel}>vs. last month</span>
                  </span>
                )}
              </div>
              <div className={styles.revenueChart} aria-hidden="true">
                {CHART_BARS.map((v, i) => (
                  <span key={i} className={styles.revenueBar} style={{ height: `${v}%` }} />
                ))}
              </div>
            </div>

            <div className={`${styles.tile} ${styles.tileBlue}`}>
              <span className={styles.tileIcon} aria-hidden="true">
                <CalendarDays size={34} strokeWidth={1.8} />
              </span>
              <span className={styles.tileLabel}>
                Today&rsquo;s
                <br />
                Bookings
              </span>
              <span className={styles.tileValue}>{todays.length}</span>
            </div>
            <div className={`${styles.tile} ${styles.tileLavender}`}>
              <span className={styles.tileIcon} aria-hidden="true">
                <CalendarClock size={34} strokeWidth={1.8} />
              </span>
              <span className={styles.tileLabel}>
                Upcoming
                <br />
                Bookings
              </span>
              <span className={styles.tileValue}>{upcomingCount}</span>
            </div>
            <div className={`${styles.tile} ${styles.tilePeach}`}>
              <span className={styles.tileIcon} aria-hidden="true">
                <Package size={34} strokeWidth={1.8} />
              </span>
              <span className={styles.tileLabel}>
                Open
                <br />
                Orders
              </span>
              <span className={styles.tileValue}>{openOrdersCount}</span>
            </div>
            <div className={`${styles.tile} ${styles.tilePink}`}>
              <span className={styles.tileIcon} aria-hidden="true">
                <AlertCircle size={34} strokeWidth={1.8} />
              </span>
              <span className={styles.tileLabel}>
                Needs
                <br />
                Action
              </span>
              <span className={styles.tileValue}>{needsActionCount}</span>
            </div>
          </div>

          {/* One card for every business with profile steps pending (none once complete). */}
          <BusinessChecklist
            businesses={businesses}
            onGoTo={goToBusinessTab}
            onEdit={goToBusinessEdit}
          />

          {/* 2×2: services on top (schedule, attention), stores below (orders, stock).
              With only one kind of business, its two cards share a single row. */}
          <div className={styles.grid}>
            {hasService && (
              <DashCard
                icon={<CalendarDays size={24} strokeWidth={2} />}
                tone="blue"
                title="Today’s Schedule"
                count={todays.length}
                viewAllTo="/dashboard/schedule"
              >
                {todays.length === 0 ? (
                  <p className={styles.empty}>No bookings scheduled for today.</p>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Service</th>
                        <th>Customer</th>
                        <th>Business</th>
                        <th aria-hidden="true" />
                      </tr>
                    </thead>
                    <tbody>
                      {todays.slice(0, TODAY_PREVIEW).map((b) => (
                        <tr
                          key={b.id}
                          className={styles.tr}
                          {...rowActivation(() => goToBusiness(b.provider.id))}
                        >
                          <td>
                            <span className={styles.timePill}>
                              {timeFmt.format(new Date(b.startTime))}
                            </span>
                          </td>
                          <td className={styles.strong}>{b.service.name}</td>
                          <td>
                            <CustomerCell name={b.user.fullName} />
                          </td>
                          <td>
                            <Pill tone={businessTone(b.provider.id)}>{b.provider.businessName}</Pill>
                          </td>
                          <ChevronCell />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </DashCard>
            )}

            {hasService && (
              <DashCard
                icon={<AlertCircle size={24} strokeWidth={2} />}
                tone="red"
                title="Needs Your Attention"
                count={attention.length}
                viewAllTo="/dashboard/attention"
              >
                {attention.length === 0 ? (
                  <p className={styles.empty}>You&rsquo;re all caught up. Nothing needs action.</p>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th colSpan={2}>Service / Booking</th>
                        <th>Customer</th>
                        <th>Business</th>
                        <th>Action</th>
                        <th aria-hidden="true" />
                      </tr>
                    </thead>
                    <tbody>
                      {attention.slice(0, ATTENTION_PREVIEW).map((item) => (
                        <AttentionRow
                          key={item.booking.id}
                          item={item}
                          currency={currency}
                          onOpen={() => goToBusiness(item.booking.provider.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </DashCard>
            )}

            {hasStore && (
              <DashCard
                icon={<Package size={24} strokeWidth={2} />}
                tone="orange"
                title="Orders to Fulfil"
                count={openOrders.length}
                viewAllTo="/dashboard/orders"
              >
                {openOrders.length === 0 ? (
                  <p className={styles.empty}>No open orders. You&rsquo;re all caught up.</p>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Business</th>
                        <th>Items</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th aria-hidden="true" />
                      </tr>
                    </thead>
                    <tbody>
                      {openOrders.slice(0, ORDERS_PREVIEW).map((o) => (
                        <OrderRow
                          key={o.id}
                          order={o}
                          currency={currency}
                          onOpen={() => goToBusinessOrders(o.provider.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </DashCard>
            )}

            {hasStore && (
              <DashCard
                icon={<TriangleAlert size={24} strokeWidth={2} />}
                tone="red"
                title="Low Stock"
                count={lowStock.length}
                viewAllTo="/dashboard/low-stock"
              >
                {lowStock.length === 0 ? (
                  <p className={styles.empty}>Everything is well stocked.</p>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Business</th>
                        <th>Stock</th>
                        <th aria-hidden="true" />
                      </tr>
                    </thead>
                    <tbody>
                      {lowStock.slice(0, LOW_STOCK_PREVIEW).map((item) => (
                        <LowStockRow
                          key={item.product.id}
                          item={item}
                          onOpen={() => goToBusinessProducts(item.businessId)}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </DashCard>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}

/** A muted person icon ahead of a customer's name. */
function CustomerCell({ name }: { name: string }) {
  return (
    <span className={styles.customerCell}>
      <User size={15} aria-hidden="true" className={styles.customerIcon} />
      {name}
    </span>
  );
}

/** One order row: order id, who/where, item count, status and payment. */
function OrderRow({
  order,
  currency,
  onOpen,
}: {
  order: ProviderOrder;
  currency: string;
  onOpen: () => void;
}) {
  const itemCount = order.items.length;
  const payment = paymentLine(order, currency);
  return (
    <tr className={styles.tr} {...rowActivation(onOpen)}>
      <td className={styles.strong}>{shortOrderId(order.id)}</td>
      <td>{order.user.fullName}</td>
      <td>{order.provider.businessName}</td>
      <td>
        {itemCount} item{itemCount === 1 ? '' : 's'}
      </td>
      <td>
        <Pill tone={ORDER_TONE[order.status]}>{ORDER_LABEL[order.status]}</Pill>
      </td>
      <td>
        <Pill tone={payment === 'Paid' ? 'green' : 'grey'}>{payment}</Pill>
      </td>
      <ChevronCell />
    </tr>
  );
}

/** One low-stock row: product thumbnail + name, its store, and how much is left. */
function LowStockRow({ item, onOpen }: { item: LowStockItem; onOpen: () => void }) {
  const { product, businessName, level } = item;
  return (
    <tr className={styles.tr} {...rowActivation(onOpen)}>
      <td>
        <span className={styles.productCell}>
          {product.imageUrl ? (
            <img className={styles.productThumb} src={product.imageUrl} alt="" aria-hidden="true" />
          ) : (
            <span className={styles.productThumb} aria-hidden="true">
              <Package size={18} />
            </span>
          )}
          <span className={styles.strong}>{product.name}</span>
        </span>
      </td>
      <td>{businessName}</td>
      <td>
        <Pill tone={level === 'out' ? 'red' : 'orange'}>
          {level === 'out'
            ? 'Out of Stock'
            : `Only ${stockLabel(product.stockQty, product.measure)} left`}
        </Pill>
      </td>
      <ChevronCell />
    </tr>
  );
}

/** One "needs attention" row: what's wrong + who/where, links to the business. */
function AttentionRow({
  item,
  currency,
  onOpen,
}: {
  item: AttentionItem;
  currency: string;
  onOpen: () => void;
}) {
  const { booking, confirm, collect, due } = item;
  return (
    <tr className={styles.tr} {...rowActivation(onOpen)}>
      <td className={styles.iconCell}>
        <span className={`${styles.rowIcon} ${confirm ? styles.rowIconBlue : styles.rowIconYellow}`}>
          {confirm ? <CalendarDays size={18} /> : <Coins size={18} />}
        </span>
      </td>
      <td>
        <span className={styles.rowTitle}>{booking.service.name}</span>
        <span className={styles.rowSub}>Booking #{booking.id.slice(-6).toUpperCase()}</span>
      </td>
      <td>
        <CustomerCell name={booking.user.fullName} />
      </td>
      <td>
        <Pill tone={businessTone(booking.provider.id)}>{booking.provider.businessName}</Pill>
      </td>
      <td className={styles.actionCell}>
        <div className={styles.actionStack}>
          {confirm && <Pill tone="orange">Confirm Request</Pill>}
          {collect && (
            <span className={styles.collectBlock}>
              <Pill tone="green">Collect Payment</Pill>
              <span className={styles.collectAmount}>{money(due, currency)}</span>
            </span>
          )}
        </div>
      </td>
      <ChevronCell />
    </tr>
  );
}
