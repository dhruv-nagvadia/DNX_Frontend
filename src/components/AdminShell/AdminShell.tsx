import { LayoutDashboard, LogOut, Ticket } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

// Reuses AppShell's sidebar/content layout classes so the admin console
// looks like part of the same product — only the nav items and copy differ.
import styles from '@/components/AppShell/AppShell.module.css';
import { AdminShellProps } from './types';
import { useAdminShell } from './useAdminShell';

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'AD'
  );
}

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
];

/** Frame shared by every signed-in admin screen. */
export function AdminShell({ children, wide }: AdminShellProps) {
  const { user, logout } = useAdminShell();
  const name = user?.fullName ?? 'Admin';

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} to="/admin/dashboard">
          <span className={styles.mark} aria-hidden="true">
            D
          </span>
          <span className={styles.wordmark}>
            DNX <span className={styles.wordmarkThin}>Admin</span>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Main">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <Icon size={18} aria-hidden="true" />
              <span className={styles.navLabel}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.account}>
          <span className={styles.avatar} aria-hidden="true">
            {initialsOf(name)}
          </span>
          <span className={styles.accountText}>
            <span className={styles.accountName} title={name}>
              {name}
            </span>
            {user?.email && (
              <span className={styles.accountEmail} title={user.email}>
                {user.email}
              </span>
            )}
          </span>
          <button className={styles.logout} onClick={logout} type="button" aria-label="Log out">
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <main className={`${styles.content} ${wide ? styles.contentWide : ''}`}>{children}</main>
    </div>
  );
}
