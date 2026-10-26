import { Search, ShieldAlert, Users as UsersIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { AdminCustomer } from '@/redux/api/admin/types';
import { useAdminUsersManager } from './useAdminUsersManager';
import styles from './AdminUsersManager.module.css';

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function noShowTone(count: number): 'neutral' | 'warning' | 'error' {
  if (count >= 3) return 'error';
  if (count > 0) return 'warning';
  return 'neutral';
}

/** Customers sorted worst-no-show-first — search, then open one for the full history. */
export function AdminUsersManager() {
  const navigate = useNavigate();
  const { users, isLoading, query, onQueryChange, onSubmit } = useAdminUsersManager();

  return (
    <Card title="Customers">
      <form className={styles.searchRow} onSubmit={onSubmit}>
        <input
          className={styles.searchInput}
          placeholder="Search by name, email, or phone…"
          value={query}
          onChange={onQueryChange}
        />
      </form>

      {isLoading ? (
        <div className={styles.list}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={60} radius="var(--radius-md)" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={<UsersIcon size={28} strokeWidth={1.6} aria-hidden="true" />}
          title="No customers found"
          description="Try a different search, or check back once customers sign up."
        />
      ) : (
        <div className={styles.list}>
          {users.map((u: AdminCustomer) => (
            <button
              key={u.id}
              type="button"
              className={styles.row}
              onClick={() => navigate(`/admin/users/${u.id}`)}
            >
              <div className={styles.rowMain}>
                <span className={styles.name}>{u.fullName}</span>
                <span className={styles.meta}>
                  {u.email} · {u.phone ?? 'No phone'} · Joined {dateFmt.format(new Date(u.createdAt))}
                </span>
              </div>
              <div className={styles.rowRight}>
                {u.noShowCount > 0 && (
                  <Badge tone={noShowTone(u.noShowCount)} icon={<ShieldAlert size={12} aria-hidden="true" />}>
                    {u.noShowCount} no-show{u.noShowCount === 1 ? '' : 's'}
                  </Badge>
                )}
                {u.codDisabled && <Badge tone="warning">COD disabled</Badge>}
                {u.isBlocked && <Badge tone="error">Blocked</Badge>}
                <Search size={16} aria-hidden="true" />
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
