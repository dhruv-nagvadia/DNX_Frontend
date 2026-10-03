// A product-level taxonomy entry (e.g. "Bath & Body") — separate from the
// business-level Category/Subcategory. Lets a provider tag what KIND of
// product they're selling, so customers can browse it across every store
// that sells the same kind, not just one store's catalog.
export interface ProductType {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
}
