import { Product, StockAdjustmentReason } from '@/redux/api/provider/types';

export interface StockManagerProps {
  providerId: string;
  products: Product[];
}

export interface StockAdjustForm {
  direction: 'add' | 'remove';
  amount: string;
  unit: string;
  reason: StockAdjustmentReason | '';
  note: string;
}
