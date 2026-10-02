import { AdminShell } from '@/components/AdminShell';
import { PageHeader } from '@/components/PageHeader';
import { PlatformCouponsManager } from '@/components/PlatformCouponsManager';

export default function AdminCouponsPage() {
  return (
    <AdminShell wide>
      <PageHeader
        title="Coupons"
        subtitle="Create and manage platform-wide discount codes, usable across any business."
      />
      <PlatformCouponsManager />
    </AdminShell>
  );
}
