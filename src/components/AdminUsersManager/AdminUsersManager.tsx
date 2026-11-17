import { ReactNode, useMemo, useState } from 'react';
import { ChevronRight, Ban, Search, ShieldAlert, Users as UsersIcon, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { EmptyState } from '@/components/EmptyState';
import { Pill } from '@/components/Pill';
import { Skeleton } from '@/components/Skeleton';
import { AdminCustomer } from '@/redux/api/admin/types';
import { useAdminUsersManager } from './useAdminUsersManager';
import ui from './AdminUsersList.module.css';

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

type Filter = 'all' | 'noShows' | 'cod' | 'blocked';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'noShows', label: 'With no-shows' },
  { id: 'cod', label: 'COD disabled' },
  { id: 'blocked', label: 'Blocked' },
];

const matches = (u: AdminCustomer, f: Filter) =>
  f === 'all' ||
  (f === 'noShows' && u.noShowCount > 0) ||
  (f === 'cod' && u.codDisabled) ||
  (f === 'blocked' && u.isBlocked);

function noShowTone(count: number): 'grey' | 'orange' | 'red' {
  if (count >= 3) return 'red';
  if (count > 0) return 'orange';
  return 'grey';
}

const AVATAR_TONES = ['lavender', 'blue', 'green', 'orange', 'teal'] as const;
/** Deterministic avatar colour per customer so the list stays scannable. */
function avatarTone(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return ui[`avatar_${AVATAR_TONES[hash % AVATAR_TONES.length]}`];
}

const initial = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

function SummaryTile({
  tone,
  icon,
  label,
  value,
}: {
  tone: 'blue' | 'peach' | 'lavender' | 'pink';
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className={`${ui.tile} ${ui[`tile_${tone}`]}`}>
      <span className={ui.tileIcon} aria-hidden="true">
        {icon}
      </span>
      <div className={ui.tileText}>
        <span className={ui.tileLabel}>{label}</span>
        <span className={ui.tileValue}>{value}</span>
      </div>
    </div>
  );
}

/** Customers sorted worst-no-show-first — search, then open one for the full history. */
export function AdminUsersManager() {
  const navigate = useNavigate();
  const { users, isLoading, query, onQueryChange, onSubmit } = useAdminUsersManager();
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(
    () => ({
      all: users.length,
      noShows: users.filter((u) => u.noShowCount > 0).length,
      cod: users.filter((u) => u.codDisabled).length,
      blocked: users.filter((u) => u.isBlocked).length,
    }),
    [users],
  );
  const visible = useMemo(() => users.filter((u) => matches(u, filter)), [users, filter]);
  const open = (id: string) => navigate(`/admin/users/${id}`);

  return (
    <div className={ui.root}>
      <div className={ui.tiles}>
        <SummaryTile tone="blue" icon={<UsersIcon size={20} />} label="Customers" value={counts.all} />
        <SummaryTile
          tone="peach"
          icon={<ShieldAlert size={20} />}
          label="With no-shows"
          value={counts.noShows}
        />
        <SummaryTile
          tone="lavender"
          icon={<WalletCards size={20} />}
          label="COD disabled"
          value={counts.cod}
        />
        <SummaryTile tone="pink" icon={<Ban size={20} />} label="Blocked" value={counts.blocked} />
      </div>

      <section className={ui.card} aria-labelledby="customersTitle">
        <header className={ui.cardHead}>
          <h2 id="customersTitle" className={ui.cardTitle}>
            Customers
          </h2>
          <span className={ui.cardSuffix}>Sorted by most no-shows</span>
        </header>

        <div className={ui.toolbar}>
          <form className={ui.searchForm} onSubmit={onSubmit} role="search">
            <label className={ui.search}>
              <Search size={18} aria-hidden="true" />
              <span className={ui.srOnly}>Search customers</span>
              <input
                type="search"
                placeholder="Search by name, email, or phone…"
                value={query}
                onChange={onQueryChange}
              />
            </label>
          </form>
          <div className={ui.filters} role="group" aria-label="Filter customers">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`${ui.filterPill} ${filter === f.id ? ui.filterPillOn : ''}`}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                <span className={ui.filterCount}>{counts[f.id]}</span>
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className={ui.skeletons}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={52} radius="var(--m-radius-box)" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={<UsersIcon size={28} strokeWidth={1.6} aria-hidden="true" />}
            title="No customers found"
            description={
              users.length === 0
                ? 'Try a different search, or check back once customers sign up.'
                : 'No customers match this filter.'
            }
          />
        ) : (
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th scope="col">Customer</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Joined</th>
                  <th scope="col">No-shows</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className={ui.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => (
                  <tr key={u.id} className={ui.row} onClick={() => open(u.id)}>
                    <td>
                      <div className={ui.person}>
                        <span className={`${ui.avatar} ${avatarTone(u.id)}`} aria-hidden="true">
                          {initial(u.fullName)}
                        </span>
                        <div className={ui.personText}>
                          <span className={ui.name}>{u.fullName}</span>
                          <span className={ui.sub}>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className={ui.nowrap}>
                      {u.phone ?? <span className={ui.sub}>No phone</span>}
                    </td>
                    <td className={ui.nowrap}>{dateFmt.format(new Date(u.createdAt))}</td>
                    <td>
                      <Pill tone={noShowTone(u.noShowCount)}>
                        {u.noShowCount > 0 && <ShieldAlert size={12} aria-hidden="true" />}
                        {u.noShowCount} no-show{u.noShowCount === 1 ? '' : 's'}
                      </Pill>
                    </td>
                    <td>
                      <div className={ui.pills}>
                        {u.isBlocked ? <Pill tone="red">Blocked</Pill> : <Pill tone="green">Active</Pill>}
                        {u.codDisabled && <Pill tone="yellow">COD disabled</Pill>}
                      </div>
                    </td>
                    <td className={ui.actionsCell}>
                      <button
                        type="button"
                        className={ui.viewBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          open(u.id);
                        }}
                        aria-label={`View ${u.fullName}`}
                      >
                        View
                        <ChevronRight size={16} aria-hidden="true" />
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
