import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AppShellProps } from './types';
import styles from './AppShell.module.css';

/** Returns up to two initials for the account chip. */
function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Frame shared by every signed-in provider screen: one sticky top bar and a
 * centered content column. Working screens stay on the light surface — the dark
 * ink treatment belongs to auth and marketing.
 */
export function AppShell({ children, topbarExtra, userName, onLogout, wide }: AppShellProps) {
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={`${styles.bar} ${wide ? styles.barWide : ''}`}>
          <Link className={styles.brand} to="/businesses">
            <span className={styles.mark} aria-hidden="true">
              D
            </span>
            <span className={styles.wordmark}>
              DNX <span className={styles.wordmarkThin}>for Business</span>
            </span>
          </Link>

          <div className={styles.right}>
            {topbarExtra}

            {userName && (
              <span className={styles.account} title={userName}>
                <span className={styles.avatar} aria-hidden="true">
                  {initialsOf(userName)}
                </span>
                <span className={styles.accountName}>{userName}</span>
              </span>
            )}

            {onLogout && (
              <button className={styles.logout} onClick={onLogout} type="button">
                <LogOut size={16} aria-hidden="true" />
                <span className={styles.logoutLabel}>Log out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={`${styles.container} ${wide ? styles.containerWide : ''}`}>{children}</main>
    </div>
  );
}
