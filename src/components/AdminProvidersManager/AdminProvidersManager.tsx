import { Search, Store } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { useGetAdminProvidersQuery } from '@/redux/api/admin/adminApi';
import { AdminProviderSummary } from '@/redux/api/admin/types';
// Same list/search styling as the customers screen.
import styles from '@/components/AdminUsersManager/AdminUsersManager.module.css';

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** Provider accounts, blocked ones first — search by name, email, phone or business name. */
export function AdminProvidersManager() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const { data, isLoading } = useGetAdminProvidersQuery(search ? { search } : undefined, {
    refetchOnMountOrArgChange: true,
  });
  const providers = data ?? [];

  return (
    <Card
      title="Providers"
      subtitle="Block a provider or just one of their businesses, or turn Cash on Delivery off for a business."
    >
      <form
        className={styles.searchRow}
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(query.trim());
        }}
      >
        <input
          className={styles.searchInput}
          placeholder="Search by name, email, phone or business…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      {isLoading ? (
        <div className={styles.list}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={60} radius="var(--radius-md)" />
          ))}
        </div>
      ) : providers.length === 0 ? (
        <EmptyState
          icon={<Store size={28} strokeWidth={1.6} aria-hidden="true" />}
          title="No providers found"
          description="Try a different search, or check back once providers add businesses."
        />
      ) : (
        <div className={styles.list}>
          {providers.map((p: AdminProviderSummary) => (
            <button
              key={p.id}
              type="button"
              className={styles.row}
              onClick={() => navigate(`/admin/providers/${p.id}`)}
            >
              <div className={styles.rowMain}>
                <span className={styles.name}>{p.fullName}</span>
                <span className={styles.meta}>
                  {p.email} · {p.phone ?? 'No phone'} · {p.businessCount} business
                  {p.businessCount === 1 ? '' : 'es'} · Joined{' '}
                  {dateFmt.format(new Date(p.createdAt))}
                </span>
              </div>
              <div className={styles.rowRight}>
                {p.isBlocked && <Badge tone="error">Account blocked</Badge>}
                {p.blockedBusinessCount > 0 && (
                  <Badge tone="error">
                    {p.blockedBusinessCount} store{p.blockedBusinessCount === 1 ? '' : 's'} blocked
                  </Badge>
                )}
                {p.codDisabledCount > 0 && (
                  <Badge tone="warning">COD off · {p.codDisabledCount}</Badge>
                )}
                <Search size={16} aria-hidden="true" />
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
