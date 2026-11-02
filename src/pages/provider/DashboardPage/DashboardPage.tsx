import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Coins,
  ListChecks,
  Package,
  Plus,
  Store,
} from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/Badge';
import { BusinessChecklist } from '@/components/BusinessChecklist';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { NotificationBell } from '@/components/NotificationBell';
import { Skeleton } from '@/components/Skeleton';
import { OrderStatus, ProviderOrder } from '@/redux/api/provider/types';
import { stockLabel } from '@/utils/units';

import { AttentionItem, orderOutstanding, useDashboard } from './useDashboard';
import styles from './DashboardPage.module.css';

const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' });

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

type Tone = 'warning' | 'accent' | 'success' | 'neutral' | 'brand';

const ORDER_TONE: Record<OrderStatus, Tone> = {
  PENDING: 'warning',
  CONFIRMED: 'accent',
  READY: 'brand',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  NO_SHOW: 'neutral',
};

const ORDER_LABEL: Record<OrderStatus, string> = {
  PENDING: 'new',
  CONFIRMED: 'confirmed',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
};

const TODAY_PREVIEW = 5;
const ATTENTION_PREVIEW = 5;
const ORDERS_PREVIEW = 4;
const LOW_STOCK_PREVIEW = 6;
// Purely decorative — a fixed ascending staircase, not real per-period
// revenue data (matches the mockup's look and the mobile app's mini chart).
const CHART_BARS = [30, 55, 75, 100];

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

  const navigate = useNavigate();

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

  const firstName = fullName.trim().split(/\s+/)[0] || 'there';

  return (
    <AppShell>
      <div className={styles.topRow}>
        <div className={styles.greetBlock}>
          <h1 className={styles.greetTitle}>Hello, {firstName}</h1>
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
              <Store size={14} aria-hidden="true" />
              All Businesses
              <ChevronDown size={14} aria-hidden="true" />
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
          <NotificationBell />
          <Link className={styles.profileChip} to="/profile">
            {avatarUrl ? (
              <img className={styles.profileAvatarImg} src={avatarUrl} alt="" aria-hidden="true" />
            ) : (
              <span className={styles.profileAvatar} aria-hidden="true">
                {initialsOf(fullName || 'DNX')}
              </span>
            )}
            <span className={styles.profileName}>{fullName || 'Your account'}</span>
            <ChevronDown size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.heroRow}>
          <Skeleton height={140} radius="var(--radius-xl)" />
          <Skeleton height={140} radius="var(--radius-xl)" />
          <Skeleton height={140} radius="var(--radius-xl)" />
          <Skeleton height={140} radius="var(--radius-xl)" />
          <Skeleton height={140} radius="var(--radius-xl)" />
        </div>
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
                <Coins size={22} />
              </div>
              <div className={styles.revenueBody}>
                <span className={styles.revenueLabel}>Money Collected This Month</span>
                <span className={styles.revenueValue}>{money(collectedThisMonth, currency)}</span>
                {monthOverMonthPct !== 0 && (
                  <span className={styles.revenueTrendRow}>
                    <span className={styles.revenueTrendPct}>
                      {monthOverMonthPct === null ? 'New' : `↑ ${monthOverMonthPct}%`}
                    </span>
                    <span className={styles.revenueTrendLabel}>vs last month</span>
                  </span>
                )}
              </div>
              <div className={styles.revenueChart} aria-hidden="true">
                {CHART_BARS.map((v, i) => (
                  <span key={i} className={styles.revenueBar} style={{ height: `${v}%` }} />
                ))}
              </div>
            </div>

            <div className={`${styles.tile} ${styles.tilePrimary}`}>
              <span className={styles.tileIcon} aria-hidden="true">
                <CalendarDays size={24} strokeWidth={2.5} />
              </span>
              <span className={styles.tileLabel}>Today&rsquo;s Bookings</span>
              <span className={styles.tileValue}>{todays.length}</span>
            </div>
            <div className={`${styles.tile} ${styles.tilePurple}`}>
              <span className={styles.tileIcon} aria-hidden="true">
                <CalendarClock size={24} strokeWidth={2.5} />
              </span>
              <span className={styles.tileLabel}>Upcoming Bookings</span>
              <span className={styles.tileValue}>{upcomingCount}</span>
            </div>
            <div className={`${styles.tile} ${styles.tileAmber}`}>
              <span className={styles.tileIcon} aria-hidden="true">
                <Package size={24} strokeWidth={2.5} />
              </span>
              <span className={styles.tileLabel}>Open Orders</span>
              <span className={styles.tileValue}>{openOrdersCount}</span>
            </div>
            <div className={`${styles.tile} ${styles.tileRed}`}>
              <span className={styles.tileIcon} aria-hidden="true">
                <ListChecks size={24} strokeWidth={2.5} />
              </span>
              <span className={styles.tileLabel}>Needs Action</span>
              <span className={styles.tileValue}>{needsActionCount}</span>
            </div>
          </div>

          {/* One card for every business with profile steps pending (none once complete). */}
          <BusinessChecklist
            businesses={businesses}
            onGoTo={goToBusinessTab}
            onEdit={goToBusinessEdit}
          />

          {/* Two columns: services on the left (attention, schedule), stores on the right (orders, stock). */}
          <div className={styles.columns}>
            {hasService && (
              <div className={styles.col}>
                {hasService && (
                  <Card
                    title={`Needs Your Attention (${attention.length})`}
                    flush
                    action={
                      attention.length > ATTENTION_PREVIEW ? (
                        <button
                          type="button"
                          className={styles.viewAll}
                          onClick={() => navigate('/dashboard/attention')}
                        >
                          View All
                          <ChevronRight size={15} aria-hidden="true" />
                        </button>
                      ) : undefined
                    }
                  >
                    {attention.length === 0 ? (
                      <p className={styles.empty}>You&rsquo;re all caught up. Nothing needs action.</p>
                    ) : (
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Service / Booking</th>
                            <th>Customer</th>
                            <th>Business</th>
                            <th>Action</th>
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
                  </Card>
                )}
                {todays.length > 0 && (
                  <Card
                    title={`Today's Schedule (${todays.length})`}
                    flush
                    action={
                      todays.length > TODAY_PREVIEW ? (
                        <button
                          type="button"
                          className={styles.viewAll}
                          onClick={() => navigate('/dashboard/schedule')}
                        >
                          View All
                          <ChevronRight size={15} aria-hidden="true" />
                        </button>
                      ) : undefined
                    }
                  >
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
                            <td className={styles.timeCell}>
                              {timeFmt.format(new Date(b.startTime))}
                            </td>
                            <td>{b.service.name}</td>
                            <td>{b.user.fullName}</td>
                            <td>
                              <span className={styles.businessName}>{b.provider.businessName}</span>
                            </td>
                            <td className={styles.chevronCell}>
                              <ChevronRight size={16} aria-hidden="true" className={styles.chevron} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                )}
              </div>
            )}
            {hasStore && (
              <div className={styles.col}>
                {hasStore && (
                  <Card
                    title={`Orders to Fulfil (${openOrders.length})`}
                    flush
                    action={
                      openOrders.length > ORDERS_PREVIEW ? (
                        <button
                          type="button"
                          className={styles.viewAll}
                          onClick={() => navigate('/dashboard/orders')}
                        >
                          View All
                          <ChevronRight size={15} aria-hidden="true" />
                        </button>
                      ) : undefined
                    }
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
                  </Card>
                )}
                {hasStore && lowStock.length > 0 && (
                  <Card
                    title={`Low Stock (${lowStock.length})`}
                    flush
                    action={
                      lowStock.length > LOW_STOCK_PREVIEW ? (
                        <button
                          type="button"
                          className={styles.viewAll}
                          onClick={() => navigate('/dashboard/low-stock')}
                        >
                          View All
                          <ChevronRight size={15} aria-hidden="true" />
                        </button>
                      ) : undefined
                    }
                  >
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Business</th>
                          <th>Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStock.slice(0, LOW_STOCK_PREVIEW).map(({ product, businessId, businessName, level }) => (
                          <tr
                            key={product.id}
                            className={styles.tr}
                            {...rowActivation(() => goToBusinessProducts(businessId))}
                          >
                            <td>{product.name}</td>
                            <td>
                              <span className={styles.businessName}>{businessName}</span>
                            </td>
                            <td>
                              <Badge tone={level === 'out' ? 'error' : 'warning'}>
                                {level === 'out'
                                  ? 'Out of Stock'
                                  : `Only ${stockLabel(product.stockQty, product.measure)} left`}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </AppShell>
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
  return (
    <tr className={styles.tr} {...rowActivation(onOpen)}>
      <td className={styles.idCell}>{shortOrderId(order.id)}</td>
      <td>{order.user.fullName}</td>
      <td>
        <span className={styles.businessName}>{order.provider.businessName}</span>
      </td>
      <td>
        {itemCount} item{itemCount === 1 ? '' : 's'}
      </td>
      <td>
        <Badge tone={ORDER_TONE[order.status]}>{ORDER_LABEL[order.status]}</Badge>
      </td>
      <td className={styles.paymentCell}>{paymentLine(order, currency)}</td>
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
      <td>
        <span className={styles.rowTitle}>{booking.service.name}</span>
        <span className={styles.rowSub}>Booking #{booking.id.slice(-6).toUpperCase()}</span>
      </td>
      <td>{booking.user.fullName}</td>
      <td>
        <span className={styles.businessName}>{booking.provider.businessName}</span>
      </td>
      <td className={styles.actionCell}>
        <div className={styles.actionStack}>
          {confirm && <Badge tone="warning">Confirm Request</Badge>}
          {collect && <Badge tone="success">Collect {money(due, currency)}</Badge>}
        </div>
      </td>
    </tr>
  );
}
