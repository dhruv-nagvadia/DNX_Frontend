import { Category } from '@/redux/api/category/types';

export interface HomePageState {
  /** Signed-in user's name, or null for a signed-out visitor. */
  userName: string | null;
  /** Where "List your business" goes: the business list when signed in, else sign-up. */
  listBusinessHref: string;
  categories: Category[];
  isLoading: boolean;
  onCategoryClick: (category: Category) => void;
}
