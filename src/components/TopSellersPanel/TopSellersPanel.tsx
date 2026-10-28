import { Award, CalendarDays, Package, Wrench } from 'lucide-react';

import { Card } from '@/components/Card';
import { Skeleton } from '@/components/Skeleton';
import { BusinessType } from '@/redux/api/provider/types';

import { useTopSellers } from './useTopSellers';
import styles from './TopSellersPanel.module.css';

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

/** Top services/products by revenue, plus the business's busiest weekday. */
export function TopSellersPanel({
  providerId,
  businessType,
}: {
  providerId: string;
  businessType: BusinessType;
}) {
  const { data, isLoading } = useTopSellers(providerId, businessType);
  const Icon = businessType === 'STORE' ? Package : Wrench;

  if (isLoading) {
    return <Skeleton height={220} radius="var(--radius-xl)" />;
  }

  return (
    <Card
      title={businessType === 'STORE' ? 'Top products' : 'Top services'}
      subtitle="By revenue, all time"
      action={
        data.busiestDay && (
          <span className={styles.busiest}>
            <CalendarDays size={14} aria-hidden="true" />
            Busiest: {data.busiestDay}
          </span>
        )
      }
    >
      {data.items.length === 0 ? (
        <p className={styles.empty}>
          No {data.itemLabel === 'product' ? 'orders' : 'bookings'} yet. Top {data.itemLabel}s will
          show up here once they come in.
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th aria-hidden="true" />
                <th>{data.itemLabel === 'product' ? 'Product' : 'Service'}</th>
                <th>{data.itemLabel === 'product' ? 'Orders' : 'Bookings'}</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={item.name}>
                  <td className={styles.rankCell}>
                    <span className={styles.rank}>
                      {i === 0 ? <Award size={16} aria-hidden="true" /> : i + 1}
                    </span>
                  </td>
                  <td>
                    <div className={styles.nameCell}>
                      <span className={styles.icon}>
                        <Icon size={15} aria-hidden="true" />
                      </span>
                      <span className={styles.name} title={item.name}>
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className={styles.count}>{item.count}</td>
                  <td className={styles.revenue}>{money(item.revenueMinor, data.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
