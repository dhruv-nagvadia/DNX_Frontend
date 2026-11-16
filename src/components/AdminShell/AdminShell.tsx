import {
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  LogOut,
  Moon,
  Receipt,
  Store,
  Sun,
  Ticket,
  Users,
  Wallet,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { LogoMark } from '@/components/AppShell/AppShell';

// Reuses AppShell's sidebar/content layout classes so the admin console
// looks like part of the same product — only the nav items and copy differ.
import styles from '@/components/AppShell/AppShell.module.css';
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { useTheme } from '@/hooks/useTheme';
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
  { to: '/admin/transactions', label: 'Transactions', icon: Receipt },
  { to: '/admin/finance', label: 'Finance', icon: Wallet },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/providers', label: 'Providers', icon: Store },
  { to: '/admin/users', label: 'Users', icon: Users },
];

/** Frame shared by every signed-in admin screen. */
export function AdminShell({ children }: AdminShellProps) {
  const { user, logout } = useAdminShell();
  const { theme, toggleTheme } = useTheme();
  const { collapsed, toggleCollapsed } = useSidebarCollapsed();
  const name = user?.fullName ?? 'Admin';

  return (
    <div className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ''}`}>
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
        <span className={styles.sidebarBg} aria-hidden="true" />
        <Link className={styles.brand} to="/admin/dashboard">
          <LogoMark className={styles.logo} />
          <span className={styles.brandText}>
            <span className={styles.wordmark}>DNX Marketplace</span>
            <span className={styles.wordmarkSub}>Admin Console</span>
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
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
              data-tooltip={label}
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
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            type="button"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun size={16} aria-hidden="true" />
            ) : (
              <Moon size={16} aria-hidden="true" />
            )}
          </button>
          <button className={styles.logout} onClick={logout} type="button" aria-label="Log out">
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <button
        type="button"
        className={`${styles.collapseToggle} ${collapsed ? styles.collapseToggleCollapsed : ''}`}
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronsRight size={16} strokeWidth={2.25} aria-hidden="true" />
        ) : (
          <ChevronsLeft size={16} strokeWidth={2.25} aria-hidden="true" />
        )}
      </button>

      <main className={styles.content}>
        <div className={styles.contentInner}>{children}</div>
      </main>
    </div>
  );
}
