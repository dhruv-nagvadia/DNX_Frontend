export type RangePreset = 'today' | '7d' | '30d' | 'month' | 'all';

export const RANGE_PRESETS: { id: RangePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
];

/** YYYY-MM-DD in the browser's local calendar (India for this product's users). */
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Inclusive from/to days for a preset; both undefined means "no limit". */
export function rangeFor(preset: RangePreset): { from?: string; to?: string } {
  const today = new Date();
  switch (preset) {
    case 'today':
      return { from: ymd(today), to: ymd(today) };
    case '7d': {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from: ymd(from), to: ymd(today) };
    }
    case '30d': {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from: ymd(from), to: ymd(today) };
    }
    case 'month':
      return { from: ymd(new Date(today.getFullYear(), today.getMonth(), 1)), to: ymd(today) };
    default:
      return {};
  }
}
