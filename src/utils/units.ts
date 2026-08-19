/**
 * Product selling units, grouped by what they measure. A store product is
 * priced and stocked per one of these units (e.g. ₹60 / kg, 10 kg in stock).
 */
export type Measure = 'weight' | 'volume' | 'count';

export interface UnitDef {
  value: string; // stored on the product
  label: string; // shown in the picker
  measure: Measure;
}

export const UNIT_GROUPS: { measure: Measure; label: string; units: UnitDef[] }[] = [
  {
    measure: 'weight',
    label: 'By weight — grains, flour, vegetables…',
    units: [
      { value: 'kg', label: 'Kilogram (kg)', measure: 'weight' },
      { value: 'g', label: 'Gram (g)', measure: 'weight' },
      { value: 'quintal', label: 'Quintal (100 kg)', measure: 'weight' },
    ],
  },
  {
    measure: 'volume',
    label: 'By volume — oil, milk, liquids…',
    units: [
      { value: 'litre', label: 'Litre (L)', measure: 'volume' },
      { value: 'ml', label: 'Millilitre (ml)', measure: 'volume' },
    ],
  },
  {
    measure: 'count',
    label: 'By count / pack',
    units: [
      { value: 'piece', label: 'Piece', measure: 'count' },
      { value: 'dozen', label: 'Dozen (12)', measure: 'count' },
      { value: 'pack', label: 'Pack', measure: 'count' },
      { value: 'packet', label: 'Packet', measure: 'count' },
      { value: 'box', label: 'Box', measure: 'count' },
      { value: 'bag', label: 'Bag', measure: 'count' },
      { value: 'bottle', label: 'Bottle', measure: 'count' },
      { value: 'can', label: 'Can', measure: 'count' },
      { value: 'bundle', label: 'Bundle', measure: 'count' },
    ],
  },
];

const ALL_UNITS: UnitDef[] = UNIT_GROUPS.flatMap((g) => g.units);

/** Measure a unit belongs to (defaults to count for legacy/unknown values). */
export function measureOf(unit: string): Measure {
  return ALL_UNITS.find((u) => u.value === unit)?.measure ?? 'count';
}

/** Short display form of a unit, e.g. "L" for litre. */
export function unitShort(unit: string): string {
  if (unit === 'litre') return 'L';
  return unit;
}

/** Stock line for a product: "10 kg in stock", "40 in stock", or "Out of stock". */
export function stockLabel(qty: number, unit: string): string {
  if (qty <= 0) return 'Out of stock';
  return measureOf(unit) === 'count' ? `${qty} in stock` : `${qty} ${unitShort(unit)} in stock`;
}

/** Suggested storefront sections/aisles, used to group products on the store page. */
export const SECTION_SUGGESTIONS = [
  'Grains & Rice',
  'Pulses & Dal',
  'Flour & Atta',
  'Spices & Masala',
  'Oil & Ghee',
  'Dairy',
  'Bakery',
  'Snacks & Namkeen',
  'Beverages',
  'Dry Fruits',
  'Personal Care',
  'Household & Cleaning',
  'Baby Care',
  'Stationery',
];
