import { KeyboardEvent } from 'react';
import { PackageX } from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { stockLabel } from '@/utils/units';

import { useLowStockPage } from './useLowStockPage';
import styles from '../DashboardPage/DashboardPage.module.css';

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

/** Full, unsliced "Low Stock" — every low/out-of-stock product, across every business. */
export default function LowStockPage() {
  const { isLoading, lowStock, goToBusinessProducts } = useLowStockPage();

  return (
    <AppShell>
      <PageHeader title="Low Stock" subtitle="Every product running low or out, across all your stores." />

      {isLoading ? (
        <Skeleton height={240} radius="var(--radius-xl)" />
      ) : (
        <Card flush>
          {lowStock.length === 0 ? (
            <EmptyState
              icon={<PackageX size={28} strokeWidth={1.6} aria-hidden="true" />}
              title="Stock looks healthy"
              description="Nothing is running low right now."
            />
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Business</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map(({ product, businessId, businessName, level }) => (
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
                        {level === 'out' ? 'Out of Stock' : `Only ${stockLabel(product.stockQty, product.measure)} left`}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </AppShell>
  );
}
