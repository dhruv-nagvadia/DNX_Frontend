import { LogOut, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

import { LogoMark } from '@/components/AppShell/AppShell';
import { useAppShell } from '@/components/AppShell/useAppShell';
import { useTheme } from '@/hooks/useTheme';

import styles from './SiteChrome.module.css';

export interface SiteNavSection {
  /** In-page anchor id (without the leading #). */
  id: string;
  label: string;
}

export interface SiteNavProps {
  /** In-page section links — only the landing page passes these. */
  sections?: SiteNavSection[];
}

/** The account-aware buttons on the right of the public top nav. */
function NavActions() {
  const { user, logout } = useAppShell();

  if (user?.role === 'PROVIDER') {
    return (
      <Link className={`${styles.btn} ${styles.btnSolid}`} to="/dashboard">
        Go to dashboard
      </Link>
    );
  }

  if (user?.role === 'ADMIN') {
    return (
      <Link className={`${styles.btn} ${styles.btnSolid}`} to="/admin/dashboard">
        Admin console
      </Link>
    );
  }

  if (user) {
    // A signed-in customer can list a business with the same account.
    return (
      <>
        <button className={`${styles.btn} ${styles.btnGhost}`} type="button" onClick={logout}>
          <LogOut size={16} strokeWidth={2} aria-hidden="true" />
          <span className={styles.btnLabelXs}>Sign out</span>
        </button>
        <Link className={`${styles.btn} ${styles.btnSolid}`} to="/businesses">
          List your business
        </Link>
      </>
    );
  }

  return (
    <>
      <Link className={`${styles.btn} ${styles.btnGhost}`} to="/login">
        Sign in
      </Link>
      <Link className={`${styles.btn} ${styles.btnSolid}`} to="/register">
        List your business
      </Link>
    </>
  );
}

/** Sticky light top bar shared by the landing page and the legal pages. */
export function SiteNav({ sections }: SiteNavProps) {
  const { theme, toggleTheme } = useTheme();
  const themeLabel = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <header className={styles.nav}>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <div className={styles.navInner}>
        <Link className={styles.brand} to="/" aria-label="DNX Marketplace home">
          <LogoMark className={styles.logo} />
          <span className={styles.wordmark}>DNX Marketplace</span>
        </Link>

        {sections && sections.length > 0 && (
          <nav className={styles.sections} aria-label="Page sections">
            {sections.map((s) => (
              <a key={s.id} className={styles.sectionLink} href={`#${s.id}`}>
                {s.label}
              </a>
            ))}
          </nav>
        )}

        <div className={styles.actions}>
          <button
            className={styles.iconBtn}
            type="button"
            onClick={toggleTheme}
            aria-label={themeLabel}
            title={themeLabel}
          >
            {theme === 'dark' ? (
              <Sun size={18} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Moon size={18} strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
          <NavActions />
        </div>
      </div>
    </header>
  );
}

/** Footer shared by the landing page and the legal pages. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <span className={styles.footerLogoRow}>
            <LogoMark className={styles.logo} />
            <span className={styles.wordmarkFooter}>DNX Marketplace</span>
          </span>
          <p className={styles.footerTag}>
            {/* SERVICES-ONLY: store/order copy disabled for launch — restore the commented original: Book local services and order from nearby stores — all in one place. */}
            Book local services near you — all in one place.
          </p>
        </div>

        <nav className={styles.footerLinks} aria-label="Legal">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/refund-policy">Refund &amp; Cancellation</Link>
        </nav>
      </div>
      <div className={styles.footerBottom}>
        <p>© {year} DNX Marketplace. All rights reserved.</p>
      </div>
    </footer>
  );
}
