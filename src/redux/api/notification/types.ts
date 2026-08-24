export type NotificationType =
  | 'ORDER_PLACED'
  | 'ORDER_STATUS'
  | 'ORDER_CANCELLED'
  | 'BOOKING_PLACED'
  | 'BOOKING_STATUS'
  | 'BOOKING_CANCELLED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType: 'ORDER' | 'BOOKING' | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}
