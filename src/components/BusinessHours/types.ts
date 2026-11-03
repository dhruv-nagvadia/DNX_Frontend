import { BusinessHour } from '@/redux/api/provider/types';

export interface BusinessHoursProps {
  providerId: string;
  hours: BusinessHour[];
  /** Shown in the Customer Preview card (falls back to "Your business"). */
  businessName?: string;
  /** Cover photo URL for the Customer Preview thumbnail. */
  coverImage?: string | null;
  /** Switches the page to the Calendar tab (date-specific hours). */
  onOpenCalendar?: () => void;
}
