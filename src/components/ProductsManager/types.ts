import { Measure, Product } from '@/redux/api/provider/types';

export interface ProductsManagerProps {
  providerId: string;
  products: Product[];
  /** Used to look up common-product suggestions for this business's type. */
  subcategorySlug?: string;
  /** The business's own COD/Partial Pay settings — new products default to these. */
  businessCodEnabled?: boolean;
  businessPartialPayEnabled?: boolean;
}

export interface ProductForm {
  name: string;
  description: string;
  measure: Measure;
  price: string; // ₹ for `priceQty` `priceUnit`
  priceQty: string;
  priceUnit: string;
  stock: string;
  stockUnit: string;
  unlimitedStock: boolean;
  step: string; // minimum + increment
  stepUnit: string;
  section: string;
  imageUrl: string;
  productTypeId: string; // '' = untagged
  codEnabled: boolean;
  partialPayEnabled: boolean;
}
