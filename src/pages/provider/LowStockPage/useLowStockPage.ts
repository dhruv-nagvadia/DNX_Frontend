import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { useGetMyBusinessesQuery } from '@/redux/api/provider/providerApi';
import { Product } from '@/redux/api/provider/types';
import { StockLevel, stockLevel } from '@/utils/units';

/** A product running low or out, tagged with the business it belongs to. */
export interface LowStockItem {
  product: Product;
  businessId: string;
  businessName: string;
  level: StockLevel;
}

/** The full "Low Stock" list — same derivation as the Dashboard's preview,
 * just unsliced (the Dashboard caps its inline preview at 6) and on its own page. */
export function useLowStockPage() {
  const navigate = useNavigate();
  const { data: businesses = [], isLoading } = useGetMyBusinessesQuery();

  const lowStock = useMemo(() => {
    const items: LowStockItem[] = [];
    for (const b of businesses) {
      for (const p of b.products ?? []) {
        if (p.isActive === false) continue;
        // Made-to-order items have no "low stock" concept — only out/in.
        if (p.unlimitedStock) {
          if (p.stockQty <= 0) {
            items.push({ product: p, businessId: b.id, businessName: b.businessName, level: 'out' });
          }
          continue;
        }
        const level = stockLevel(p.stockQty, p.stepQty);
        if (level !== 'ok') {
          items.push({ product: p, businessId: b.id, businessName: b.businessName, level });
        }
      }
    }
    return items.sort((a, b) => {
      if (a.level !== b.level) return a.level === 'out' ? -1 : 1;
      return a.product.stockQty - b.product.stockQty;
    });
  }, [businesses]);

  return {
    isLoading,
    lowStock,
    goToBusinessProducts: (id: string) => navigate(`/businesses/${id}`, { state: { tab: 'products' } }),
  };
}
