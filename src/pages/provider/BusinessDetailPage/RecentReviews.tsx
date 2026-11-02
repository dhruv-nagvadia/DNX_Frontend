import { ArrowRight, MessageSquare, Star } from 'lucide-react';

import { ModernCard, ModernCardLink } from '@/components/ModernCard';
import { Skeleton } from '@/components/Skeleton';
import { useGetBusinessReviewsQuery } from '@/redux/api/provider/providerApi';

import styles from './BusinessDetailPage.module.css';

const AVATAR_CLASSES = [styles.reviewAvatarBlue, styles.reviewAvatarLavender];

function relativeDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return 'Today';
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (days < 30) {
    const w = Math.round(days / 7);
    return `${w} week${w === 1 ? '' : 's'} ago`;
  }
  const m = Math.round(days / 30);
  return `${m} month${m === 1 ? '' : 's'} ago`;
}

/** Five stars with half-star support (4.5 → four full + one half). */
function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.reviewStars} aria-label={`${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const full = rating >= n - 0.25;
        const half = !full && rating >= n - 0.75;
        return (
          <span key={n} className={styles.reviewStar}>
            <Star size={16} aria-hidden="true" className={styles.starOff} fill="currentColor" />
            {(full || half) && (
              <span className={styles.starFillClip} style={{ width: full ? '100%' : '50%' }}>
                <Star size={16} aria-hidden="true" className={styles.starOn} fill="currentColor" />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/** Overview preview of the newest reviews (mockup: "Reviews (Recent)").
 * Replying lives on the full Reviews page ("View All Reviews"). */
export function RecentReviews({
  providerId,
  limit = 2,
  onViewAll,
}: {
  providerId: string;
  limit?: number;
  onViewAll: () => void;
}) {
  const { data: reviews = [], isLoading } = useGetBusinessReviewsQuery(providerId);
  const recent = [...reviews]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);

  return (
    <ModernCard
      icon={<Star size={22} aria-hidden="true" />}
      iconTone="ink"
      title="Reviews"
      suffix="(Recent)"
      action={
        reviews.length > 0 ? (
          <ModernCardLink onClick={onViewAll} iconRight={<ArrowRight size={15} aria-hidden="true" />}>
            View All Reviews
          </ModernCardLink>
        ) : undefined
      }
    >
      {isLoading ? (
        <Skeleton height={140} radius="var(--m-radius-box)" />
      ) : recent.length === 0 ? (
        <p className={styles.reviewEmpty}>
          <MessageSquare size={18} aria-hidden="true" />
          No reviews yet. They'll show up here once customers rate you.
        </p>
      ) : (
        <ul className={styles.reviewList}>
          {recent.map((r, i) => (
            <li key={r.id} className={styles.reviewRow}>
              <span className={`${styles.reviewAvatar} ${AVATAR_CLASSES[i % AVATAR_CLASSES.length]}`} aria-hidden="true">
                {r.user.fullName.trim()[0]?.toUpperCase() ?? '?'}
              </span>
              <div className={styles.reviewMain}>
                <span className={styles.reviewName}>{r.user.fullName}</span>
                <span className={styles.reviewMeta}>
                  <Stars rating={r.rating} />
                  <span>• {relativeDate(r.createdAt)}</span>
                </span>
                {r.comment && <p className={styles.reviewText}>{r.comment}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </ModernCard>
  );
}
