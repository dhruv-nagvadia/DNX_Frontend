import { Measure, Product } from '@/redux/api/provider/types';

export interface ProductsManagerProps {
  providerId: string;
  products: Product[];
  /** Used to look up common-product suggestions for this business's type. */
  subcategorySlug?: string;
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
  step: string; // minimum + increment
  stepUnit: string;
  section: string;
  imageUrl: string;
  productTypeId: string; // '' = untagged
}
