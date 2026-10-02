import { ReactNode } from 'react';

// Reuses the provider AuthLayout's split-screen mechanics (grid, aurora
// background, responsive collapse) — only the copy below is admin-specific.
// Kept as its own component (not a prop on AuthLayout) so admin-only code
// stays physically separate from the provider-facing auth screens.
import styles from '@/components/AuthLayout/AuthLayout.module.css';

interface AdminAuthLayoutProps {
  children: ReactNode;
}

/** Split-screen shell for the unlisted admin console's login page. */
export function AdminAuthLayout({ children }: AdminAuthLayoutProps) {
  return (
    <div className={styles.wrapper}>
      <aside className={styles.brand}>
        <div className={styles.brandInner}>
          <div className={styles.logo}>
            <span className={styles.mark} aria-hidden="true">
              D
            </span>
            <span className={styles.wordmark}>
              DNX <span className={styles.wordmarkThin}>Admin</span>
            </span>
          </div>

          <div className={styles.pitch}>
            <h1 className={styles.headline}>
              Platform <em className={styles.em}>control</em>, in one place.
            </h1>
            <p className={styles.subhead}>
              Internal console for managing DNX itself — not customer or provider facing.
            </p>
          </div>

          <p className={styles.trust}>
            Restricted access.
            <span className={styles.copyright}>© {new Date().getFullYear()} DNX</span>
          </p>
        </div>
      </aside>

      <main className={styles.formPanel}>
        <div className={styles.formCard}>{children}</div>
      </main>
    </div>
  );
}
