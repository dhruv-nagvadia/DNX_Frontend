import { FlaskConical, PackageX, Store } from 'lucide-react';

import { Pill } from '@/components/Pill';
import { stockLabel } from '@/utils/units';

import { LeadChip, ViewAllPage, ViewAllRow } from '../TodaysSchedulePage/ViewAllLayout';
import styles from '../TodaysSchedulePage/ViewAll.module.css';
import { useLowStockPage } from './useLowStockPage';

/** Full, unsliced "Low Stock" — every low/out-of-stock product, across every business. */
export default function LowStockPage() {
  const { isLoading, lowStock, goToBusinessProducts } = useLowStockPage();
  const count = lowStock.length;

  return (
    <ViewAllPage
      title="Low Stock"
      subtitle={`${count} product${count === 1 ? '' : 's'} running low or out`}
      isLoading={isLoading}
      isEmpty={count === 0}
      empty={{
        icon: <PackageX size={28} strokeWidth={1.6} />,
        title: 'Stock looks healthy',
        description: 'Nothing is running low right now.',
      }}
    >
      {lowStock.map(({ product, businessId, businessName, level }) => {
        const out = level === 'out';
        return (
          <ViewAllRow
            key={product.id}
            onOpen={() => goToBusinessProducts(businessId)}
            lead={
              product.imageUrl ? (
                <img className={styles.thumb} src={product.imageUrl} alt="" aria-hidden="true" loading="lazy" />
              ) : (
                <LeadChip tone={out ? 'pink' : 'peach'}>
                  <FlaskConical size={18} aria-hidden="true" />
                </LeadChip>
              )
            }
            title={product.name}
            lines={
              <>
                <span className={styles.subItem}>
                  <Store size={14} aria-hidden="true" />
                  {businessName}
                </span>
                <span className={styles.subItem}>
                  {product.unlimitedStock ? 'Made to order' : `${stockLabel(product.stockQty, product.measure)} left`}
                </span>
              </>
            }
            meta={
              <Pill tone={out ? 'red' : 'orange'}>
                {out ? 'Out of stock' : `Only ${stockLabel(product.stockQty, product.measure)} left`}
              </Pill>
            }
          />
        );
      })}
    </ViewAllPage>
  );
}
