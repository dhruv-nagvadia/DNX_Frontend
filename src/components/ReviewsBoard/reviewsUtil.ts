import { BusinessReview, OwnerProductReview } from '@/redux/api/provider/types';

/** One row of the board — a business review or a product review, normalised. */
export interface BoardReview {
  /** `b:<id>` / `p:<id>` so the two id spaces never collide as React keys. */
  key: string;
  kind: 'business' | 'product';
  id: string;
  rating: number;
  comment: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
  customer: string;
  businessId: string;
  businessName: string;
  product: { id: string; name: string; imageUrl: string | null } | null;
}

export function fromBusinessReview(r: BusinessReview): BoardReview {
  return {
    key: `b:${r.id}`,
    kind: 'business',
    id: r.id,
    rating: r.rating,
    comment: r.comment ?? '',
    reply: r.providerReply ?? null,
    repliedAt: r.repliedAt ?? null,
    createdAt: r.createdAt,
    customer: r.user?.fullName || 'Customer',
    businessId: r.provider?.id ?? '',
    businessName: r.provider?.businessName ?? '',
    product: null,
  };
}

export function fromProductReview(r: OwnerProductReview): BoardReview {
  return {
    key: `p:${r.id}`,
    kind: 'product',
    id: r.id,
    rating: r.rating,
    comment: r.comment ?? '',
    reply: r.providerReply ?? null,
    repliedAt: r.repliedAt ?? null,
    createdAt: r.createdAt,
    customer: r.user?.fullName || 'Customer',
    businessId: r.product.provider.id,
    businessName: r.product.provider.businessName,
    product: { id: r.product.id, name: r.product.name, imageUrl: r.product.imageUrl ?? null },
  };
}

export const TONES = ['lavender', 'blue', 'green', 'orange', 'teal', 'red', 'yellow'] as const;
export type Tone = (typeof TONES)[number];

/** Deterministic pastel tone for a string (business id, customer name). */
export function toneFor(seed: string): Tone {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return TONES[hash % TONES.length];
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** "just now", "2 hours ago", "yesterday", "3 days ago", "2 months ago"… */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 45) return 'just now';
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), 'day');
  if (abs < 86400 * 365) return rtf.format(Math.round(diffSec / (86400 * 30)), 'month');
  return rtf.format(Math.round(diffSec / (86400 * 365)), 'year');
}

export function initialOf(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? '?';
}

export function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'DN'
  );
}

/** Reviews created in the current / previous calendar month (local time). */
export function monthCounts(reviews: BoardReview[]): { thisMonth: number; lastMonth: number } {
  const now = new Date();
  const thisStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  let thisMonth = 0;
  let lastMonth = 0;
  for (const r of reviews) {
    const t = new Date(r.createdAt).getTime();
    if (t >= thisStart) thisMonth++;
    else if (t >= lastStart) lastMonth++;
  }
  return { thisMonth, lastMonth };
}

export type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest';
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest', label: 'Highest' },
  { value: 'lowest', label: 'Lowest' },
];

export function sortReviews(list: BoardReview[], sort: SortKey): BoardReview[] {
  const time = (r: BoardReview) => new Date(r.createdAt).getTime();
  const out = [...list];
  switch (sort) {
    case 'oldest':
      return out.sort((a, b) => time(a) - time(b));
    case 'highest':
      return out.sort((a, b) => b.rating - a.rating || time(b) - time(a));
    case 'lowest':
      return out.sort((a, b) => a.rating - b.rating || time(b) - time(a));
    default:
      return out.sort((a, b) => time(b) - time(a));
  }
}
