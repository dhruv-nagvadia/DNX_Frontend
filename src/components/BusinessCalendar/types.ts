import { BusinessHour } from '@/redux/api/provider/types';

export interface BusinessCalendarProps {
  providerId: string;
  /** Weekly hours, used as the default schedule when a date has no override. */
  businessHours: BusinessHour[];
}
