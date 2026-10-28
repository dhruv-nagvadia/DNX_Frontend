import { useParams } from 'react-router-dom';

import { AdminProviderDetail } from '@/components/AdminProviderDetail';
import { AdminShell } from '@/components/AdminShell';

export default function AdminProviderDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  if (!userId) return null;

  return (
    <AdminShell>
      <AdminProviderDetail userId={userId} />
    </AdminShell>
  );
}
