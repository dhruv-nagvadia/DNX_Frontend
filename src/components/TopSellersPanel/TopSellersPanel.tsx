import { Trophy } from 'lucide-react';

import { ModernCard } from '@/components/ModernCard';
import { Skeleton } from '@/components/Skeleton';
import { BusinessType } from '@/redux/api/provider/types';

import { useTopSellers } from './useTopSellers';
import styles from './TopSellersPanel.module.css';

const MAX_ROWS = 5;
/** Rank badge colours: gold, silver, bronze, then neutral. */
const RANK_CLASS = [styles.rankGold, styles.rankSilver, styles.rankBronze];

function money(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(minor / 100);
  } catch {
    return `₹${Math.round(minor / 100)}`;
  }
}

/** Top services/products by revenue, all time (mockup: "Top Sellers (All Time)"). */
export function TopSellersPanel({
  providerId,
  businessType,
}: {
  providerId: string;
  businessType: BusinessType;
}) {
  const { data, isLoading } = useTopSellers(providerId, businessType);
  const isProduct = data.itemLabel === 'product';

  if (isLoading) {
    return <Skeleton height={260} radius="var(--m-radius-card)" />;
  }

  return (
    <ModernCard icon={<Trophy size={22} aria-hidden="true" />} iconTone="gold" title="Top Sellers" suffix="(All Time)" flush>
      {data.items.length === 0 ? (
        <p className={styles.empty}>
          No {isProduct ? 'orders' : 'bookings'} yet. Top {data.itemLabel}s will show up here once
          they come in.
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.rankCell}>#</th>
                <th>{isProduct ? 'Product' : 'Service'}</th>
                <th className={styles.num}>{isProduct ? 'Orders' : 'Bookings'}</th>
                <th className={styles.num}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.items.slice(0, MAX_ROWS).map((item, i) => (
                <tr key={item.name}>
                  <td className={styles.rankCell}>
                    <span className={`${styles.rank} ${RANK_CLASS[i] ?? ''}`}>{i + 1}</span>
                  </td>
                  <td className={styles.name} title={item.name}>
                    {item.name}
                  </td>
                  <td className={styles.num}>{item.count.toLocaleString('en-IN')}</td>
                  <td className={styles.num}>{money(item.revenueMinor, data.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ModernCard>
  );
}
