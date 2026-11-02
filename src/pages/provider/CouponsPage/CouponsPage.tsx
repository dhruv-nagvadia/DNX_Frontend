import { useState } from 'react';
import { Tag, Ticket } from 'lucide-react';

import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/Card';
import { CouponsManager } from '@/components/CouponsManager';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Select } from '@/components/Select';
import { Skeleton } from '@/components/Skeleton';
import { useGetAllCouponsQuery, useGetMyBusinessesQuery } from '@/redux/api/provider/providerApi';
import { Coupon } from '@/redux/api/provider/types';

// Reuses CouponsManager's own table styles (and ServicesManager's shared
// field/status-chip styles, which CouponsManager itself also imports) rather
// than duplicating them for this read-only overview table.
import ui from '@/components/CouponsManager/CouponsManager.module.css';
import styles from '@/components/ServicesManager/ServicesManager.module.css';

const money = (minor: number) => `₹${(minor / 100).toLocaleString('en-IN')}`;

function discountLabel(c: Coupon): string {
  if (c.discountType === 'PERCENT') {
    return `${c.discountValue}% off${c.maxDiscountMinor ? ` (max ${money(c.maxDiscountMinor)})` : ''}`;
  }
  return `${money(c.discountValue)} off`;
}

function eligibilityLabel(c: Coupon): string {
  if (c.scope === 'SERVICE') return `On ${c.service?.name ?? 'a specific service'}`;
  if (c.scope === 'PRODUCT') return `On ${c.product?.name ?? 'a specific product'}`;
  return c.minOrderMinor > 0 ? `Min order ${money(c.minOrderMinor)}` : 'Any order';
}

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const isExpired = (iso?: string | null) => !!iso && new Date(iso).getTime() < Date.now();

/** Every coupon across every business — read-only overview. */
function AllCouponsTable() {
  const { data: coupons = [], isLoading } = useGetAllCouponsQuery();

  if (isLoading) return <Skeleton height={220} radius="var(--radius-xl)" />;

  if (coupons.length === 0) {
    return (
      <EmptyState
        icon={<Ticket size={28} strokeWidth={1.6} aria-hidden="true" />}
        title="No coupons yet"
        description="Pick a business below to create your first discount code."
      />
    );
  }

  return (
    <Card title="All coupons" flush>
      <div className={ui.tableWrap}>
        <table className={ui.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Business</th>
              <th>Discount</th>
              <th>Applies to</th>
              <th>Expires</th>
              <th>Used</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className={!c.isActive ? ui.rowInactive : ''}>
                <td>
                  <div className={ui.rowNameRow}>
                    <span className={ui.code}>{c.code}</span>
                    {c.scope !== 'ORDER' && (
                      <span className={ui.scopeTag}>
                        <Ticket size={11} aria-hidden="true" />
                        {c.scope === 'SERVICE' ? 'Service' : 'Product'}
                      </span>
                    )}
                  </div>
                  {c.description && <div className={ui.cellSub}>{c.description}</div>}
                </td>
                <td className={ui.cellText}>
                  <span className={ui.businessName}>{c.provider?.businessName}</span>
                </td>
                <td>
                  <span className={ui.discount}>
                    <Tag size={13} aria-hidden="true" /> {discountLabel(c)}
                  </span>
                </td>
                <td className={ui.cellText}>{eligibilityLabel(c)}</td>
                <td>
                  {c.expiresAt ? (
                    <span className={`${ui.cellText} ${isExpired(c.expiresAt) ? ui.expired : ''}`}>
                      {isExpired(c.expiresAt) ? 'Expired' : dateFmt.format(new Date(c.expiresAt))}
                    </span>
                  ) : (
                    <span className={ui.cellText}>No expiry</span>
                  )}
                </td>
                <td className={ui.used}>
                  {c.usedCount}
                  {c.usageLimit ? ` / ${c.usageLimit}` : ''}
                </td>
                <td>
                  <span className={`${styles.statusChip} ${c.isActive ? styles.active : styles.inactive}`}>
                    <span className={styles.statusDot} aria-hidden="true" />
                    {c.isActive ? 'Active' : 'Off'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** Coupons / offers across every business this provider owns. */
export default function CouponsPage() {
  const { data: businesses = [], isLoading: loadingBusinesses } = useGetMyBusinessesQuery();
  const [selectedId, setSelectedId] = useState('');
  const selected = businesses.find((b) => b.id === selectedId);

  return (
    <AppShell>
      <PageHeader title="Coupons / Offers" subtitle="Every discount code, across all your businesses." />

      <AllCouponsTable />

      <Card
        title="Manage offers for a business"
        subtitle="Pick a business to add, edit or remove its coupons."
      >
        <div className={styles.field}>
          <label className={styles.label} htmlFor="couponBusiness">
            Business
          </label>
          {loadingBusinesses ? (
            <Skeleton height={40} radius="var(--radius-md)" />
          ) : (
            <Select
              id="couponBusiness"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Select a business…</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.businessName}
                </option>
              ))}
            </Select>
          )}
        </div>
      </Card>

      {selected && (
        <CouponsManager
          providerId={selected.id}
          businessType={selected.type ?? 'SERVICE'}
          services={selected.services}
          products={selected.products}
        />
      )}
    </AppShell>
  );
}
