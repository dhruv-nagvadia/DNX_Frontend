import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { ReviewsBoard } from '@/components/ReviewsBoard';
import { useGetMyBusinessQuery } from '@/redux/api/provider/providerApi';

/**
 * A single business's reviews (opened from the business Overview "View all").
 * Same board as /reviews, scoped to this business; the top-bar picker
 * navigates to another business's reviews, or to /reviews for "All businesses".
 */
export default function ReviewsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Only used to bounce unknown / foreign business ids back to the list.
  const { error } = useGetMyBusinessQuery(id, { skip: !id });

  const notFound = !!error && (error as { status?: number }).status === 404;
  if (!id || notFound) return <Navigate to="/businesses" replace />;

  return (
    <ReviewsBoard
      key={id}
      lockedBusinessId={id}
      onBusinessChange={(next) => navigate(next ? `/businesses/${next}/reviews` : '/reviews')}
    />
  );
}
