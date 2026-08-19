import { Product } from '@/redux/api/provider/types';

export interface ProductsManagerProps {
  providerId: string;
  products: Product[];
}

export interface ProductForm {
  name: string;
  price: string;
  unit: string;
  section: string;
  stockQty: string;
  imageUrl: string;
  description: string;
}
