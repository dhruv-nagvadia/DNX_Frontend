import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarDays, Package } from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { BusinessBookings } from '@/components/BusinessBookings';
import { OrdersManager } from '@/components/OrdersManager';

import styles from './BookingsOrdersPage.module.css';

type Section = 'bookings' | 'orders';

/**
 * Every booking and order across every business this provider owns. Both
 * sections reuse the redesigned per-business tabs in their all-businesses
 * mode (no providerId) — same tiles, status tabs, table and details panel,
 * with each row showing which business it belongs to.
 */
export default function BookingsOrdersPage() {
  // A notification can link here with { section: 'orders' } to open that tab.
  const location = useLocation();
  const requested = (location.state as { section?: Section } | null)?.section;
  const [section, setSection] = useState<Section>(requested ?? 'bookings');
  useEffect(() => {
    if (requested) setSection(requested);
  }, [requested, location.key]);

  return (
    <AppShell>
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.title}>Bookings &amp; Orders</h1>
          <p className={styles.subtitle}>Every booking and order, across all your businesses.</p>
        </div>
        <div className={styles.segment} role="tablist" aria-label="Show bookings or orders">
          <button
            type="button"
            role="tab"
            aria-selected={section === 'bookings'}
            className={`${styles.segmentBtn} ${section === 'bookings' ? styles.segmentActive : ''}`}
            onClick={() => setSection('bookings')}
          >
            <CalendarDays size={16} aria-hidden="true" />
            Bookings
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === 'orders'}
            className={`${styles.segmentBtn} ${section === 'orders' ? styles.segmentActive : ''}`}
            onClick={() => setSection('orders')}
          >
            <Package size={16} aria-hidden="true" />
            Orders
          </button>
        </div>
      </div>

      {section === 'bookings' ? <BusinessBookings /> : <OrdersManager />}
    </AppShell>
  );
}
