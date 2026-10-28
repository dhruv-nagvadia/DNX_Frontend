import { useParams } from 'react-router-dom';

import { AdminShell } from '@/components/AdminShell';
import { AdminUserDetail } from '@/components/AdminUserDetail';

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  if (!userId) return null;

  return (
    <AdminShell>
      <AdminUserDetail userId={userId} />
    </AdminShell>
  );
}
