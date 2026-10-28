import { AdminShell } from '@/components/AdminShell';
import { AdminTransactions } from '@/components/AdminTransactions';
import { PageHeader } from '@/components/PageHeader';

/** Every booking and order, with how it was paid and what each side gets — filterable down to one business or service. */
export default function AdminTransactionsPage() {
  return (
    <AdminShell>
      <PageHeader
        title="Transactions"
        subtitle="Every booking and order — online, cash on delivery and partial — with the commission and what you still owe each provider."
      />
      <AdminTransactions />
    </AdminShell>
  );
}
