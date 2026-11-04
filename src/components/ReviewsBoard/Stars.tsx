import { Star } from 'lucide-react';

import styles from './ReviewsBoard.module.css';

/**
 * Five gold stars with half-star support (rating is rounded to the nearest
 * 0.5). Each star is a grey outline with a gold copy clipped on top.
 */
export function Stars({ rating, size = 18, label }: { rating: number; size?: number; label?: string }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span
      className={styles.stars}
      role="img"
      aria-label={label ?? `${rating.toFixed(1)} out of 5 stars`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rounded - i));
        return (
          <span key={i} className={styles.star} style={{ width: size, height: size }}>
            <Star size={size} className={styles.starEmpty} aria-hidden="true" />
            {fill > 0 && (
              <span className={styles.starFillClip} style={{ width: `${fill * 100}%` }}>
                <Star size={size} className={styles.starFull} aria-hidden="true" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
