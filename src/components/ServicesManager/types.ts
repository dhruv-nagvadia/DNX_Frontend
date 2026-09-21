import { Service } from '@/redux/api/provider/types';

export interface ServicesManagerProps {
  providerId: string;
  services: Service[];
  /** Used to look up common-service suggestions for this business's type. */
  subcategorySlug?: string;
}

export interface ServiceForm {
  name: string;
  description: string;
  price: string;
  hours: string;
  minutes: string;
  // On-location service (provider travels to the customer) — off by default.
  travelRequired: boolean;
  travelBaseFee: string;
  travelPerKm: string;
}
