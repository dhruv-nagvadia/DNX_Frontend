import {
  CalendarCheck2,
  IndianRupee,
  ShoppingBag,
  Smartphone,
  Store,
  Users,
} from 'lucide-react';

import { AdminShell } from '@/components/AdminShell';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { StatTile } from '@/components/StatTile';
import { useGetAnalyticsOverviewQuery } from '@/redux/api/admin/adminApi';
import { GrowthChart } from './GrowthChart';
import styles from './AdminDashboardPage.module.css';

function money(minor: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function growthNote(pct: number): string {
  if (pct === 0) return 'flat vs. previous 30 days';
  return `${pct > 0 ? '+' : ''}${pct}% vs. previous 30 days`;
}

/** Platform-wide overview: growth across the customer app and the provider web dashboard. */
export default function AdminDashboardPage() {
  const { data, isLoading } = useGetAnalyticsOverviewQuery();

  return (
    <AdminShell wide>
      <PageHeader
        title="Admin console"
        subtitle="Platform-wide activity across the customer app and provider dashboard."
      />

      {isLoading || !data ? (
        <div className={styles.stats}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={96} radius="var(--radius-lg)" />
          ))}
        </div>
      ) : (
        <>
          <div className={styles.stats}>
            <StatTile
              label="Customers (app)"
              value={data.totals.customers}
              icon={<Smartphone size={18} aria-hidden="true" />}
              note={`+${data.last30Days.newCustomers} last 30d · ${growthNote(data.last30Days.customerGrowthPct)}`}
            />
            <StatTile
              label="Providers (web)"
              value={data.totals.providers}
              icon={<Users size={18} aria-hidden="true" />}
              note={`+${data.last30Days.newProviders} last 30d · ${growthNote(data.last30Days.providerGrowthPct)}`}
            />
            <StatTile
              label="Businesses"
              value={data.totals.businesses}
              icon={<Store size={18} aria-hidden="true" />}
            />
            <StatTile
              label="Bookings"
              value={data.totals.bookings}
              icon={<CalendarCheck2 size={18} aria-hidden="true" />}
            />
            <StatTile
              label="Orders"
              value={data.totals.orders}
              icon={<ShoppingBag size={18} aria-hidden="true" />}
            />
            <StatTile
              label="Revenue collected"
              value={money(data.revenueMinor)}
              icon={<IndianRupee size={18} aria-hidden="true" />}
              note="across bookings & orders"
            />
          </div>

          <Card title="Growth" subtitle="New signups per day, last 14 days.">
            <GrowthChart
              labels={data.dailyGrowth.labels}
              customers={data.dailyGrowth.customers}
              providers={data.dailyGrowth.providers}
            />
          </Card>
        </>
      )}
    </AdminShell>
  );
}
