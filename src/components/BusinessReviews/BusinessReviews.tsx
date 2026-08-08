import { ChevronRight, Star } from 'lucide-react';

import { Card } from '@/components/Card';

import { SAMPLE_REVIEWS } from './mock';
import styles from './BusinessReviews.module.css';

interface BusinessReviewsProps {
  /** Show only the first N reviews (preview). Omit to show all. */
  limit?: number;
  /** When set, renders a "View all" action in the header. */
  onViewAll?: () => void;
}

/** Renders a 5-star row, filling to the nearest half. */
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className={styles.stars} aria-label={`${rating.toFixed(1)} out of 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={size}
          aria-hidden="true"
          className={i < Math.round(rating) ? styles.starOn : styles.starOff}
          fill={i < Math.round(rating) ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  );
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function relativeDate(daysAgo: number): string {
  if (daysAgo < 1) return 'Today';
  if (daysAgo < 7) return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
  if (daysAgo < 30) {
    const w = Math.round(daysAgo / 7);
    return `${w} week${w === 1 ? '' : 's'} ago`;
  }
  const m = Math.round(daysAgo / 30);
  return `${m} month${m === 1 ? '' : 's'} ago`;
}

/** Customer reviews for a business (currently sample data). */
export function BusinessReviews({ limit, onViewAll }: BusinessReviewsProps) {
  const reviews = SAMPLE_REVIEWS;
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  // Count per star level (5 → 1).
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: reviews.filter((r) => r.rating === star).length,
  }));

  const shown = limit ? reviews.slice(0, limit) : reviews;

  return (
    <Card
      title="Reviews"
      subtitle="What customers are saying about this business."
      action={
        onViewAll ? (
          <button type="button" className={styles.viewAll} onClick={onViewAll}>
            View all ({count})
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        ) : undefined
      }
    >
      <div className={styles.summary}>
        <div className={styles.score}>
          <span className={styles.scoreNum}>{avg.toFixed(1)}</span>
          <Stars rating={avg} size={16} />
          <span className={styles.scoreCount}>{count} reviews</span>
        </div>

        <div className={styles.dist}>
          {dist.map(({ star, n }) => (
            <div className={styles.distRow} key={star}>
              <span className={styles.distStar}>
                {star} <Star size={11} fill="currentColor" aria-hidden="true" />
              </span>
              <span className={styles.distTrack}>
                <span
                  className={styles.distFill}
                  style={{ width: `${count ? (n / count) * 100 : 0}%` }}
                />
              </span>
              <span className={styles.distN}>{n}</span>
            </div>
          ))}
        </div>
      </div>

      <ul className={styles.list}>
        {shown.map((r) => (
          <li className={styles.review} key={r.id}>
            <span className={styles.avatar} aria-hidden="true">
              {initialsOf(r.name)}
            </span>
            <div className={styles.reviewBody}>
              <div className={styles.reviewHead}>
                <span className={styles.reviewName}>{r.name}</span>
                <span className={styles.reviewDate}>{relativeDate(r.daysAgo)}</span>
              </div>
              <Stars rating={r.rating} />
              <p className={styles.reviewText}>{r.comment}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className={styles.sample}>
        Showing sample reviews — real customer reviews will appear here once ratings go live.
      </p>
    </Card>
  );
}
