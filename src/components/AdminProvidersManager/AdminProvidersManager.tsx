import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Banknote,
  CheckCircle2,
  Search,
  Store,
  Users,
} from 'lucide-react';
import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { EmptyState } from '@/components/EmptyState';
import { Pill } from '@/components/Pill';
import { Skeleton } from '@/components/Skeleton';
import { useGetAdminProvidersQuery } from '@/redux/api/admin/adminApi';
import { AdminProviderSummary } from '@/redux/api/admin/types';
import styles from './AdminProvidersManager.module.css';

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

type StatusFilter = 'all' | 'active' | 'blocked' | 'restricted';

const isRestricted = (p: AdminProviderSummary) =>
  !p.isBlocked && (p.blockedBusinessCount > 0 || p.codDisabledCount > 0);

const matches = (p: AdminProviderSummary, f: StatusFilter) =>
  f === 'all'
    ? true
    : f === 'blocked'
      ? p.isBlocked
      : f === 'restricted'
        ? isRestricted(p)
        : !p.isBlocked && !isRestricted(p);

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

function SummaryTile({
  tone,
  icon,
  label,
  value,
}: {
  tone: 'blue' | 'mint' | 'peach' | 'pink';
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className={`${styles.tile} ${styles[`tile_${tone}`]}`}>
      <span className={styles.tileIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={styles.tileText}>
        <span className={styles.tileLabel}>{label}</span>
        <span className={styles.tileValue}>{value}</span>
      </div>
    </div>
  );
}

/** Provider accounts, blocked ones first — search by name, email, phone or business name. */
export function AdminProvidersManager() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const { data, isLoading } = useGetAdminProvidersQuery(search ? { search } : undefined, {
    refetchOnMountOrArgChange: true,
  });
  const providers = data ?? [];

  const counts: Record<StatusFilter, number> = {
    all: providers.length,
    active: providers.filter((p) => matches(p, 'active')).length,
    blocked: providers.filter((p) => matches(p, 'blocked')).length,
    restricted: providers.filter((p) => matches(p, 'restricted')).length,
  };
  const visible = providers.filter((p) => matches(p, filter));
  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'restricted', label: 'Restricted' },
    { key: 'blocked', label: 'Blocked' },
  ];
  const open = (id: string) => navigate(`/admin/providers/${id}`);

  return (
    <div className={styles.root}>
      <div className={styles.tiles}>
        <SummaryTile
          tone="blue"
          icon={<Users size={20} />}
          label="Total providers"
          value={counts.all}
        />
        <SummaryTile
          tone="mint"
          icon={<CheckCircle2 size={20} />}
          label="In good standing"
          value={counts.active}
        />
        <SummaryTile
          tone="peach"
          icon={<AlertTriangle size={20} />}
          label="Restricted"
          value={counts.restricted}
        />
        <SummaryTile
          tone="pink"
          icon={<Ban size={20} />}
          label="Blocked accounts"
          value={counts.blocked}
        />
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs} role="group" aria-label="Filter providers by status">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${styles.tab} ${filter === t.key ? styles.tabActive : ''}`}
              aria-pressed={filter === t.key}
              onClick={() => setFilter(t.key)}
            >
              {t.label}
              <span className={styles.tabCount}>{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <form
          className={styles.searchForm}
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(query.trim());
          }}
        >
          <label className={styles.search}>
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by name, email, phone or business…"
              aria-label="Search providers"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </form>
      </div>

      <section className={styles.tableCard} aria-label="Providers">
        {isLoading ? (
          <div className={styles.loading} aria-busy="true" aria-label="Loading providers">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={52} radius="var(--m-radius-box)" />
            ))}
          </div>
        ) : providers.length === 0 ? (
          <EmptyState
            icon={<Store size={28} strokeWidth={1.6} aria-hidden="true" />}
            title="No providers found"
            description="Try a different search, or check back once providers add businesses."
          />
        ) : visible.length === 0 ? (
          <p className={styles.noMatch}>No providers match this filter.</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Provider</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Businesses</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className={styles.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr
                    key={p.id}
                    className={`${styles.row} ${p.isBlocked ? styles.rowBlocked : ''}`}
                    onClick={() => open(p.id)}
                  >
                    <td>
                      <div className={styles.who}>
                        <span className={styles.avatar} aria-hidden="true">
                          {initialsOf(p.fullName)}
                        </span>
                        <div className={styles.whoText}>
                          <span className={styles.name}>{p.fullName}</span>
                          <span className={styles.email}>{p.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.muted}>{p.phone ?? 'No phone'}</td>
                    <td>
                      <span className={styles.bizCount}>
                        <Store size={15} aria-hidden="true" />
                        {p.businessCount}
                      </span>
                    </td>
                    <td className={styles.muted}>{dateFmt.format(new Date(p.createdAt))}</td>
                    <td>
                      <div className={styles.pills}>
                        {p.isBlocked ? (
                          <Pill tone="red">
                            <Ban size={13} aria-hidden="true" />
                            Account blocked
                          </Pill>
                        ) : (
                          !isRestricted(p) && (
                            <Pill tone="green">
                              <CheckCircle2 size={13} aria-hidden="true" />
                              Active
                            </Pill>
                          )
                        )}
                        {p.blockedBusinessCount > 0 && (
                          <Pill tone="orange">
                            {p.blockedBusinessCount} store{p.blockedBusinessCount === 1 ? '' : 's'}{' '}
                            blocked
                          </Pill>
                        )}
                        {p.codDisabledCount > 0 && (
                          <Pill tone="yellow">
                            <Banknote size={13} aria-hidden="true" />
                            COD off · {p.codDisabledCount}
                          </Pill>
                        )}
                      </div>
                    </td>
                    <td className={styles.actionCell}>
                      <button
                        type="button"
                        className={styles.view}
                        onClick={(e) => {
                          e.stopPropagation();
                          open(p.id);
                        }}
                        aria-label={`View ${p.fullName}`}
                      >
                        View
                        <ArrowRight size={15} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
