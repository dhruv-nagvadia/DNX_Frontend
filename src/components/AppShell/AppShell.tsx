import { LogOut, Store, UserRound } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

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
  { to: '/businesses', label: 'Businesses', icon: Store },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

/**
 * Frame shared by every signed-in provider screen: a fixed navy sidebar for
 * app navigation and account controls, an optional section rail, and the
 * light content area. On narrow screens the sidebar becomes a top bar.
 */
export function AppShell({ children, rail, wide }: AppShellProps) {
  const { user, logout } = useAppShell();
  const name = user?.fullName ?? 'DNX';

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} to="/businesses">
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

      {rail ? (
        <div className={styles.withRail}>
          <div className={styles.rail}>{rail}</div>
          <main className={`${styles.content} ${wide ? styles.contentWide : ''}`}>{children}</main>
        </div>
      ) : (
        <main className={`${styles.content} ${wide ? styles.contentWide : ''}`}>{children}</main>
      )}
    </div>
  );
}
