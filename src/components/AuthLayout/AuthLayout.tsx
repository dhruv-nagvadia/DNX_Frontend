import { ConsolePreview } from './ConsolePreview';
import { AuthLayoutProps } from './types';
import styles from './AuthLayout.module.css';

/**
 * Split-screen auth shell. The left panel is a dark "console" that shows what
 * the provider dashboard actually does; the form (children) sits on the right.
 * Below 1024px the panel collapses to a compact branded header.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.wrapper}>
      <aside className={styles.brand}>
        <div className={styles.brandInner}>
          <a className={styles.logo} href="/">
            <span className={styles.mark} aria-hidden="true">
              D
            </span>
            <span className={styles.wordmark}>
              DNX <span className={styles.wordmarkThin}>for Business</span>
            </span>
          </a>

          <div className={styles.pitch}>
            <h1 className={styles.headline}>
              Run your whole business from <em className={styles.em}>one console</em>.
            </h1>
            <p className={styles.subhead}>
              Bookings, calendar, payments, invoices and customer history — for salons, clinics,
              gyms, tutors and home services.
            </p>
          </div>

          <div className={styles.preview}>
            <ConsolePreview />
          </div>

          <p className={styles.trust}>
            Built for appointment-based businesses across India.
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
