import {
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Store,
  Sun,
  UserRound,
  Wallet,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { useTheme } from '@/hooks/useTheme';
import { AppShellProps } from './types';
import { useAppShell } from './useAppShell';
import styles from './AppShell.module.css';

/** Returns up to two initials for the account avatar. */
function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'DN'
  );
}

const NAV = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/businesses', label: 'Businesses', icon: Store },
  { to: '/earnings', label: 'Earnings', icon: Wallet },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/support', label: 'Support', icon: LifeBuoy },
];

/**
 * Frame shared by every signed-in provider screen: a fixed navy sidebar for
 * app navigation and account controls (collapsible to an icon-only rail), a
 * sticky per-page top bar (back + notifications + profile), an optional
 * section rail, and the light content area. On narrow screens the sidebar
 * becomes a top bar.
 */
export function AppShell({ children, rail, header }: AppShellProps) {
  const { user, logout } = useAppShell();
  const { theme, toggleTheme } = useTheme();
  const { collapsed, toggleCollapsed } = useSidebarCollapsed();
  const name = user?.fullName ?? 'DNX';

  // General screens (dashboard, support, etc.) have no top bar at all — it
  // only appears on pages that supply their own `header` (e.g. a specific
  // business's detail page), with no back button on it either way.
  const topBar = header && (
    <header className={styles.topbar}>
      <div className={styles.headerBox}>{header}</div>
    </header>
  );

  return (
    <div className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ''}`}>
      <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
        <Link className={styles.brand} to="/dashboard">
          <span className={styles.mark} aria-hidden="true">
            D
          </span>
          <span className={styles.wordmark}>
            DNX <span className={styles.wordmarkThin}>Business</span>
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
          <PanelLeftOpen size={16} aria-hidden="true" />
        ) : (
          <PanelLeftClose size={16} aria-hidden="true" />
        )}
      </button>

      {rail ? (
        <div className={styles.withRail}>
          <div className={styles.rail}>{rail}</div>
          <main className={styles.content}>
            {topBar}
            <div className={styles.contentInner}>{children}</div>
          </main>
        </div>
      ) : (
        <main className={styles.content}>
          {topBar}
          <div className={styles.contentInner}>{children}</div>
        </main>
      )}
    </div>
  );
}
