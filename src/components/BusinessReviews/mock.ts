export interface SampleReview {
  id: string;
  name: string;
  rating: number;
  daysAgo: number;
  comment: string;
}

/**
 * Placeholder reviews until a reviews API exists. Swap this for a
 * `useGetBusinessReviewsQuery(providerId)` call — the component reads the same
 * shape.
 */
export const SAMPLE_REVIEWS: SampleReview[] = [
  {
    id: 'r1',
    name: 'Aarav Sharma',
    rating: 5,
    daysAgo: 2,
    comment: 'Fantastic experience from start to finish. Staff were friendly and the booking was right on time.',
  },
  {
    id: 'r2',
    name: 'Priya Nair',
    rating: 5,
    daysAgo: 6,
    comment: 'Really professional service and spotless place. Booking through the app was effortless.',
  },
  {
    id: 'r3',
    name: 'Rohan Mehta',
    rating: 4,
    daysAgo: 12,
    comment: 'Good value and quick service. Had to wait a few minutes past my slot but overall happy.',
  },
  {
    id: 'r4',
    name: 'Ishita Verma',
    rating: 5,
    daysAgo: 21,
    comment: 'Highly recommend. Attention to detail was excellent and I will definitely be back.',
  },
  {
    id: 'r5',
    name: 'Karan Patel',
    rating: 4,
    daysAgo: 34,
    comment: 'Solid experience. Friendly team and easy to reschedule when my plans changed.',
  },
];
