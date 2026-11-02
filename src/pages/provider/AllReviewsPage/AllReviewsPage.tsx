import { Star } from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { ReviewItem, Stars } from '@/components/BusinessReviews';
import { Skeleton } from '@/components/Skeleton';
import { useGetAllReviewsQuery } from '@/redux/api/provider/providerApi';

// Reuses BusinessReviews's own summary/list styles rather than duplicating
// ~15 classes — this page's markup mirrors its full (non-compact) layout.
import styles from '@/components/BusinessReviews/BusinessReviews.module.css';

/** Every review across every business this provider owns. */
export default function AllReviewsPage() {
  const { data: reviews = [], isLoading } = useGetAllReviewsQuery();

  const count = reviews.length;
  const avg = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <AppShell>
      <PageHeader title="Reviews" subtitle="Every customer review, across all your businesses." />

      {isLoading ? (
        <Skeleton height={280} radius="var(--radius-xl)" />
      ) : (
        <Card>
          {count === 0 ? (
            <p className={styles.empty}>No reviews yet.</p>
          ) : (
            <>
              <div className={styles.summaryWide}>
                <div className={styles.score}>
                  <span className={styles.scoreNum}>{avg.toFixed(1)}</span>
                  <Stars rating={avg} size={16} />
                  <span className={styles.scoreCount}>
                    {count} review{count === 1 ? '' : 's'}
                  </span>
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
                {reviews.map((r) => (
                  <ReviewItem key={r.id} providerId={r.provider!.id} review={r} compact={false} />
                ))}
              </ul>
            </>
          )}
        </Card>
      )}
    </AppShell>
  );
}
