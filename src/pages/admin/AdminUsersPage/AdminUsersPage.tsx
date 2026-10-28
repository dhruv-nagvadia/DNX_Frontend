import { AdminShell } from '@/components/AdminShell';
import { AdminUsersManager } from '@/components/AdminUsersManager';
import { PageHeader } from '@/components/PageHeader';
import { PlatformSettingsCard } from '@/components/PlatformSettingsCard';

export default function AdminUsersPage() {
  return (
    <AdminShell>
      <PageHeader
        title="Users"
        subtitle="Track repeat no-shows, levy charges, disable Cash on Delivery, or block an account."
      />
      <PlatformSettingsCard />
      <AdminUsersManager />
    </AdminShell>
  );
}
