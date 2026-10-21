import { AdminProvidersManager } from '@/components/AdminProvidersManager';
import { AdminShell } from '@/components/AdminShell';
import { PageHeader } from '@/components/PageHeader';

export default function AdminProvidersPage() {
  return (
    <AdminShell wide>
      <PageHeader
        title="Providers"
        subtitle="Block a provider (or one business) if payments are late or customers complain, or turn Cash on Delivery off for a business."
      />
      <AdminProvidersManager />
    </AdminShell>
  );
}
