import {
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  Home,
  LogOut,
  Moon,
  Star,
  Store,
  Sun,
  Tag,
  User,
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

type NavEntry = { to: string; label: string; icon: typeof Home };

/** Primary workspace links (above the divider). */
const NAV_MAIN: NavEntry[] = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/businesses', label: 'My Businesses', icon: Store },
  { to: '/bookings-orders', label: 'Bookings & Orders', icon: CalendarDays },
  { to: '/coupons', label: 'Coupons / Offers', icon: Tag },
  { to: '/reviews', label: 'Reviews', icon: Star },
  { to: '/earnings', label: 'Earnings', icon: Wallet },
];

/** Account link, below the divider. */
const NAV_ACCOUNT: NavEntry = { to: '/profile', label: 'Account / Profile', icon: User };

/** Help link, set apart with extra space above it. */
const NAV_HELP: NavEntry = { to: '/support', label: 'Help & Support', icon: CircleHelp };

/** DNX brand mark — a person (round head + X body) in bright blue. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 53" aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth="12.5" strokeLinecap="round">
        <line x1="9" y1="12" x2="51" y2="44" />
        <line x1="51" y1="12" x2="9" y2="44" />
      </g>
      <circle cx="31" cy="9.5" r="9" fill="currentColor" />
    </svg>
  );
}

/**
 * Frame shared by every signed-in provider screen: a fixed blue-gradient sidebar for
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

  const renderNavLink = ({ to, label, icon: Icon }: NavEntry) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      data-tooltip={label}
    >
      <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
      <span className={styles.navLabel}>{label}</span>
    </NavLink>
  );

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
        <span className={styles.sidebarBg} aria-hidden="true" />
        <Link className={styles.brand} to="/dashboard">
          <LogoMark className={styles.logo} />
          <span className={styles.brandText}>
            <span className={styles.wordmark}>DNX Marketplace</span>
            <span className={styles.wordmarkSub}>Provider Portal</span>
          </span>
        </Link>

        <nav className={styles.nav} aria-label="Main">
          {NAV_MAIN.map(renderNavLink)}
          <hr className={styles.navDivider} aria-hidden="true" />
          {renderNavLink(NAV_ACCOUNT)}
          <span className={styles.navSpacer} aria-hidden="true" />
          {renderNavLink(NAV_HELP)}
        </nav>

        <div className={styles.account}>
          {user?.avatarUrl ? (
            <img className={styles.avatarImg} src={user.avatarUrl} alt="" aria-hidden="true" />
          ) : (
            <span className={styles.avatar} aria-hidden="true">
              {initialsOf(name)}
            </span>
          )}
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
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun size={20} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Moon size={20} strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
          <button
            className={styles.logout}
            onClick={logout}
            type="button"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <button
        type="button"
        className={`${styles.collapseToggle} ${collapsed ? styles.collapseToggleCollapsed : ''}`}
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronsRight size={20} strokeWidth={2.25} aria-hidden="true" />
        ) : (
          <ChevronsLeft size={20} strokeWidth={2.25} aria-hidden="true" />
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
