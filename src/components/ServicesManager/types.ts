import { Service } from '@/redux/api/provider/types';

export interface ServicesManagerProps {
  providerId: string;
  services: Service[];
}

export interface ServiceForm {
  name: string;
  description: string;
  price: string;
  hours: string;
  minutes: string;
}
