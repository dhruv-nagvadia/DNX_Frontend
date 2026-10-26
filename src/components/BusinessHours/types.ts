import { BusinessHour } from '@/redux/api/provider/types';

export interface BusinessHoursProps {
  providerId: string;
  hours: BusinessHour[];
}
