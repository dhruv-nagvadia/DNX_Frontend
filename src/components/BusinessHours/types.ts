import { BusinessHour } from '@/redux/api/provider/types';

export interface BusinessHoursProps {
  providerId: string;
  hours: BusinessHour[];
  /** Overrides the card subtitle (e.g. for stores, which take pickup orders, not bookings). */
  subtitle?: string;
}
