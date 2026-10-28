import { Navigate, useParams } from 'react-router-dom';

import { AppShell } from '@/components/AppShell';
import { BusinessReviews } from '@/components/BusinessReviews';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { useGetMyBusinessQuery } from '@/redux/api/provider/providerApi';

import styles from './ReviewsPage.module.css';

/** Full list of a business's reviews (opened from the Overview "View all"). */
export default function ReviewsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: business, isLoading, error } = useGetMyBusinessQuery(id, { skip: !id });

  const notFound = !!error && (error as { status?: number }).status === 404;
  if (notFound) return <Navigate to="/businesses" replace />;

  return (
    <AppShell>
      {isLoading || !business ? (
        <>
          <Skeleton width="40%" height={30} />
          <Skeleton height={320} radius="var(--radius-xl)" />
        </>
      ) : (
        <div className={styles.page}>
          <PageHeader
            eyebrow="Reviews"
            title={business.businessName}
            subtitle="Everything customers have said about this business."
          />
          <BusinessReviews providerId={id} />
        </div>
      )}
    </AppShell>
  );
}
