export interface Subcategory {
  id: string;
  slug: string;
  name: string;
  categoryId?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  sortOrder: number;
  subcategories: Subcategory[];
}
