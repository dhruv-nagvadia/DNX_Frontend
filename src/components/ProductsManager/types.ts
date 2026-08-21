import { Measure, Product } from '@/redux/api/provider/types';

export interface ProductsManagerProps {
  providerId: string;
  products: Product[];
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
}
