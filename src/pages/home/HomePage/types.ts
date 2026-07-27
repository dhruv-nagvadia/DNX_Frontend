import { Category } from '@/redux/api/category/types';

export interface HomePageState {
  userName: string;
  categories: Category[];
  isLoading: boolean;
  onCategoryClick: (category: Category) => void;
}
