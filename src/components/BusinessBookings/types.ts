export interface BusinessBookingsProps {
  /** The business (provider) id whose bookings to show. Omit to show every
   * booking across all of the owner's businesses (global Bookings & Orders
   * page) — each row then shows its business name. */
  providerId?: string;
}
