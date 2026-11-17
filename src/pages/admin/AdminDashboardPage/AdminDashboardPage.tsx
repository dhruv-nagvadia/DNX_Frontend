import { ReactNode, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CalendarCheck2,
  IndianRupee,
  Minus,
  ShoppingBag,
  Smartphone,
  Store,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';

import { AdminShell } from '@/components/AdminShell';
import { ModernCard } from '@/components/ModernCard';
import { Pill } from '@/components/Pill';
import { Skeleton } from '@/components/Skeleton';
import { Tabs } from '@/components/Tabs';
import { useGetAdminGrowthQuery, useGetAnalyticsOverviewQuery } from '@/redux/api/admin/adminApi';
import { GrowthGroupBy } from '@/redux/api/admin/types';
import { GrowthChart } from './GrowthChart';
import styles from './AdminDashboardPage.module.css';

function money(minor: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

const count = new Intl.NumberFormat('en-IN');

const GROWTH_TABS = [
  { id: 'day', label: 'Daily' },
  { id: 'month', label: 'Monthly' },
  { id: 'year', label: 'Yearly' },
];

const GROWTH_SUBTITLE: Record<GrowthGroupBy, string> = {
  day: 'New signups per day, last 14 days.',
  month: 'New signups per month, last 12 months.',
  year: 'New signups per year.',
};

/** Green/red/grey pill for a growth % vs. the previous 30 days. */
function GrowthPill({ pct }: { pct: number }) {
  if (pct === 0) {
    return (
      <Pill tone="grey">
        <Minus size={12} strokeWidth={2.5} aria-hidden="true" />
        Flat
      </Pill>
    );
  }
  const up = pct > 0;
  return (
    <Pill tone={up ? 'green' : 'red'}>
      {up ? (
        <ArrowUp size={12} strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <ArrowDown size={12} strokeWidth={2.5} aria-hidden="true" />
      )}
      {`${up ? '+' : ''}${pct}%`}
    </Pill>
  );
}

type TileTone = 'blue' | 'lavender' | 'mint' | 'peach' | 'pink';

const TILE_TONE: Record<TileTone, string> = {
  blue: styles.tileBlue,
  lavender: styles.tileLavender,
  mint: styles.tileMint,
  peach: styles.tilePeach,
  pink: styles.tilePink,
};

/** Pastel stat tile — same treatment as the provider dashboard's hero tiles. */
function Tile({
  tone,
  icon,
  label,
  value,
  foot,
}: {
  tone: TileTone;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  foot?: ReactNode;
}) {
  return (
    <div className={`${styles.tile} ${TILE_TONE[tone]}`}>
      <div className={styles.tileHead}>
        <span className={styles.tileIcon} aria-hidden="true">
          {icon}
        </span>
        <span className={styles.tileLabel}>{label}</span>
      </div>
      <span className={styles.tileValue}>{value}</span>
      {foot && <div className={styles.tileFoot}>{foot}</div>}
    </div>
  );
}

/** Platform-wide overview: growth across the customer app and the provider web dashboard. */
export default function AdminDashboardPage() {
  const { data, isLoading } = useGetAnalyticsOverviewQuery();
  const [groupBy, setGroupBy] = useState<GrowthGroupBy>('day');
  // `currentData` is specific to the chosen view, so switching never shows the old view's bars.
  const { currentData: growth } = useGetAdminGrowthQuery(groupBy, {
    refetchOnMountOrArgChange: true,
  });

  return (
    <AdminShell>
      <header className={styles.topRow}>
        <h1 className={styles.title}>Admin console</h1>
        <p className={styles.subtitle}>
          Platform-wide activity across the customer app and provider dashboard.
        </p>
      </header>

      {isLoading || !data ? (
        <>
          <div className={styles.tiles}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height={128} radius="var(--m-radius-card)" />
            ))}
          </div>
          <div className={styles.mainGrid}>
            <Skeleton height={380} radius="var(--m-radius-card)" />
            <div className={styles.side}>
              <Skeleton height={150} radius="var(--m-radius-card)" />
              <Skeleton height={210} radius="var(--m-radius-card)" />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.tiles}>
            <Tile
              tone="blue"
              icon={<Smartphone size={24} strokeWidth={1.8} />}
              label="Customers (app)"
              value={count.format(data.totals.customers)}
              foot={
                <>
                  <GrowthPill pct={data.last30Days.customerGrowthPct} />
                  <span>+{count.format(data.last30Days.newCustomers)} in 30d</span>
                </>
              }
            />
            <Tile
              tone="lavender"
              icon={<Users size={24} strokeWidth={1.8} />}
              label="Providers (web)"
              value={count.format(data.totals.providers)}
              foot={
                <>
                  <GrowthPill pct={data.last30Days.providerGrowthPct} />
                  <span>+{count.format(data.last30Days.newProviders)} in 30d</span>
                </>
              }
            />
            <Tile
              tone="mint"
              icon={<Store size={24} strokeWidth={1.8} />}
              label="Businesses"
              value={count.format(data.totals.businesses)}
            />
            <Tile
              tone="peach"
              icon={<CalendarCheck2 size={24} strokeWidth={1.8} />}
              label="Bookings"
              value={count.format(data.totals.bookings)}
            />
            <Tile
              tone="pink"
              icon={<ShoppingBag size={24} strokeWidth={1.8} />}
              label="Orders"
              value={count.format(data.totals.orders)}
            />
          </div>

          <div className={styles.mainGrid}>
            <ModernCard
              icon={<TrendingUp size={20} aria-hidden="true" />}
              title="Growth"
              action={
                <Tabs
                  tabs={GROWTH_TABS}
                  active={groupBy}
                  onChange={(id) => setGroupBy(id as GrowthGroupBy)}
                />
              }
            >
              <p className={styles.cardSub}>{GROWTH_SUBTITLE[groupBy]}</p>
              {growth ? (
                <GrowthChart
                  groupBy={growth.groupBy}
                  labels={growth.labels}
                  customers={growth.customers}
                  providers={growth.providers}
                />
              ) : (
                <Skeleton height={290} radius="var(--m-radius-box)" />
              )}
            </ModernCard>

            <div className={styles.side}>
              <div className={styles.revenueCard}>
                <span className={styles.revenueIcon} aria-hidden="true">
                  <IndianRupee size={22} strokeWidth={2} />
                </span>
                <div className={styles.revenueBody}>
                  <span className={styles.revenueLabel}>Revenue collected</span>
                  <span className={styles.revenueValue}>{money(data.revenueMinor)}</span>
                  <span className={styles.revenueNote}>Across bookings &amp; orders</span>
                </div>
              </div>

              <ModernCard icon={<UserPlus size={20} aria-hidden="true" />} title="Last 30 days">
                <ul className={styles.signupList}>
                  <li className={styles.signupRow}>
                    <span className={`${styles.signupIcon} ${styles.signupIconBlue}`} aria-hidden="true">
                      <Smartphone size={18} strokeWidth={1.8} />
                    </span>
                    <span className={styles.signupText}>
                      <span className={styles.signupLabel}>New customers</span>
                      <span className={styles.signupSub}>Customer app</span>
                    </span>
                    <span className={styles.signupValue}>
                      +{count.format(data.last30Days.newCustomers)}
                    </span>
                    <GrowthPill pct={data.last30Days.customerGrowthPct} />
                  </li>
                  <li className={styles.signupRow}>
                    <span
                      className={`${styles.signupIcon} ${styles.signupIconLavender}`}
                      aria-hidden="true"
                    >
                      <Users size={18} strokeWidth={1.8} />
                    </span>
                    <span className={styles.signupText}>
                      <span className={styles.signupLabel}>New providers</span>
                      <span className={styles.signupSub}>Provider web</span>
                    </span>
                    <span className={styles.signupValue}>
                      +{count.format(data.last30Days.newProviders)}
                    </span>
                    <GrowthPill pct={data.last30Days.providerGrowthPct} />
                  </li>
                </ul>
                <p className={styles.signupCaption}>Change is vs. the previous 30 days.</p>
              </ModernCard>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
