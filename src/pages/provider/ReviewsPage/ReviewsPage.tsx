import { ArrowLeft } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { AppShell } from '@/components/AppShell';
import { BusinessReviews } from '@/components/BusinessReviews';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { useGetMyBusinessQuery } from '@/redux/api/provider/providerApi';

import styles from './ReviewsPage.module.css';

/** Full list of a business's reviews (opened from the Overview "View all"). */
export default function ReviewsPage() {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data: business, isLoading, error } = useGetMyBusinessQuery(id, { skip: !id });

  const notFound = !!error && (error as { status?: number }).status === 404;
  if (notFound) return <Navigate to="/businesses" replace />;

  return (
    <AppShell>
      <button type="button" className={styles.back} onClick={() => navigate(`/businesses/${id}`)}>
        <ArrowLeft size={16} aria-hidden="true" />
        Back to business
      </button>

      {isLoading || !business ? (
        <>
          <Skeleton width="40%" height={30} />
          <Skeleton height={320} radius="var(--radius-xl)" />
        </>
      ) : (
        <>
          <PageHeader
            eyebrow={business.businessName}
            title="All reviews"
            subtitle="Everything customers have said about this business."
          />
          <BusinessReviews />
        </>
      )}
    </AppShell>
  );
}
