import { AdminShell } from '@/components/AdminShell';
import { BusinessCommissionRates } from '@/components/BusinessCommissionRates';
import { CommissionSettingsCard } from '@/components/CommissionSettingsCard';
import { FinanceOverview } from '@/components/FinanceOverview';
import { PageHeader } from '@/components/PageHeader';
import { ProviderBalances } from '@/components/ProviderBalances';

/** Where the money is managed: set the commission, see what the platform earned, and settle with providers. */
export default function AdminFinancePage() {
  return (
    <AdminShell wide>
      <PageHeader
        title="Finance"
        subtitle="Set your commission, track what the platform earns, and keep providers' payouts straight."
      />
      <FinanceOverview />
      <CommissionSettingsCard />
      <BusinessCommissionRates />
      <ProviderBalances />
    </AdminShell>
  );
}
