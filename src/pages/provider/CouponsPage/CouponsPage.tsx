import { AppShell } from '@/components/AppShell';
import { CouponsManager } from '@/components/CouponsManager';

import page from './CouponsPage.module.css';

/** Coupons / offers across every business this provider owns — view and manage in one place. */
export default function CouponsPage() {
  return (
    <AppShell>
      <div className={page.header}>
        <h1 className={page.title}>Coupons / Offers</h1>
        <p className={page.subtitle}>Every discount code, across all your businesses.</p>
      </div>

      <CouponsManager />
    </AppShell>
  );
}
